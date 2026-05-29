import { describe, expect, it } from "vitest";
import { score } from "./confidence";
import type { RawMatch } from "./types";

function fixture(overrides: Partial<RawMatch> = {}): RawMatch {
  return {
    source: "aliexpress",
    productUrl: "https://aliexpress.com/item/x",
    productKey: "aliexpress:x",
    title: "Cute Panda Silicone Night Light",
    imageUrl: null,
    priceCents: 999,
    currency: "USD",
    ...overrides,
  };
}

describe("score()", () => {
  it("returns 0 confidence when no caption keywords overlap the title", () => {
    // Zero-overlap branch is load-bearing: price plausibility alone shouldn't
    // earn a 30–100% floor for irrelevant matches.
    const result = score(fixture({ title: "Tactical Holster Belt Clip" }), [
      "panda",
      "night",
      "light",
    ]);
    expect(result.confidence).toBe(0);
  });

  it("returns 0 when keyword list is empty (caller short-circuit)", () => {
    const result = score(fixture(), []);
    expect(result.confidence).toBe(0);
  });

  it("scores higher when more of the caption keywords appear in the title", () => {
    // Same caption keywords, title with full vs partial overlap.
    const fullOverlap = score(
      fixture({ title: "Cute Panda Silicone Night Light" }),
      ["panda", "night", "light", "silicone"],
    ).confidence;
    const partialOverlap = score(
      fixture({ title: "Panda Toy" }),
      ["panda", "night", "light", "silicone"],
    ).confidence;
    expect(fullOverlap).toBeGreaterThan(partialOverlap);
  });

  it("weights longer keywords more than short ones", () => {
    // 'silicone' (8 chars, weight 1.0) carries more than 'led' (3 chars, 0.375).
    // Matching the long one + missing the short one should outscore the inverse.
    const longHit = score(
      fixture({ title: "Pure Silicone Lamp" }),
      ["silicone", "led"],
    ).confidence;
    const shortHit = score(
      fixture({ title: "LED Plastic Lamp" }),
      ["silicone", "led"],
    ).confidence;
    expect(longHit).toBeGreaterThan(shortHit);
  });

  it("adds a bigram bonus when adjacent caption keywords appear together in the title", () => {
    // Use partial overlap + an expensive item (low price plausibility) so
    // the score isn't already saturated at 1.0 — otherwise the bonus is
    // invisible under the clamp.
    const expensive = { priceCents: 25_000 }; // $250 → plausibility 0.2
    const keywords = ["panda", "night", "moon", "lamp"];
    const adjacent = score(
      fixture({ ...expensive, title: "Panda Night Decor" }),
      keywords,
    ).confidence;
    const splitTitle = score(
      fixture({ ...expensive, title: "Panda Cute Night Decor" }),
      keywords,
    ).confidence;
    expect(adjacent).toBeGreaterThan(splitTitle);
  });

  it("clamps confidence between 0 and 100", () => {
    const result = score(
      fixture({ title: "Panda Night Light Silicone Cute" }),
      ["panda", "night", "light", "silicone", "cute"],
    );
    expect(result.confidence).toBeLessThanOrEqual(100);
    expect(result.confidence).toBeGreaterThanOrEqual(0);
  });

  it("rewards dropship-plausible prices ($1–30) more than expensive ones", () => {
    const cheap = score(
      fixture({ priceCents: 999 }), // $9.99 — high plausibility
      ["panda", "night"],
    ).confidence;
    const expensive = score(
      fixture({ priceCents: 25000 }), // $250 — low plausibility
      ["panda", "night"],
    ).confidence;
    expect(cheap).toBeGreaterThan(expensive);
  });

  it("handles null prices with a neutral plausibility (no crash, no zero)", () => {
    const result = score(
      fixture({ title: "Panda Night Light", priceCents: null }),
      ["panda", "night"],
    );
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.confidence).toBeLessThanOrEqual(100);
  });

  it("is case-insensitive and ignores punctuation", () => {
    const a = score(fixture({ title: "PANDA NIGHT LIGHT!" }), [
      "panda",
      "night",
    ]).confidence;
    const b = score(fixture({ title: "panda night light" }), [
      "panda",
      "night",
    ]).confidence;
    expect(a).toBe(b);
  });

  it("preserves the input match fields and only adds confidence", () => {
    const input = fixture();
    const result = score(input, ["panda"]);
    expect(result.title).toBe(input.title);
    expect(result.productUrl).toBe(input.productUrl);
    expect(result.priceCents).toBe(input.priceCents);
    expect(typeof result.confidence).toBe("number");
  });
});
