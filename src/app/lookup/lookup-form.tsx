"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import CaptionFallback from "./caption-fallback";
import VideoDropZone from "./video-drop-zone";

type Status = "idle" | "submitting" | "uploading" | "error" | "fallback";

export default function LookupForm() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [progressMsg, setProgressMsg] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg("");
    try {
      const res = await fetch("/api/lookup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tiktokUrl: url }),
      });
      const rawText = await res.text();
      let data: Record<string, unknown> | null = null;
      try {
        data = rawText ? (JSON.parse(rawText) as Record<string, unknown>) : null;
      } catch {
        // body wasn't JSON — surface res.status + rawText below
      }

      if (res.status === 429) {
        setStatus("error");
        setErrorMsg("Daily limit reached. Come back tomorrow or upgrade.");
        return;
      }

      if (res.status === 422 && data?.reason === "ingestion_failed") {
        setStatus("fallback");
        return;
      }

      if (!res.ok || !data) {
        setStatus("error");
        const body = rawText.slice(0, 300) || "(empty body)";
        setErrorMsg(
          `Server returned ${res.status} ${res.statusText}. Body: ${body}`,
        );
        return;
      }

      router.push(`/lookup/${data.id}`);
    } catch (err) {
      setStatus("error");
      setErrorMsg(String(err));
    }
  }

  async function onUploadFile(file: File) {
    setStatus("uploading");
    setErrorMsg("");
    setProgressMsg("Loading video engine…");
    try {
      const { extractFramesInBrowser } = await import("./video-processor");
      const frames = await extractFramesInBrowser(file, 5, (label) =>
        setProgressMsg(label),
      );

      setProgressMsg("Uploading frames…");
      const fd = new FormData();
      for (let i = 0; i < frames.length; i++) {
        fd.append(`frame_${i}`, frames[i], `frame_${i}.jpg`);
      }

      const res = await fetch("/api/lookup/upload", {
        method: "POST",
        body: fd,
      });
      const rawText = await res.text();
      let data: Record<string, unknown> | null = null;
      try {
        data = rawText ? (JSON.parse(rawText) as Record<string, unknown>) : null;
      } catch {
        // not JSON
      }

      if (res.status === 429) {
        setStatus("error");
        setErrorMsg("Daily limit reached. Come back tomorrow or upgrade.");
        return;
      }

      if (!res.ok || !data) {
        setStatus("error");
        const body = rawText.slice(0, 300) || "(empty body)";
        setErrorMsg(
          `Server returned ${res.status} ${res.statusText}. Body: ${body}`,
        );
        return;
      }

      router.push(`/lookup/${data.id}`);
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : String(err));
    }
  }

  if (status === "fallback") {
    return (
      <div className="space-y-4">
        <p className="text-sm text-amber-200/90 bg-amber-950/40 border border-amber-900/60 rounded-2xl p-4">
          Couldn&apos;t fetch that TikTok automatically (it may be private,
          removed, or geo-blocked). Either paste the caption below — or drop
          the downloaded .mp4 and we&apos;ll search the actual video frames.
        </p>
        <CaptionFallback />
      </div>
    );
  }

  const submitting = status === "submitting" || status === "uploading";

  return (
    <div className="space-y-5">
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          type="url"
          required
          placeholder="https://www.tiktok.com/@user/video/..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] placeholder:text-[var(--color-text-faint)] px-5 py-3 text-sm focus:outline-none focus:border-[var(--color-accent)] focus:shadow-[var(--shadow-glow-lime)] transition disabled:opacity-50"
          disabled={submitting}
        />
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-full bg-[var(--color-accent)] text-[var(--color-accent-text)] px-5 py-3 text-sm font-semibold shadow-[var(--shadow-glow-lime)] hover:bg-[var(--color-accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {status === "submitting" ? "Processing…" : "Find source →"}
        </button>
      </form>

      <div className="relative flex items-center py-1">
        <div className="flex-grow border-t border-[var(--color-border)]" />
        <span className="mx-3 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-faint)]">
          <span className="inline-block w-1 h-1 rounded-full bg-[var(--color-accent)]" />
          or
        </span>
        <div className="flex-grow border-t border-[var(--color-border)]" />
      </div>

      <VideoDropZone
        onFile={onUploadFile}
        disabled={submitting}
        hint={
          status === "uploading"
            ? progressMsg || "Processing…"
            : "Drop a TikTok .mp4 here for visual matching"
        }
      />
      <p className="text-xs text-[var(--color-text-muted)]">
        When TikTok blocks the URL path, download the video yourself and drop
        it here. Keyframes are extracted in your browser (no upload of the
        full video) and we give you Google Lens reverse-search links.
      </p>

      {errorMsg && (
        <pre className="rounded-2xl bg-red-950/40 border border-red-900/60 text-red-200 p-4 text-xs whitespace-pre-wrap">
          {errorMsg}
        </pre>
      )}
    </div>
  );
}
