import { spawn } from "node:child_process";
import path from "node:path";
import os from "node:os";
import ffmpegStatic from "ffmpeg-static";

const FFMPEG_PATH = ffmpegStatic;

if (!FFMPEG_PATH) {
  throw new Error("ffmpeg-static did not resolve a binary path");
}

// Extract `count` keyframes from `videoPath`, evenly spaced across the video's
// duration. Returns the paths to the JPG files in os.tmpdir().
export async function extractFrames(
  videoPath: string,
  count: number,
  durationSec: number,
  lookupId: string,
): Promise<string[]> {
  const safeCount = Math.max(1, Math.min(8, count));
  const safeDuration =
    Number.isFinite(durationSec) && durationSec > 0 ? durationSec : 10;

  // Evenly distribute timestamps: for N=5 → 10%, 30%, 50%, 70%, 90% of duration
  const timestamps = Array.from({ length: safeCount }, (_, i) =>
    Math.max(0, ((i + 0.5) / safeCount) * safeDuration),
  );

  const outDir = os.tmpdir();
  const outPaths: string[] = [];

  for (let i = 0; i < timestamps.length; i++) {
    const outPath = path.join(outDir, `sourcery-${lookupId}-${i}.jpg`);
    await runFfmpeg([
      "-y",
      "-ss",
      timestamps[i].toFixed(3),
      "-i",
      videoPath,
      "-vframes",
      "1",
      "-q:v",
      "2",
      outPath,
    ]);
    outPaths.push(outPath);
  }

  return outPaths;
}

function runFfmpeg(args: string[]): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const proc = spawn(FFMPEG_PATH as string, args, { stdio: "ignore" });
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited with code ${code}`));
    });
    proc.on("error", reject);
  });
}
