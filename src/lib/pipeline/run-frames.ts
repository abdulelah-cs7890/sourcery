import { unlink } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import * as Sentry from "@sentry/nextjs";
import { eq } from "drizzle-orm";
import { uploadFrames } from "@/lib/blob/upload";
import { db, lookups } from "@/lib/db";
import { extractFrames } from "@/lib/frames/extract";
import {
  downloadTikTokVideo,
  fetchTikTokMeta,
} from "@/lib/ingestion/tiktok-url";

const FRAME_COUNT = 5;
// Used when we don't know the actual video duration (file uploads). ffmpeg
// will just silently emit fewer frames if the video is shorter, which is fine.
const FALLBACK_DURATION_SEC = 30;

export type VideoSource =
  | { kind: "url"; url: string }
  | { kind: "file"; path: string; deleteAfter?: boolean };

// Best-effort background job: gets the video bytes, ffmpeg extracts keyframes,
// @vercel/blob hosts them publicly, lookup row gets frame URLs persisted.
// Every error is caught and reported to Sentry; nothing bubbles up so the
// surrounding /api/lookup response stays successful.
export async function runFrameExtraction(
  lookupId: string,
  source: VideoSource,
): Promise<void> {
  const tempVideoPath =
    source.kind === "url"
      ? path.join(os.tmpdir(), `sourcery-${lookupId}.mp4`)
      : source.path;
  const ownsVideoFile = source.kind === "url" || source.deleteAfter === true;
  let framePaths: string[] = [];

  try {
    let duration = FALLBACK_DURATION_SEC;

    if (source.kind === "url") {
      const meta = await fetchTikTokMeta(source.url);
      duration = meta.durationSec ?? FALLBACK_DURATION_SEC;
      await downloadTikTokVideo(source.url, tempVideoPath);
    }
    // For "file" source: the upload route has already written the .mp4 to disk
    // and points us at it. We don't know the duration without ffprobe; the
    // FALLBACK_DURATION_SEC sample window is good enough for v1 — ffmpeg
    // produces fewer frames than requested if the video is shorter.

    framePaths = await extractFrames(
      tempVideoPath,
      FRAME_COUNT,
      duration,
      lookupId,
    );

    const urls = await uploadFrames(framePaths, lookupId);

    await db
      .update(lookups)
      .set({ frameUrls: urls })
      .where(eq(lookups.id, lookupId));
  } catch (err) {
    Sentry.captureException(err, {
      tags: { stage: "frame-extraction", lookupId },
    });
  } finally {
    if (ownsVideoFile) await safeUnlink(tempVideoPath);
    for (const p of framePaths) {
      await safeUnlink(p);
    }
  }
}

async function safeUnlink(p: string): Promise<void> {
  try {
    await unlink(p);
  } catch {
    // file may not exist or already removed; ignore
  }
}
