import { waitUntil } from "@vercel/functions";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { auth } from "@/auth";
import { db, lookups } from "@/lib/db";
import { runFrameExtraction } from "@/lib/pipeline/run-frames";
import { runLookup } from "@/lib/pipeline/run-lookup";
import { lookupRatelimit } from "@/lib/redis";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BYTES = 50 * 1024 * 1024; // 50 MB
const ALLOWED_PREFIX = "video/";

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

  const file = formData.get("video");
  const captionInput = (formData.get("caption") ?? "").toString().trim();

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "missing_video", message: "Expected a 'video' file field." },
      { status: 400 },
    );
  }
  if (!file.type.startsWith(ALLOWED_PREFIX)) {
    return NextResponse.json(
      {
        error: "invalid_type",
        message: `File must be a video (got '${file.type}').`,
      },
      { status: 400 },
    );
  }
  if (file.size === 0) {
    return NextResponse.json(
      { error: "empty_file", message: "File is empty." },
      { status: 400 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      {
        error: "file_too_large",
        message: `Max ${Math.round(MAX_BYTES / 1024 / 1024)} MB.`,
      },
      { status: 413 },
    );
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

  // Persist the lookup row first so we have a stable id for the temp file +
  // Blob keys. `tiktok_url` gets an "upload://" sentinel so LookupPoller's
  // `hasVideo` derivation (tiktokUrl !== null) correctly waits for frames.
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

  // Buffer the upload to /tmp so the background frame-extraction job can read it.
  const buf = Buffer.from(await file.arrayBuffer());
  const tempPath = path.join(os.tmpdir(), `sourcery-upload-${lookupId}.mp4`);
  await writeFile(tempPath, buf);

  // Frame extraction always runs — we have the video bytes.
  waitUntil(
    runFrameExtraction(lookupId, {
      kind: "file",
      path: tempPath,
      deleteAfter: true,
    }),
  );

  // If the user also gave us a caption, kick off matchers in parallel.
  // Otherwise mark the lookup completed now so the result page doesn't stay
  // in "processing" forever — the FrameStrip still arrives via polling.
  if (captionInput) {
    waitUntil(
      runLookup(lookupId, "caption", captionInput).catch((e) =>
        console.error("upload matchers failed", lookupId, e),
      ),
    );
  } else {
    await db
      .update(lookups)
      .set({ status: "completed", completedAt: new Date() })
      .where(eq(lookups.id, lookupId));
  }

  return NextResponse.json({
    id: lookupId,
    status: captionInput ? "processing" : "completed",
    async: true,
    remaining,
  });
}
