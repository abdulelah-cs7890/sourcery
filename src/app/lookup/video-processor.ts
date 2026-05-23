"use client";

// Browser-side keyframe extraction via @ffmpeg/ffmpeg (WebAssembly).
//
// Why this lives in the browser: Vercel's Linux serverless runtime doesn't
// reliably execute ffmpeg-static; the binary either crashes or its
// process spawn fails silently. Running ffmpeg in the user's browser
// removes that dependency entirely — only the resulting JPGs travel to the
// server.
//
// Uses the single-threaded ffmpeg-core build so SharedArrayBuffer (and the
// COOP/COEP headers it requires) aren't needed. Slower than core-mt but
// fine for 5 keyframes from a typical short video.

import { fetchFile, toBlobURL } from "@ffmpeg/util";

type FFmpegInstance = import("@ffmpeg/ffmpeg").FFmpeg;

const FFMPEG_VERSION = "0.12.10";
const CORE_BASE_URL = `https://unpkg.com/@ffmpeg/core@${FFMPEG_VERSION}/dist/umd`;

let cachedFfmpeg: FFmpegInstance | null = null;
let loadingPromise: Promise<FFmpegInstance> | null = null;

async function getFFmpeg(): Promise<FFmpegInstance> {
  if (cachedFfmpeg) return cachedFfmpeg;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    const { FFmpeg } = await import("@ffmpeg/ffmpeg");
    const ffmpeg = new FFmpeg();
    await ffmpeg.load({
      coreURL: await toBlobURL(
        `${CORE_BASE_URL}/ffmpeg-core.js`,
        "text/javascript",
      ),
      wasmURL: await toBlobURL(
        `${CORE_BASE_URL}/ffmpeg-core.wasm`,
        "application/wasm",
      ),
    });
    cachedFfmpeg = ffmpeg;
    return ffmpeg;
  })();

  return loadingPromise;
}

function getVideoDurationSec(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.src = url;
    video.addEventListener("loadedmetadata", () => {
      URL.revokeObjectURL(url);
      const d = video.duration;
      resolve(Number.isFinite(d) && d > 0 ? d : 10);
    });
    video.addEventListener("error", () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read video metadata"));
    });
  });
}

export async function extractFramesInBrowser(
  file: File,
  count = 5,
  onProgress?: (label: string) => void,
): Promise<Blob[]> {
  onProgress?.("Loading video engine…");
  const ffmpeg = await getFFmpeg();

  onProgress?.("Reading video metadata…");
  const duration = await getVideoDurationSec(file);

  onProgress?.("Loading video bytes…");
  await ffmpeg.writeFile("input.mp4", await fetchFile(file));

  const blobs: Blob[] = [];
  for (let i = 0; i < count; i++) {
    onProgress?.(`Extracting frame ${i + 1}/${count}…`);
    const t = (((i + 0.5) / count) * duration).toFixed(3);
    const outName = `frame_${i}.jpg`;
    await ffmpeg.exec([
      "-ss",
      t,
      "-i",
      "input.mp4",
      "-vframes",
      "1",
      "-q:v",
      "2",
      "-y",
      outName,
    ]);
    const data = await ffmpeg.readFile(outName);
    if (typeof data === "string") {
      throw new Error("Unexpected string output from ffmpeg readFile");
    }
    blobs.push(new Blob([data as BlobPart], { type: "image/jpeg" }));
    try {
      await ffmpeg.deleteFile(outName);
    } catch {
      // best-effort cleanup
    }
  }

  try {
    await ffmpeg.deleteFile("input.mp4");
  } catch {
    // best-effort cleanup
  }

  onProgress?.("Frames ready");
  return blobs;
}
