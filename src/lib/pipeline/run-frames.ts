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

// Best-effort background job: yt-dlp downloads .mp4, ffmpeg extracts keyframes,
// @vercel/blob hosts them publicly, lookup row gets frame URLs persisted.
// Every error is caught and reported to Sentry; nothing bubbles up so the
// surrounding /api/lookup response stays successful.
export async function runFrameExtraction(
  lookupId: string,
  tiktokUrl: string,
): Promise<void> {
  const tempVideoPath = path.join(os.tmpdir(), `sourcery-${lookupId}.mp4`);
  let framePaths: string[] = [];

  try {
    const meta = await fetchTikTokMeta(tiktokUrl);
    const duration = meta.durationSec ?? 10;

    await downloadTikTokVideo(tiktokUrl, tempVideoPath);

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
    Sentry.captureException(err, { tags: { stage: "frame-extraction", lookupId } });
  } finally {
    await safeUnlink(tempVideoPath);
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
