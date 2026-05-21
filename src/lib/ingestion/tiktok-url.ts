import ytdlp from "yt-dlp-exec";
import { IngestionError, type VideoMeta } from "./types";

type YtDlpInfo = {
  id?: string;
  description?: string;
  title?: string;
  uploader?: string;
  uploader_id?: string;
  thumbnail?: string;
  duration?: number;
};

export async function fetchTikTokMeta(url: string): Promise<VideoMeta> {
  let info: YtDlpInfo;
  try {
    info = (await ytdlp(url, {
      dumpSingleJson: true,
      skipDownload: true,
      noWarnings: true,
      noPlaylist: true,
      noCheckCertificate: true,
    })) as YtDlpInfo;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw mapYtDlpError(msg);
  }

  return {
    id: String(info.id ?? ""),
    caption: String(info.description ?? info.title ?? ""),
    title: String(info.title ?? ""),
    uploader: String(info.uploader ?? info.uploader_id ?? ""),
    thumbnailUrl: typeof info.thumbnail === "string" ? info.thumbnail : null,
    durationSec:
      typeof info.duration === "number" ? Math.round(info.duration) : null,
  };
}

export async function downloadTikTokVideo(
  url: string,
  outPath: string,
): Promise<void> {
  try {
    await ytdlp(url, {
      format: "mp4",
      output: outPath,
      noWarnings: true,
      noPlaylist: true,
      noCheckCertificate: true,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw mapYtDlpError(msg);
  }
}

function mapYtDlpError(message: string): IngestionError {
  const lower = message.toLowerCase();
  if (lower.includes("private") || lower.includes("login required")) {
    return new IngestionError("private", message);
  }
  if (
    lower.includes("video unavailable") ||
    lower.includes("does not exist") ||
    lower.includes("removed") ||
    lower.includes("not found")
  ) {
    return new IngestionError("unreachable", message);
  }
  if (lower.includes("unsupported url")) {
    return new IngestionError("unsupported", message);
  }
  if (lower.includes("timed out") || lower.includes("timeout")) {
    return new IngestionError("timeout", message);
  }
  return new IngestionError("unknown", message);
}
