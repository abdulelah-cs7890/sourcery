export type MatchSource = "aliexpress" | "cj";

export type RawMatch = {
  source: MatchSource;
  productUrl: string;
  productKey: string;
  title: string;
  imageUrl: string | null;
  priceCents: number | null;
  currency: string;
};

export type ScoredMatch = RawMatch & {
  confidence: number;
};
