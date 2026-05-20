import { parse } from "node-html-parser";
import type { RawMatch } from "./types";

// NOTE: AliExpress markup is the most fragile thing in the codebase.
// When this breaks, the fix lives *only* in this file.

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
];

const FETCH_TIMEOUT_MS = 8_000;
const MAX_RESULTS = 5;

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
        accept: "text/html,application/xhtml+xml",
        "accept-language": "en-US,en;q=0.9",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    if (!res.ok) return [];
    const html = await res.text();
    return parseSearchPage(html, MAX_RESULTS);
  } catch {
    return [];
  }
}

type AliexpressItem = {
  productId?: string | number;
  product_id?: string | number;
  title?: { displayTitle?: string } | string;
  image?: { imgUrl?: string } | string;
  prices?: {
    salePrice?: { minPrice?: string | number };
    minPrice?: string | number;
  };
};

function parseSearchPage(html: string, max: number): RawMatch[] {
  // Preferred path: AliExpress embeds search data as JSON in a <script>.
  // window.runParams.mods.itemList.content holds the array.
  const scriptMatch = html.match(
    /window\.runParams\s*=\s*({[\s\S]*?});\s*<\/script>/,
  );
  if (scriptMatch) {
    try {
      const data = JSON.parse(scriptMatch[1]) as {
        mods?: { itemList?: { content?: AliexpressItem[] } };
        itemList?: { content?: AliexpressItem[] };
      };
      const items =
        data?.mods?.itemList?.content ?? data?.itemList?.content ?? [];
      const out = itemsToMatches(items, max);
      if (out.length > 0) return out;
    } catch {
      // fall through
    }
  }

  // Fallback: DOM scraping. Less reliable but a useful safety net.
  const root = parse(html);
  const anchors = root.querySelectorAll("a[href*='/item/']");
  const seen = new Set<string>();
  const out: RawMatch[] = [];
  for (const a of anchors) {
    if (out.length >= max) break;
    const href = a.getAttribute("href") ?? "";
    const m = href.match(/\/item\/(\d+)/);
    if (!m) continue;
    const productId = m[1];
    if (seen.has(productId)) continue;
    seen.add(productId);
    const title =
      a.getAttribute("title") ??
      a.querySelector("h3, h2, [title]")?.text?.trim() ??
      "";
    if (!title) continue;
    const imgSrc = a.querySelector("img")?.getAttribute("src") ?? null;
    const priceText =
      a.querySelector("[class*='price'], [class*='Price']")?.text ?? "";
    const priceFloat = parseFloat(priceText.replace(/[^\d.]/g, ""));
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
  return out;
}

function itemsToMatches(items: AliexpressItem[], max: number): RawMatch[] {
  const out: RawMatch[] = [];
  for (const item of items) {
    if (out.length >= max) break;
    const productId = String(item.productId ?? item.product_id ?? "");
    if (!productId) continue;
    const title =
      typeof item.title === "string"
        ? item.title
        : (item.title?.displayTitle ?? "");
    if (!title) continue;
    const image =
      typeof item.image === "string" ? item.image : (item.image?.imgUrl ?? "");
    const priceRaw =
      item.prices?.salePrice?.minPrice ?? item.prices?.minPrice ?? "0";
    const priceFloat = parseFloat(String(priceRaw).replace(/[^\d.]/g, ""));
    out.push({
      source: "aliexpress",
      productUrl: `https://www.aliexpress.com/item/${productId}.html`,
      productKey: `aliexpress:${productId}`,
      title,
      imageUrl: normalizeUrl(image),
      priceCents: Number.isFinite(priceFloat)
        ? Math.round(priceFloat * 100)
        : null,
      currency: "USD",
    });
  }
  return out;
}

function normalizeUrl(u: string | null): string | null {
  if (!u) return null;
  if (u.startsWith("//")) return `https:${u}`;
  return u;
}
