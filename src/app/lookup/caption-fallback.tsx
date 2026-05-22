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
    try {
      const fd = new FormData();
      fd.append("video", file);
      // Use whatever caption the user typed (may be empty)
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
      setErrorMsg(String(err));
    }
  }

  const submitting = status === "submitting" || status === "uploading";

  return (
    <div className="space-y-4">
      <form onSubmit={onSubmitCaption} className="space-y-3">
        <textarea
          rows={4}
          placeholder="Paste the TikTok caption here…"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
          disabled={submitting}
        />
        <button
          type="submit"
          disabled={submitting || caption.trim().length < 3}
          className="rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === "submitting" ? "Processing…" : "Search from caption"}
        </button>
      </form>

      <div className="relative flex items-center py-2">
        <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800" />
        <span className="mx-3 text-xs uppercase tracking-wide text-zinc-400">
          or also
        </span>
        <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800" />
      </div>

      <VideoDropZone
        onFile={onUploadFile}
        disabled={submitting}
        hint={
          status === "uploading"
            ? "Uploading…"
            : "Drop the downloaded .mp4 here for visual matching"
        }
      />
      <p className="text-xs text-zinc-500">
        Uploading the video unlocks Google Lens reverse-search of the actual
        keyframes — the best signal when the caption is generic. If you also
        typed a caption above, both run.
      </p>

      {errorMsg && (
        <pre className="rounded-md bg-red-50 dark:bg-red-950 text-red-900 dark:text-red-200 p-3 text-xs whitespace-pre-wrap">
          {errorMsg}
        </pre>
      )}
    </div>
  );
}
