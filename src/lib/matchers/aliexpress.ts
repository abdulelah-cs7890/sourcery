import { parse } from "node-html-parser";
import type { RawMatch } from "./types";

// AliExpress is the most fragile thing in the codebase. When this breaks, the
// fix lives ONLY in this file. As of 2026-05, AliExpress:
//   1. Aggressively anti-bot-blocks repeated requests via /punish interstitials
//   2. Replaced window.runParams with an obfuscated _dida_config_ payload that
//      isn't strict JSON
//   3. Renders product cards with CSS-module-hashed class names (.l1_e, .l1_ki)
//      but keeps the semantic .search-card-item class on each anchor
// Strategy: detect the anti-bot page and bail; otherwise walk .search-card-item
// anchors, pull title from img[alt], price from card text via regex.

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
];

const FETCH_TIMEOUT_MS = 8_000;
const MAX_RESULTS = 5;
const DEBUG = process.env.SOURCERY_DEBUG_MATCHERS === "1";

export async function searchAliexpress(
  keywords: string[],
): Promise<RawMatch[]> {
  if (keywords.length === 0) return [];
  const query = keywords.join(" ");
  const url = `https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(query)}`;

  try {
    const ua = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
    const res = await fetch(url, {
      headers: {
        "user-agent": ua,
        accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "accept-language": "en-US,en;q=0.9",
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "none",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    if (!res.ok) {
      if (DEBUG) console.log("[aliexpress] non-200:", res.status);
      return [];
    }

    const html = await res.text();
    if (DEBUG) console.log("[aliexpress] body length:", html.length);

    if (isBlocked(html)) {
      if (DEBUG) console.log("[aliexpress] anti-bot interstitial detected");
      return [];
    }

    return parseSearchPage(html, MAX_RESULTS);
  } catch (e) {
    if (DEBUG)
      console.log(
        "[aliexpress] error:",
        e instanceof Error ? e.message : String(e),
      );
    return [];
  }
}

function isBlocked(html: string): boolean {
  if (html.length >= 50_000) return false;
  return (
    html.includes("_____tmd_____") ||
    html.includes('"action":"captcha"') ||
    html.includes("/punish")
  );
}

function parseSearchPage(html: string, max: number): RawMatch[] {
  const root = parse(html);
  const cards = root.querySelectorAll(".search-card-item");
  if (DEBUG) console.log("[aliexpress] cards found:", cards.length);

  const seen = new Set<string>();
  const out: RawMatch[] = [];

  for (const card of cards) {
    if (out.length >= max) break;

    const href = card.getAttribute("href") ?? "";
    const idMatch = href.match(/\/item\/(\d+)/);
    if (!idMatch) continue;
    const productId = idMatch[1];
    if (seen.has(productId)) continue;
    seen.add(productId);

    const img = card.querySelector("img");
    const imgAlt = img?.getAttribute("alt")?.trim() ?? "";
    const imgSrc = img?.getAttribute("src") ?? null;

    let title = imgAlt;
    if (!title) {
      const text = card.text.trim().replace(/\s+/g, " ");
      title = text.slice(0, 120);
    }
    if (!title) continue;

    const cardText = card.text;
    const priceMatch = cardText.match(/\$\s*([\d,]+(?:\.\d+)?)/);
    const priceFloat = priceMatch
      ? parseFloat(priceMatch[1].replace(/,/g, ""))
      : NaN;

    out.push({
      source: "aliexpress",
      productUrl: `https://www.aliexpress.com/item/${productId}.html`,
      productKey: `aliexpress:${productId}`,
      title,
      imageUrl: normalizeUrl(imgSrc),
      priceCents: Number.isFinite(priceFloat)
        ? Math.round(priceFloat * 100)
        : null,
      currency: "USD",
    });
  }

  if (DEBUG) console.log("[aliexpress] returning", out.length, "matches");
  return out;
}

function normalizeUrl(u: string | null): string | null {
  if (!u) return null;
  if (u.startsWith("//")) return `https:${u}`;
  return u;
}
