"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import CaptionFallback from "./caption-fallback";

type Status = "idle" | "submitting" | "error" | "fallback";

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
      const data = await res.json();

      if (res.status === 429) {
        setStatus("error");
        setErrorMsg("Daily limit reached. Come back tomorrow or upgrade.");
        return;
      }

      if (res.status === 422 && data.reason === "ingestion_failed") {
        setStatus("fallback");
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

  if (status === "fallback") {
    return (
      <div className="space-y-4">
        <p className="text-sm text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950 rounded-md p-3">
          Couldn&apos;t fetch that TikTok automatically (it may be private,
          removed, or geo-blocked). Paste the caption from the video below and
          we&apos;ll search from that.
        </p>
        <CaptionFallback />
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <input
        type="url"
        required
        placeholder="https://www.tiktok.com/@user/video/..."
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
        disabled={status === "submitting"}
      />
      <button
        type="submit"
        disabled={status === "submitting"}
        className="rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === "submitting" ? "Processing…" : "Find source"}
      </button>
      {errorMsg && (
        <pre className="rounded-md bg-red-50 dark:bg-red-950 text-red-900 dark:text-red-200 p-3 text-xs whitespace-pre-wrap">
          {errorMsg}
        </pre>
      )}
    </form>
  );
}
