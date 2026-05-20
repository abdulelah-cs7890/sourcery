import type { MatchUI } from "./match-list";

const SOURCE_LABELS: Record<MatchUI["source"], string> = {
  aliexpress: "AliExpress",
  cj: "CJ Dropshipping",
};

export default function MatchCard({ match }: { match: MatchUI }) {
  return (
    <article className="rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col">
      <div className="aspect-square bg-zinc-100 dark:bg-zinc-900 relative">
        {match.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={match.imageUrl}
            alt={match.title}
            className="object-cover w-full h-full"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-zinc-400">
            No image
          </div>
        )}
        <span className="absolute top-2 left-2 rounded-full bg-white/90 dark:bg-zinc-900/90 px-2 py-0.5 text-[10px] font-medium">
          {SOURCE_LABELS[match.source]}
        </span>
        <span className="absolute top-2 right-2 rounded-full bg-zinc-900/90 dark:bg-zinc-100/90 text-white dark:text-zinc-900 px-2 py-0.5 text-[10px] font-medium">
          {match.confidence}% match
        </span>
      </div>
      <div className="p-3 flex flex-col gap-2 flex-1">
        <h3 className="text-sm font-medium line-clamp-2">{match.title}</h3>
        <p className="text-sm text-zinc-500">
          {formatPrice(match.priceCents, match.currency) ?? "Price not shown"}
        </p>
        <a
          href={match.productUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-3 py-1.5 text-xs font-medium text-center hover:opacity-90"
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
