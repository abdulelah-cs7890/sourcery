import { put } from "@vercel/blob";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db, lookups } from "@/lib/db";

export const runtime = "nodejs";
export const maxDuration = 30;

const FRAME_COUNT = 5;
const MAX_FRAME_BYTES = 2 * 1024 * 1024;

/**
 * Stream B: receives 5 client-extracted JPG keyframes for a URL-mode lookup
 * and persists them to Vercel Blob + the lookup row. Companion to
 * `/api/lookup/upload` — same Blob layout, different trigger.
 */
export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    return await handlePost(req, ctx);
  } catch (err) {
    console.error("/api/lookup/[id]/frames top-level error", err);
    return NextResponse.json(
      {
        error: "internal_error",
        message: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}

async function handlePost(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  const [lookup] = await db
    .select({ id: lookups.id, frameUrls: lookups.frameUrls })
    .from(lookups)
    .where(and(eq(lookups.id, id), eq(lookups.userId, session.user.id)));

  if (!lookup) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if ((lookup.frameUrls?.length ?? 0) > 0) {
    return NextResponse.json(
      { error: "already_extracted", frameUrls: lookup.frameUrls },
      { status: 409 },
    );
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

  const frameUrls: string[] = [];
  for (let i = 0; i < frameFiles.length; i++) {
    const bytes = Buffer.from(await frameFiles[i].arrayBuffer());
    const { url } = await put(`frames/${id}/${i}.jpg`, bytes, {
      access: "public",
      contentType: "image/jpeg",
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    frameUrls.push(url);
  }

  await db
    .update(lookups)
    .set({ frameUrls })
    .where(eq(lookups.id, id));

  return NextResponse.json({ ok: true, frameUrls });
}
