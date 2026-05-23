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
  hasVideo,
  hasCaption,
}: {
  id: string;
  initialStatus: Status;
  initialMatches: MatchUI[];
  initialFrameUrls: string[];
  /** True for URL lookups (frames eventually arrive). False for caption-paste (no frames ever). */
  hasVideo: boolean;
  /** True if the lookup has caption text that matchers ran against. False for video-only uploads. */
  hasCaption: boolean;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>(initialStatus);
  const [matches, setMatches] = useState<MatchUI[]>(initialMatches);
  const [frameUrls, setFrameUrls] = useState<string[]>(initialFrameUrls);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    // Nothing left to poll for if:
    //  - lookup is in a terminal state AND we either have frames or won't get them
    if (initialStatus === "completed") {
      if (!hasVideo) return;
      if (initialFrameUrls.length > 0) return;
    }
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
            // Caption-paste lookups never get frames — bail immediately.
            if (!hasVideo) return;
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
  }, [id, initialStatus, initialFrameUrls.length, hasVideo, router]);

  // ── Pre-match state ──────────────────────────────────────────
  if (status === "pending" || status === "processing") {
    if (timedOut) {
      return (
        <p className="text-sm text-amber-700 dark:text-amber-300">
          This is taking longer than expected. Refresh in a minute, or try a
          different URL.
        </p>
      );
    }
    // If frames already landed (upload path completes Blob upload before
    // the lookup row flips to "completed"), show them immediately + the
    // matches spinner below.
    return (
      <>
        {hasVideo && frameUrls.length > 0 && (
          <FrameStrip frames={frameUrls} />
        )}
        <PreMatchSpinner />
      </>
    );
  }

  // ── Completed state ─────────────────────────────────────────
  return (
    <>
      {hasVideo &&
        (frameUrls.length > 0 ? (
          <FrameStrip frames={frameUrls} />
        ) : (
          <FrameStripSkeleton />
        ))}
      {/* Only render MatchList when matchers actually ran (caption present)
          OR results came back. Video-only uploads with no caption skip
          matchers entirely and shouldn't see "No matches found". */}
      {(hasCaption || matches.length > 0) && <MatchList matches={matches} />}
      {hasVideo && !hasCaption && matches.length === 0 && (
        <p className="text-sm text-zinc-500 mt-6">
          Video-only lookup — use the keyframes above to reverse-search on
          Google Lens. Paste the caption below the URL form to also get
          AliExpress / CJ keyword matches.
        </p>
      )}
    </>
  );
}

function PreMatchSpinner() {
  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-6 flex items-start gap-4">
      <div className="relative shrink-0">
        <div className="h-10 w-10 rounded-full border-2 border-zinc-200 dark:border-zinc-800" />
        <div className="absolute inset-0 h-10 w-10 rounded-full border-2 border-zinc-900 dark:border-zinc-100 border-t-transparent animate-spin" />
      </div>
      <div>
        <h2 className="text-base font-semibold mb-1">
          Hunting for matches…
        </h2>
        <p className="text-sm text-zinc-500">
          Fetching the TikTok caption, then searching AliExpress and CJ
          Dropshipping in parallel. Usually under 30 seconds.
        </p>
      </div>
    </div>
  );
}

function FrameStripSkeleton() {
  return (
    <section className="mb-6">
      <div className="flex items-center gap-2 mb-2">
        <div className="h-2 w-2 rounded-full bg-zinc-400 animate-pulse" />
        <h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Searching the video for visual matches…
        </h2>
      </div>
      <p className="text-xs text-zinc-500 mb-3">
        Extracting keyframes from the video so you can reverse-search them on
        Google Lens. Usually 15–30 seconds.
      </p>
      <div className="flex gap-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="w-20 h-20 rounded-md bg-zinc-200 dark:bg-zinc-800 animate-pulse"
            style={{ animationDelay: `${i * 120}ms` }}
          />
        ))}
      </div>
    </section>
  );
}
