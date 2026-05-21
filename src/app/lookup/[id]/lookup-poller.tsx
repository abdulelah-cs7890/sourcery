"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import MatchList, { type MatchUI } from "../match-list";
import FrameStrip from "./frame-strip";

const POLL_INTERVAL_MS = 2_000;
const POLL_TIMEOUT_MS = 90_000;
// After matches arrive we keep polling briefly to pick up frame URLs from the
// background extraction job.
const FRAMES_GRACE_MS = 60_000;

type PollMatch = {
  id: string;
  source: string;
  productUrl: string;
  title: string | null;
  imageUrl: string | null;
  priceCents: number | null;
  currency: string | null;
  confidence: number;
};

type PollResponse = {
  status: "pending" | "processing" | "completed" | "failed";
  matches: PollMatch[];
  frameUrls: string[];
  errorMessage: string | null;
};

type Status = PollResponse["status"];

export default function LookupPoller({
  id,
  initialStatus,
  initialMatches,
  initialFrameUrls,
}: {
  id: string;
  initialStatus: Status;
  initialMatches: MatchUI[];
  initialFrameUrls: string[];
}) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>(initialStatus);
  const [matches, setMatches] = useState<MatchUI[]>(initialMatches);
  const [frameUrls, setFrameUrls] = useState<string[]>(initialFrameUrls);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    // Nothing left to poll for if matches AND frames are already in.
    if (initialStatus === "completed" && initialFrameUrls.length > 0) return;
    if (initialStatus === "failed") return;

    let cancelled = false;
    const start = Date.now();
    let completedAt: number | null =
      initialStatus === "completed" ? Date.now() : null;
    let timerId: ReturnType<typeof setTimeout> | undefined;

    async function poll() {
      if (cancelled) return;
      if (Date.now() - start > POLL_TIMEOUT_MS) {
        setTimedOut(true);
        return;
      }

      try {
        const res = await fetch(`/api/lookup/${id}`, { cache: "no-store" });
        if (res.ok) {
          const data = (await res.json()) as PollResponse;
          if (cancelled) return;
          setStatus(data.status);
          setFrameUrls(data.frameUrls ?? []);

          if (data.status === "completed" || data.status === "failed") {
            setMatches(
              data.matches.map((m) => ({
                id: m.id,
                source: (m.source === "cj"
                  ? "cj"
                  : "aliexpress") as MatchUI["source"],
                productUrl: m.productUrl,
                title: m.title ?? "",
                imageUrl: m.imageUrl,
                priceCents: m.priceCents,
                currency: m.currency ?? "USD",
                confidence: m.confidence,
              })),
            );
            if (data.status === "failed") {
              router.refresh();
              return;
            }
            if (completedAt === null) completedAt = Date.now();
            const hasFrames = (data.frameUrls ?? []).length > 0;
            const graceElapsed = Date.now() - completedAt > FRAMES_GRACE_MS;
            if (hasFrames || graceElapsed) return;
          }
        }
      } catch {
        // swallow & retry
      }

      timerId = setTimeout(poll, POLL_INTERVAL_MS);
    }

    poll();

    return () => {
      cancelled = true;
      if (timerId) clearTimeout(timerId);
    };
  }, [id, initialStatus, initialFrameUrls.length, router]);

  // ── Pre-match spinner ─────────────────────────────────────────
  if (status === "pending" || status === "processing") {
    if (timedOut) {
      return (
        <p className="text-sm text-amber-700 dark:text-amber-300">
          This is taking longer than expected. Refresh in a minute, or try a
          different URL.
        </p>
      );
    }
    return (
      <div className="flex items-center gap-3">
        <div className="h-3 w-3 rounded-full bg-zinc-400 animate-pulse" />
        <p className="text-sm text-zinc-500">
          Looking up your match… (this can take up to 30 seconds)
        </p>
      </div>
    );
  }

  // ── Completed: matches always shown; frames if ready, else "scanning..." ──
  return (
    <>
      {frameUrls.length > 0 ? (
        <FrameStrip frames={frameUrls} />
      ) : (
        <div className="mb-6 flex items-center gap-3">
          <div className="h-3 w-3 rounded-full bg-zinc-400 animate-pulse" />
          <p className="text-sm text-zinc-500">
            Scanning the video for visual matches…
          </p>
        </div>
      )}
      <MatchList matches={matches} />
    </>
  );
}
