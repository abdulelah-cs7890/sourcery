"use client";

// Browser-native keyframe extraction via <video> + <canvas>.
//
// We previously used @ffmpeg/ffmpeg (single-threaded WASM) for this, but
// extraction on a typical short TikTok was taking 60+ seconds per frame
// — unusable. The native HTMLVideoElement + Canvas approach is
// hardware-accelerated, instant, and works for every codec the browser
// can play (MP4/H.264/HEVC is universal).
//
// The function signature matches the previous ffmpeg.wasm implementation
// so callers don't change.

export async function extractFramesInBrowser(
  file: File,
  count = 5,
  onProgress?: (label: string) => void,
): Promise<Blob[]> {
  onProgress?.("Loading video…");

  const objectUrl = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.preload = "auto";
  video.muted = true;
  video.playsInline = true;
  video.crossOrigin = "anonymous";
  video.src = objectUrl;

  try {
    await waitForEvent(video, "loadeddata");

    const duration =
      Number.isFinite(video.duration) && video.duration > 0
        ? video.duration
        : 10;

    // Downscale large frames — Google Lens doesn't need full resolution
    // and smaller JPGs upload faster.
    const MAX_WIDTH = 720;
    const srcWidth = video.videoWidth || MAX_WIDTH;
    const srcHeight = video.videoHeight || MAX_WIDTH;
    const scale = Math.min(1, MAX_WIDTH / srcWidth);
    const width = Math.round(srcWidth * scale);
    const height = Math.round(srcHeight * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) throw new Error("Could not get 2D canvas context");

    const blobs: Blob[] = [];
    for (let i = 0; i < count; i++) {
      onProgress?.(`Extracting frame ${i + 1}/${count}…`);
      const t = ((i + 0.5) / count) * duration;
      await seekTo(video, t);
      ctx.drawImage(video, 0, 0, width, height);
      const blob = await canvasToJpegBlob(canvas);
      blobs.push(blob);
    }

    onProgress?.("Frames ready");
    return blobs;
  } finally {
    URL.revokeObjectURL(objectUrl);
    video.removeAttribute("src");
    video.load();
  }
}

function waitForEvent(
  el: HTMLMediaElement,
  event: keyof HTMLMediaElementEventMap,
  timeoutMs = 30_000,
): Promise<void> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const onOk = () => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve();
    };
    const onErr = () => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error(`Video failed to ${event}`));
    };
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error(`Video ${event} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
    const cleanup = () => {
      el.removeEventListener(event, onOk);
      el.removeEventListener("error", onErr);
      clearTimeout(timer);
    };
    el.addEventListener(event, onOk, { once: true });
    el.addEventListener("error", onErr, { once: true });
  });
}

function seekTo(video: HTMLVideoElement, t: number): Promise<void> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const onSeeked = () => {
      if (settled) return;
      settled = true;
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onErr);
      resolve();
    };
    const onErr = () => {
      if (settled) return;
      settled = true;
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onErr);
      reject(new Error(`Seek to ${t}s failed`));
    };
    video.addEventListener("seeked", onSeeked, { once: true });
    video.addEventListener("error", onErr, { once: true });
    video.currentTime = Math.max(0, Math.min(t, video.duration - 0.05));
  });
}

function canvasToJpegBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("canvas.toBlob returned null"));
      },
      "image/jpeg",
      0.85,
    );
  });
}
