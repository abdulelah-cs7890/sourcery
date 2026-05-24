import { and, asc, eq } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db, lookups, matches } from "@/lib/db";
import CaptionFallback from "../caption-fallback";
import { type MatchUI } from "../match-list";
import LookupPoller from "./lookup-poller";

export default async function LookupResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/signin?callbackUrl=/lookup");
  }

  const { id } = await params;

  const [lookup] = await db
    .select()
    .from(lookups)
    .where(and(eq(lookups.id, id), eq(lookups.userId, session.user.id)));

  if (!lookup) {
    return (
      <main className="mx-auto max-w-2xl px-4 sm:px-6 py-16">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] p-6">
          <p className="text-sm text-[var(--color-text-muted)] mb-4">
            Lookup not found.
          </p>
          <Link
            href="/lookup"
            className="inline-flex items-center rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] px-4 py-1.5 text-xs font-medium hover:border-[var(--color-border-strong)] transition"
          >
            ← Try another
          </Link>
        </div>
      </main>
    );
  }

  const matchRows =
    lookup.status === "completed"
      ? await db
          .select()
          .from(matches)
          .where(eq(matches.lookupId, id))
          .orderBy(asc(matches.rankedIndex))
      : [];

  const initialMatches: MatchUI[] = matchRows.map((m) => ({
    id: m.id,
    source: (m.source === "cj" ? "cj" : "aliexpress") as MatchUI["source"],
    productUrl: m.productUrl,
    title: m.title ?? "",
    imageUrl: m.imageUrl,
    priceCents: m.priceCents,
    currency: m.currency ?? "USD",
    confidence: m.confidence,
  }));

  return (
    <main className="mx-auto max-w-4xl px-4 sm:px-6 py-10 sm:py-12">
      <div className="mb-8">
        <Link
          href="/lookup"
          className="inline-flex items-center rounded-full border border-[var(--color-border)] bg-[var(--color-panel)] text-[var(--color-text-muted)] px-4 py-1.5 text-xs font-medium hover:text-[var(--color-text)] hover:border-[var(--color-border-strong)] transition"
        >
          ← New lookup
        </Link>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mt-5 text-[var(--color-text)]">
          Results
        </h1>
        {lookup.caption && (
          <div className="mt-4 rounded-2xl border-l-2 border-[var(--color-accent)] bg-[var(--color-panel)] pl-4 pr-5 py-3">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-faint)] mb-1">
              Caption
            </p>
            <p className="text-sm text-[var(--color-text-muted)] line-clamp-3">
              {lookup.caption}
            </p>
          </div>
        )}
      </div>

      {lookup.status !== "failed" && (
        <LookupPoller
          id={id}
          initialStatus={lookup.status as "pending" | "processing" | "completed"}
          initialMatches={initialMatches}
          initialFrameUrls={lookup.frameUrls ?? []}
          hasVideo={lookup.tiktokUrl !== null}
          hasCaption={
            lookup.caption !== null && lookup.caption.trim().length > 0
          }
        />
      )}

      {lookup.status === "failed" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-red-900/60 bg-red-950/40 p-5">
            <p className="text-sm text-red-200">
              That lookup failed.
              {lookup.errorMessage && (
                <span className="text-red-300/70">
                  {" "}
                  ({lookup.errorMessage})
                </span>
              )}
            </p>
          </div>
          <div className="relative rounded-3xl border border-[var(--color-border)] bg-[var(--color-panel)] p-6 sm:p-8">
            <h2 className="text-sm font-medium text-[var(--color-text-muted)] mb-4">
              Try pasting the caption instead
            </h2>
            <CaptionFallback />
          </div>
        </div>
      )}
    </main>
  );
}
