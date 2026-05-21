import type { RawMatch, ScoredMatch } from "./types";

export function score(match: RawMatch, keywords: string[]): ScoredMatch {
  return {
    ...match,
    confidence: Math.round(rawScore(match, keywords) * 100),
  };
}

function rawScore(match: RawMatch, keywords: string[]): number {
  const overlap = weightedKeywordOverlap(match.title, keywords);
  // Zero overlap means the match is irrelevant; price plausibility shouldn't
  // earn it a 40% floor.
  if (overlap === 0) return 0;
  const bonus = bigramBonus(match.title, keywords);
  const plausibility = pricePlausibility(match.priceCents);
  const combined = 0.7 * overlap + 0.3 * plausibility + bonus;
  return Math.max(0, Math.min(1, combined));
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 3);
}

// Longer tokens count more — "projector" matters more than "led".
function tokenWeight(token: string): number {
  return Math.min(token.length, 8) / 8;
}

function weightedKeywordOverlap(title: string, keywords: string[]): number {
  if (keywords.length === 0) return 0;
  const titleTokens = new Set(tokenize(title));
  let matched = 0;
  let total = 0;
  for (const kw of keywords) {
    const w = tokenWeight(kw);
    total += w;
    if (titleTokens.has(kw)) matched += w;
  }
  return total === 0 ? 0 : matched / total;
}

// Reward when two adjacent caption keywords both appear in the title
// (ordered match preferred), e.g. "moon lamp" vs unrelated solo hits.
function bigramBonus(title: string, keywords: string[]): number {
  if (keywords.length < 2) return 0;
  const titleTokens = tokenize(title);
  const titlePairs = new Set<string>();
  for (let i = 0; i + 1 < titleTokens.length; i++) {
    titlePairs.add(`${titleTokens[i]} ${titleTokens[i + 1]}`);
  }
  for (let i = 0; i + 1 < keywords.length; i++) {
    if (titlePairs.has(`${keywords[i]} ${keywords[i + 1]}`)) return 0.1;
    if (titlePairs.has(`${keywords[i + 1]} ${keywords[i]}`)) return 0.05;
  }
  return 0;
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
