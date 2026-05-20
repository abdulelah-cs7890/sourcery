import MatchCard from "./match-card";

export type MatchUI = {
  id: string;
  source: "aliexpress" | "cj";
  productUrl: string;
  title: string;
  imageUrl: string | null;
  priceCents: number | null;
  currency: string;
  confidence: number;
};

export default function MatchList({ matches }: { matches: MatchUI[] }) {
  if (matches.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        No matches found. Try a different URL or paste the caption manually.
      </p>
    );
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {matches.map((m) => (
        <MatchCard key={m.id} match={m} />
      ))}
    </div>
  );
}
