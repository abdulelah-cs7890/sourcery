"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Status = "idle" | "submitting" | "error";

export default function CaptionFallback() {
  const router = useRouter();
  const [caption, setCaption] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function onSubmit(e: React.FormEvent) {
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

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <textarea
        required
        rows={4}
        placeholder="Paste the TikTok caption here…"
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
        disabled={status === "submitting"}
      />
      <button
        type="submit"
        disabled={status === "submitting" || caption.trim().length < 3}
        className="rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === "submitting" ? "Processing…" : "Search from caption"}
      </button>
      {errorMsg && (
        <pre className="rounded-md bg-red-50 dark:bg-red-950 text-red-900 dark:text-red-200 p-3 text-xs whitespace-pre-wrap">
          {errorMsg}
        </pre>
      )}
    </form>
  );
}
