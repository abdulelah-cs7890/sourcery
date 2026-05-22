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
    try {
      const fd = new FormData();
      fd.append("video", file);
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

  if (status === "fallback") {
    return (
      <div className="space-y-4">
        <p className="text-sm text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950 rounded-md p-3">
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
    <div className="space-y-4">
      <form onSubmit={onSubmit} className="space-y-4">
        <input
          type="url"
          required
          placeholder="https://www.tiktok.com/@user/video/..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
          disabled={submitting}
        />
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === "submitting" ? "Processing…" : "Find source"}
        </button>
      </form>

      <div className="relative flex items-center py-2">
        <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800" />
        <span className="mx-3 text-xs uppercase tracking-wide text-zinc-400">
          or
        </span>
        <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800" />
      </div>

      <VideoDropZone
        onFile={onUploadFile}
        disabled={submitting}
        hint={
          status === "uploading"
            ? "Uploading…"
            : "Drop a TikTok .mp4 here for visual matching"
        }
      />
      <p className="text-xs text-zinc-500">
        When TikTok blocks the URL path, download the video yourself and drop
        it here. We&apos;ll extract keyframes and give you Google Lens
        reverse-search links.
      </p>

      {errorMsg && (
        <pre className="rounded-md bg-red-50 dark:bg-red-950 text-red-900 dark:text-red-200 p-3 text-xs whitespace-pre-wrap">
          {errorMsg}
        </pre>
      )}
    </div>
  );
}
