import { put } from "@vercel/blob";
import { waitUntil } from "@vercel/functions";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db, lookups } from "@/lib/db";
import { runLookup } from "@/lib/pipeline/run-lookup";
import { lookupRatelimit } from "@/lib/redis";

export const runtime = "nodejs";
export const maxDuration = 60;

const FRAME_COUNT = 5;
const MAX_FRAME_BYTES = 2 * 1024 * 1024; // 2 MB per JPG — generous cap

// Accepts client-extracted JPG keyframes + optional caption.
// Client did ffmpeg.wasm extraction in-browser, so server only deals with
// final JPGs (much smaller than the original .mp4) + Blob upload.
export async function POST(req: Request) {
  try {
    return await handlePost(req);
  } catch (err) {
    console.error("/api/lookup/upload top-level error", err);
    return NextResponse.json(
      {
        error: "internal_error",
        message: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}

async function handlePost(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "invalid_form", message: "Expected multipart/form-data." },
      { status: 400 },
    );
  }

  const captionInput = (formData.get("caption") ?? "").toString().trim();

  const frameFiles: File[] = [];
  for (let i = 0; i < FRAME_COUNT; i++) {
    const f = formData.get(`frame_${i}`);
    if (!(f instanceof File)) {
      return NextResponse.json(
        { error: "missing_frame", message: `Missing frame_${i}` },
        { status: 400 },
      );
    }
    if (f.size === 0) {
      return NextResponse.json(
        { error: "empty_frame", message: `frame_${i} is empty` },
        { status: 400 },
      );
    }
    if (f.size > MAX_FRAME_BYTES) {
      return NextResponse.json(
        {
          error: "frame_too_large",
          message: `frame_${i} > ${Math.round(MAX_FRAME_BYTES / 1024 / 1024)} MB`,
        },
        { status: 413 },
      );
    }
    if (!f.type.startsWith("image/")) {
      return NextResponse.json(
        {
          error: "invalid_frame_type",
          message: `frame_${i} type '${f.type}' is not an image`,
        },
        { status: 400 },
      );
    }
    frameFiles.push(f);
  }

  const { success, remaining } = await lookupRatelimit.limit(
    session.user.id,
  );
  if (!success) {
    return NextResponse.json(
      { error: "rate_limited", remaining },
      { status: 429 },
    );
  }

  // Create lookup row first so we have a stable id for Blob paths.
  // tiktokUrl = "upload://..." sentinel keeps LookupPoller.hasVideo true.
  const [row] = await db
    .insert(lookups)
    .values({
      userId: session.user.id,
      tiktokUrl: "upload://video.mp4",
      caption: captionInput || null,
      status: "pending",
    })
    .returning({ id: lookups.id });
  const lookupId = row.id;

  // Upload each JPG to Vercel Blob.
  const frameUrls: string[] = [];
  for (let i = 0; i < frameFiles.length; i++) {
    const bytes = Buffer.from(await frameFiles[i].arrayBuffer());
    const { url } = await put(`frames/${lookupId}/${i}.jpg`, bytes, {
      access: "public",
      contentType: "image/jpeg",
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    frameUrls.push(url);
  }

  if (captionInput) {
    // Frames in, matchers still running. Status flips to completed when runLookup finishes.
    await db
      .update(lookups)
      .set({ frameUrls, status: "processing" })
      .where(eq(lookups.id, lookupId));
    waitUntil(
      runLookup(lookupId, captionInput).catch((e) =>
        console.error("upload matchers failed", lookupId, e),
      ),
    );
  } else {
    // No caption → no matchers. Everything is done.
    await db
      .update(lookups)
      .set({
        frameUrls,
        status: "completed",
        completedAt: new Date(),
      })
      .where(eq(lookups.id, lookupId));
  }

  return NextResponse.json({
    id: lookupId,
    status: captionInput ? "processing" : "completed",
    frameUrls,
    remaining,
  });
}
