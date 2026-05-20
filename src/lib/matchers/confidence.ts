import type { RawMatch, ScoredMatch } from "./types";

export function score(match: RawMatch, keywords: string[]): ScoredMatch {
  return {
    ...match,
    confidence: Math.round(rawScore(match, keywords) * 100),
  };
}

function rawScore(match: RawMatch, keywords: string[]): number {
  const overlap = keywordOverlap(match.title, keywords);
  const plausibility = pricePlausibility(match.priceCents);
  const combined = 0.6 * overlap + 0.4 * plausibility;
  return Math.max(0, Math.min(1, combined));
}

function keywordOverlap(title: string, keywords: string[]): number {
  if (keywords.length === 0) return 0;
  const titleTokens = new Set(
    title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length >= 3),
  );
  let hits = 0;
  for (const kw of keywords) {
    if (titleTokens.has(kw)) hits++;
  }
  return hits / keywords.length;
}

function pricePlausibility(priceCents: number | null): number {
  if (priceCents === null) return 0.5;
  const price = priceCents / 100;
  if (price <= 0) return 0.3;
  if (price < 30) return 1.0;
  if (price < 80) return 0.7;
  if (price < 200) return 0.4;
  return 0.2;
}
