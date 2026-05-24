"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import MatchList, { type MatchUI } from "../match-list";
import FrameStrip from "./frame-strip";

const POLL_INTERVAL_MS = 2_000;
const POLL_TIMEOUT_MS = 90_000;
// After matches arrive we keep polling briefly to pick up the videoBlobUrl
// (Stream B server-side mp4 → Blob upload) so the client can extract frames.
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
  videoBlobUrl: string | null;
  errorMessage: string | null;
};

type Status = PollResponse["status"];

export default function LookupPoller({
  id,
  initialStatus,
  initialMatches,
  initialFrameUrls,
  initialVideoBlobUrl,
  hasVideo,
  hasCaption,
}: {
  id: string;
  initialStatus: Status;
  initialMatches: MatchUI[];
  initialFrameUrls: string[];
  initialVideoBlobUrl: string | null;
  /** True for URL lookups (frames eventually arrive). False for caption-paste (no frames ever). */
  hasVideo: boolean;
  /** True if the lookup has caption text that matchers ran against. False for video-only uploads. */
  hasCaption: boolean;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>(initialStatus);
  const [matches, setMatches] = useState<MatchUI[]>(initialMatches);
  const [frameUrls, setFrameUrls] = useState<string[]>(initialFrameUrls);
  const [videoBlobUrl, setVideoBlobUrl] = useState<string | null>(
    initialVideoBlobUrl,
  );
  const [timedOut, setTimedOut] = useState(false);
  const [extractProgress, setExtractProgress] = useState<string>("");

  // Track whether we've kicked off client-side extraction for this lookup so
  // re-polls during the extraction window don't double-fire.
  const extractionStarted = useRef(false);

  // ── Server polling ───────────────────────────────────────────
  useEffect(() => {
    if (initialStatus === "completed") {
      if (!hasVideo) return;
      if (initialFrameUrls.length > 0) return;
      // For URL-mode lookups we still need to wait for videoBlobUrl to land
      // so we can extract frames client-side.
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
          setVideoBlobUrl(data.videoBlobUrl ?? null);

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

  // ── Client-side frame extraction (Stream B URL mode) ─────────
  // Triggers when the server has finished the matchers AND uploaded the
  // source .mp4 to Blob AND we don't have frames yet. Pure client compute;
  // posts JPGs back to /api/lookup/[id]/frames.
  useEffect(() => {
    if (extractionStarted.current) return;
    if (!hasVideo) return;
    if (!videoBlobUrl) return;
    if (frameUrls.length > 0) return;
    extractionStarted.current = true;

    let cancelled = false;
    (async () => {
      try {
        setExtractProgress("Loading video…");
        const res = await fetch(videoBlobUrl, { cache: "no-store" });
        if (!res.ok) throw new Error(`Video fetch returned ${res.status}`);
        const blob = await res.blob();
        const file = new File([blob], "video.mp4", { type: "video/mp4" });

        const { extractFramesInBrowser } = await import(
          "../video-processor"
        );
        const frames = await extractFramesInBrowser(file, 5, (label) => {
          if (!cancelled) setExtractProgress(label);
        });

        if (cancelled) return;
        setExtractProgress("Uploading frames…");

        const fd = new FormData();
        for (let i = 0; i < frames.length; i++) {
          fd.append(`frame_${i}`, frames[i], `frame_${i}.jpg`);
        }
        const postRes = await fetch(`/api/lookup/${id}/frames`, {
          method: "POST",
          body: fd,
        });
        if (!postRes.ok && postRes.status !== 409) {
          throw new Error(`Frame upload returned ${postRes.status}`);
        }
        const data = (await postRes.json()) as { frameUrls?: string[] };
        if (cancelled) return;
        if (data.frameUrls) setFrameUrls(data.frameUrls);
      } catch (err) {
        console.error("client frame extraction failed", err);
        if (!cancelled) {
          // Reset so a manual refresh could retry. Surface nothing visible —
          // user still has matches and can use the upload-mp4 fallback.
          extractionStarted.current = false;
          setExtractProgress("");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, videoBlobUrl, frameUrls.length, hasVideo]);

  // ── Pre-match state ──────────────────────────────────────────
  if (status === "pending" || status === "processing") {
    if (timedOut) {
      return (
        <div className="rounded-2xl border border-amber-900/60 bg-amber-950/30 p-5">
          <p className="text-sm text-amber-200">
            This is taking longer than expected. Refresh in a minute, or try
            a different URL.
          </p>
        </div>
      );
    }
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
          <FrameStripSkeleton progressLabel={extractProgress} />
        ))}
      {(hasCaption || matches.length > 0) && <MatchList matches={matches} />}
      {hasVideo && !hasCaption && matches.length === 0 && (
        <p className="text-sm text-[var(--color-text-muted)] mt-6">
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
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] p-6 flex items-start gap-4">
      <div className="relative shrink-0">
        <div className="h-10 w-10 rounded-full border-2 border-[var(--color-border)]" />
        <div className="absolute inset-0 h-10 w-10 rounded-full border-2 border-[var(--color-accent)] border-t-transparent animate-spin" />
      </div>
      <div>
        <h2 className="text-base font-semibold mb-1 text-[var(--color-text)]">
          Hunting for matches…
        </h2>
        <p className="text-sm text-[var(--color-text-muted)]">
          Fetching the TikTok caption, then searching AliExpress and CJ
          Dropshipping in parallel. Usually under 30 seconds.
        </p>
      </div>
    </div>
  );
}

function FrameStripSkeleton({ progressLabel }: { progressLabel?: string }) {
  return (
    <section className="mb-6">
      <div className="flex items-center gap-2 mb-2">
        <div className="h-2 w-2 rounded-full bg-[var(--color-accent)] animate-pulse" />
        <h2 className="text-sm font-medium text-[var(--color-text)]">
          {progressLabel || "Searching the video for visual matches…"}
        </h2>
      </div>
      <p className="text-xs text-[var(--color-text-muted)] mb-3">
        Downloading the video and extracting keyframes in your browser so you
        can reverse-search them on Google Lens. Usually 15–30 seconds.
      </p>
      <div className="flex gap-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="w-20 h-20 rounded-xl border border-[var(--color-border)] bg-[var(--color-panel)] animate-pulse"
            style={{ animationDelay: `${i * 120}ms` }}
          />
        ))}
      </div>
    </section>
  );
}
