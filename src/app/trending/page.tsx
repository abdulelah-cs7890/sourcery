import { desc } from "drizzle-orm";
import Link from "next/link";
import { db, trendingAgg } from "@/lib/db";

export const metadata = {
  title: "Trending — Sourcery",
  description:
    "Products real dropshippers are hunting right now, aggregated bottom-up from Sourcery lookups in the last 7 days.",
};

export const revalidate = 300; // 5 min — picks up new cron runs fast enough

const SOURCE_LABELS: Record<string, string> = {
  aliexpress: "AliExpress",
  cj: "CJ Dropshipping",
};

export default async function TrendingPage() {
  // Server component: `Date.now()` runs once per request render, deterministic
  // within that render. The react-hooks/purity rule doesn't distinguish
  // server-rendered components and so flags it; safe to disable here.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const rows = await db
    .select()
    .from(trendingAgg)
    .orderBy(desc(trendingAgg.lookupCount), desc(trendingAgg.lastSeen))
    .limit(24);

  return (
    <main className="mx-auto max-w-6xl px-4 sm:px-6 py-12 sm:py-16">
      <div className="mb-10">
        <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-panel)] px-3.5 py-1.5 text-xs text-[var(--color-text-muted)] mb-5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] shadow-[var(--shadow-glow-lime)]" />
          Trending · last 7 days
        </span>
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-balance text-[var(--color-text)]">
          What dropshippers are hunting{" "}
          <span className="text-[var(--color-accent)]">right now</span>.
        </h1>
        <p className="mt-4 max-w-2xl text-base text-[var(--color-text-muted)]">
          Bottom-up trending from real Sourcery lookups. Updated nightly.
          Click any product to view the supplier directly.
        </p>
      </div>

      {rows.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rows.map((row) => (
            <TrendingCard
              key={row.productKey}
              source={row.source}
              productUrl={row.productUrl}
              title={row.title}
              imageUrl={row.imageUrl}
              uniqueUserCount={row.uniqueUserCount}
              lookupCount={row.lookupCount}
              ageLabel={describeAge(now, row.firstSeen)}
            />
          ))}
        </div>
      )}
    </main>
  );
}

function describeAge(nowMs: number, firstSeen: Date): string {
  const ageDays = Math.max(
    0,
    Math.floor((nowMs - new Date(firstSeen).getTime()) / 86_400_000),
  );
  if (ageDays === 0) return "first seen today";
  if (ageDays === 1) return "first seen 1 day ago";
  return `first seen ${ageDays} days ago`;
}

function TrendingCard({
  source,
  productUrl,
  title,
  imageUrl,
  uniqueUserCount,
  lookupCount,
  ageLabel,
}: {
  source: string;
  productUrl: string;
  title: string | null;
  imageUrl: string | null;
  uniqueUserCount: number;
  lookupCount: number;
  ageLabel: string;
}) {
  const sourceLabel = SOURCE_LABELS[source] ?? source;
  const dropshippersText =
    uniqueUserCount === 1
      ? "1 dropshipper spotted this"
      : `${uniqueUserCount} dropshippers spotted this`;

  return (
    <article className="group rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] overflow-hidden flex flex-col hover:border-[var(--color-border-strong)] transition">
      <div className="aspect-square bg-[var(--color-bg)] bg-dotgrid relative">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={title ?? "Trending product"}
            className="object-cover w-full h-full"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-[var(--color-text-faint)]">
            No image
          </div>
        )}
        <span className="absolute top-2 left-2 rounded-full bg-[var(--color-bg)]/90 border border-[var(--color-border)] text-[var(--color-text-muted)] px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide backdrop-blur">
          {sourceLabel}
        </span>
        {lookupCount >= 3 && (
          <span className="absolute top-2 right-2 rounded-full bg-[var(--color-accent)] text-[var(--color-accent-text)] shadow-[var(--shadow-glow-lime)] px-2.5 py-0.5 text-[10px] font-semibold tracking-wide">
            HOT
          </span>
        )}
      </div>
      <div className="p-4 flex flex-col gap-2 flex-1">
        <h2 className="text-sm font-medium line-clamp-2 text-[var(--color-text)] min-h-[2.5em]">
          {title ?? "Untitled product"}
        </h2>
        <p className="text-xs text-[var(--color-text-muted)]">
          {dropshippersText}
        </p>
        <p className="text-xs text-[var(--color-text-faint)]">{ageLabel}</p>
        <a
          href={productUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] px-4 py-2 text-xs font-medium text-center hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition"
        >
          View on {sourceLabel} →
        </a>
      </div>
    </article>
  );
}

function EmptyState() {
  return (
    <div className="relative rounded-3xl border border-[var(--color-border)] bg-[var(--color-panel)] p-10 sm:p-14 text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-[var(--color-emerald-glow)] opacity-15 blur-3xl"
      />
      <div className="relative z-10">
        <h2 className="text-2xl font-bold tracking-tight text-[var(--color-text)] mb-3">
          Quiet right now.
        </h2>
        <p className="text-[var(--color-text-muted)] max-w-md mx-auto mb-6">
          The trending board fills up from real user lookups in the last 7
          days. Run a lookup and you might end up here.
        </p>
        <Link
          href="/lookup"
          className="inline-flex items-center rounded-full bg-[var(--color-accent)] text-[var(--color-accent-text)] px-5 py-2.5 text-sm font-semibold shadow-[var(--shadow-glow-lime)] hover:bg-[var(--color-accent-hover)] transition"
        >
          Run a lookup →
        </Link>
      </div>
    </div>
  );
}
