import { searchAliexpress } from "./aliexpress";
import { searchCJ } from "./cj";
import { score } from "./confidence";
import { extractKeywords } from "./keywords";
import type { RawMatch, ScoredMatch } from "./types";

const TOP_N = 3;

export async function runMatchers(caption: string): Promise<ScoredMatch[]> {
  const keywords = extractKeywords(caption);
  if (keywords.length === 0) return [];

  const settled = await Promise.allSettled([
    searchAliexpress(keywords),
    searchCJ(keywords),
  ]);

  const raw: RawMatch[] = [];
  for (const s of settled) {
    if (s.status === "fulfilled") raw.push(...s.value);
  }

  return raw
    .map((m) => score(m, keywords))
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, TOP_N);
}
