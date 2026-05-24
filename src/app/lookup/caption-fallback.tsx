"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import VideoDropZone from "./video-drop-zone";

type Status = "idle" | "submitting" | "uploading" | "error";

export default function CaptionFallback() {
  const router = useRouter();
  const [caption, setCaption] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [progressMsg, setProgressMsg] = useState("");

  async function onSubmitCaption(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg("");
    try {
      const res = await fetch("/api/lookup/caption", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ caption }),
      });
      const data = await res.json();
      if (res.status === 429) {
        setStatus("error");
        setErrorMsg("Daily limit reached. Come back tomorrow or upgrade.");
        return;
      }
      if (!res.ok) {
        setStatus("error");
        setErrorMsg(data.message ?? data.error ?? "Something went wrong");
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
      if (caption.trim()) fd.append("caption", caption.trim());

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

  const submitting = status === "submitting" || status === "uploading";

  return (
    <div className="space-y-5">
      <form onSubmit={onSubmitCaption} className="space-y-3">
        <textarea
          rows={4}
          placeholder="Paste the TikTok caption here…"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] placeholder:text-[var(--color-text-faint)] px-5 py-3 text-sm focus:outline-none focus:border-[var(--color-accent)] focus:shadow-[var(--shadow-glow-lime)] transition disabled:opacity-50"
          disabled={submitting}
        />
        <button
          type="submit"
          disabled={submitting || caption.trim().length < 3}
          className="w-full rounded-full bg-[var(--color-accent)] text-[var(--color-accent-text)] px-5 py-3 text-sm font-semibold shadow-[var(--shadow-glow-lime)] hover:bg-[var(--color-accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {status === "submitting" ? "Processing…" : "Search from caption →"}
        </button>
      </form>

      <div className="relative flex items-center py-1">
        <div className="flex-grow border-t border-[var(--color-border)]" />
        <span className="mx-3 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-faint)]">
          <span className="inline-block w-1 h-1 rounded-full bg-[var(--color-accent)]" />
          or also
        </span>
        <div className="flex-grow border-t border-[var(--color-border)]" />
      </div>

      <VideoDropZone
        onFile={onUploadFile}
        disabled={submitting}
        hint={
          status === "uploading"
            ? progressMsg || "Processing…"
            : "Drop the downloaded .mp4 here for visual matching"
        }
      />
      <p className="text-xs text-[var(--color-text-muted)]">
        Uploading the video unlocks Google Lens reverse-search of the actual
        keyframes — the best signal when the caption is generic. If you also
        typed a caption above, both run.
      </p>

      {errorMsg && (
        <pre className="rounded-2xl bg-red-950/40 border border-red-900/60 text-red-200 p-4 text-xs whitespace-pre-wrap">
          {errorMsg}
        </pre>
      )}
    </div>
  );
}
