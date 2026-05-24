import { put } from "@vercel/blob";
import { waitUntil } from "@vercel/functions";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db, lookups } from "@/lib/db";
import { fetchViaSsstik } from "@/lib/ingestion/ssstik";
import { IngestionError } from "@/lib/ingestion/types";
import { runLookup } from "@/lib/pipeline/run-lookup";
import { lookupRatelimit } from "@/lib/redis";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYNC_BUDGET_MS = 25_000;
const TIMEOUT_SENTINEL = Symbol("TIMEOUT");

const bodySchema = z.object({
  tiktokUrl: z
    .string()
    .url()
    .refine(
      (v) => /tiktok\.com|vm\.tiktok\.com/.test(v),
      "Must be a TikTok URL",
    ),
});

export async function POST(req: Request) {
  try {
    return await handlePost(req);
  } catch (err) {
    console.error("/api/lookup top-level error", err);
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

  const json = (await req.json().catch(() => null)) as unknown;
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_body", issues: parsed.error.issues },
      { status: 400 },
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

  const [row] = await db
    .insert(lookups)
    .values({
      userId: session.user.id,
      tiktokUrl: parsed.data.tiktokUrl,
      status: "pending",
    })
    .returning({ id: lookups.id });

  const lookupId = row.id;

  // Stream B: ssstik returns both the caption and a watermark-free mp4 URL in
  // one shot. Replaces the prior yt-dlp-exec call (which needed Python 3 that
  // Vercel serverless doesn't have).
  let ssstik: Awaited<ReturnType<typeof fetchViaSsstik>>;
  try {
    ssstik = await fetchViaSsstik(parsed.data.tiktokUrl);
  } catch (err) {
    if (err instanceof IngestionError) {
      // Mark lookup failed so the result page surfaces CaptionFallback.
      await db
        .update(lookups)
        .set({
          status: "failed",
          errorMessage: `ingestion:${err.code}:${err.message}`,
        })
        .where(eq(lookups.id, lookupId));
      return NextResponse.json(
        {
          id: lookupId,
          status: "failed",
          reason: "ingestion_failed",
          code: err.code,
          retryWithCaption: true,
        },
        { status: 422 },
      );
    }
    throw err;
  }

  // Background: download the mp4 to our Blob so the client can fetch it
  // CORS-safely and extract keyframes in the browser. Best-effort — if it
  // fails, the lookup still completes with matches, just no frame strip.
  waitUntil(downloadVideoToBlob(lookupId, ssstik.mp4Url));

  // Matchers run synchronously with a 25s budget; overflow goes to background.
  const pipelinePromise = runLookup(lookupId, ssstik.caption);
  const timeoutPromise = new Promise<typeof TIMEOUT_SENTINEL>((resolve) =>
    setTimeout(() => resolve(TIMEOUT_SENTINEL), SYNC_BUDGET_MS),
  );

  try {
    const result = await Promise.race([pipelinePromise, timeoutPromise]);

    if (result === TIMEOUT_SENTINEL) {
      waitUntil(
        pipelinePromise.catch((e) =>
          console.error("Background lookup failed", lookupId, e),
        ),
      );
      return NextResponse.json({
        id: lookupId,
        status: "processing",
        async: true,
        remaining,
      });
    }

    return NextResponse.json({
      id: lookupId,
      status: "completed",
      matches: result,
      remaining,
    });
  } catch (err) {
    return NextResponse.json(
      {
        id: lookupId,
        status: "failed",
        reason: "pipeline_error",
        message: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}

async function downloadVideoToBlob(
  lookupId: string,
  mp4Url: string,
): Promise<void> {
  try {
    const res = await fetch(mp4Url, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        accept: "video/mp4,video/*;q=0.9,*/*;q=0.5",
      },
    });
    if (!res.ok) {
      console.error(
        "downloadVideoToBlob: source returned",
        res.status,
        mp4Url,
      );
      return;
    }
    const bytes = Buffer.from(await res.arrayBuffer());
    const { url } = await put(`videos/${lookupId}.mp4`, bytes, {
      access: "public",
      contentType: "video/mp4",
      addRandomSuffix: false,
      allowOverwrite: true,
    });
    await db
      .update(lookups)
      .set({ videoBlobUrl: url })
      .where(eq(lookups.id, lookupId));
  } catch (err) {
    console.error("downloadVideoToBlob failed", lookupId, err);
  }
}
