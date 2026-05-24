import type { MatchUI } from "./match-list";

const SOURCE_LABELS: Record<MatchUI["source"], string> = {
  aliexpress: "AliExpress",
  cj: "CJ Dropshipping",
};

export default function MatchCard({ match }: { match: MatchUI }) {
  const strongMatch = match.confidence >= 50;
  return (
    <article className="group rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel)] overflow-hidden flex flex-col hover:border-[var(--color-border-strong)] transition">
      <div className="aspect-square bg-[var(--color-bg)] bg-dotgrid relative">
        {match.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={match.imageUrl}
            alt={match.title}
            className="object-cover w-full h-full"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-[var(--color-text-faint)]">
            No image
          </div>
        )}
        <span className="absolute top-2 left-2 rounded-full bg-[var(--color-bg)]/90 border border-[var(--color-border)] text-[var(--color-text-muted)] px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide backdrop-blur">
          {SOURCE_LABELS[match.source]}
        </span>
        <span
          className={`absolute top-2 right-2 rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide ${
            strongMatch
              ? "bg-[var(--color-accent)] text-[var(--color-accent-text)] shadow-[var(--shadow-glow-lime)]"
              : "bg-[var(--color-bg)]/90 border border-[var(--color-border)] text-[var(--color-text-muted)] backdrop-blur"
          }`}
        >
          {match.confidence}% match
        </span>
      </div>
      <div className="p-4 flex flex-col gap-3 flex-1">
        <h3 className="text-sm font-medium line-clamp-2 text-[var(--color-text)]">
          {match.title}
        </h3>
        <p className="text-base font-semibold text-[var(--color-text)]">
          {formatPrice(match.priceCents, match.currency) ?? (
            <span className="text-sm text-[var(--color-text-faint)] font-normal">
              Price not shown
            </span>
          )}
        </p>
        <a
          href={match.productUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text)] px-4 py-2 text-xs font-medium text-center hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition"
        >
          View on {SOURCE_LABELS[match.source]} →
        </a>
      </div>
    </article>
  );
}

function formatPrice(cents: number | null, currency: string): string | null {
  if (cents === null) return null;
  const value = cents / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(value);
}
