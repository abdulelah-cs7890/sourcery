"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import MatchList, { type MatchUI } from "../match-list";

const POLL_INTERVAL_MS = 2_000;
const POLL_TIMEOUT_MS = 90_000;

type PollResponse = {
  status: "pending" | "processing" | "completed" | "failed";
  matches: Array<{
    id: string;
    source: string;
    productUrl: string;
    title: string | null;
    imageUrl: string | null;
    priceCents: number | null;
    currency: string | null;
    confidence: number;
  }>;
  errorMessage: string | null;
};

export default function LookupPoller({ id }: { id: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<PollResponse["status"]>("processing");
  const [matches, setMatches] = useState<MatchUI[]>([]);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const start = Date.now();
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
            if (data.status === "failed") router.refresh();
            return;
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
  }, [id, router]);

  if (status === "completed") {
    return <MatchList matches={matches} />;
  }

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
