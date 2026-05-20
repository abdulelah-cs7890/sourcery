import { env } from "@/lib/env";
import { redis } from "@/lib/redis";
import type { RawMatch } from "./types";

const AUTH_URL =
  "https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken";
const SEARCH_URL =
  "https://developers.cjdropshipping.com/api2.0/v1/product/list";

const TOKEN_CACHE_KEY = "sourcery:cj:token";
const TOKEN_TTL_SEC = 6 * 24 * 60 * 60; // 6 days; CJ tokens last ~7
const FETCH_TIMEOUT_MS = 8_000;
const MAX_RESULTS = 5;

type CJAuthResponse = {
  result: boolean;
  message?: string;
  data?: { accessToken: string; accessTokenExpiryDate?: string };
};

type CJProduct = {
  pid?: string;
  productSku?: string;
  productName?: string;
  productNameEn?: string;
  productImage?: string;
  sellPrice?: string;
  productUrl?: string;
};

type CJSearchResponse = {
  result: boolean;
  message?: string;
  data?: { list?: CJProduct[] };
};

export async function searchCJ(keywords: string[]): Promise<RawMatch[]> {
  if (keywords.length === 0) return [];

  try {
    let token = await getAccessToken();
    let res = await callSearch(token, keywords);

    if (res.status === 401 || res.status === 403) {
      token = await refreshAccessToken();
      res = await callSearch(token, keywords);
    }

    if (!res.ok) return [];
    const json = (await res.json()) as CJSearchResponse;
    if (!json.result || !json.data?.list) return [];

    const out: RawMatch[] = [];
    for (const item of json.data.list.slice(0, MAX_RESULTS)) {
      const pid = String(item.pid ?? item.productSku ?? "");
      const title = String(item.productNameEn ?? item.productName ?? "");
      if (!pid || !title) continue;
      const priceFloat = parseFloat(String(item.sellPrice ?? "0"));
      out.push({
        source: "cj",
        productUrl: String(
          item.productUrl ??
            `https://www.cjdropshipping.com/product/${pid}.html`,
        ),
        productKey: `cj:${pid}`,
        title,
        imageUrl: item.productImage ? String(item.productImage) : null,
        priceCents: Number.isFinite(priceFloat)
          ? Math.round(priceFloat * 100)
          : null,
        currency: "USD",
      });
    }
    return out;
  } catch {
    return [];
  }
}

async function getAccessToken(): Promise<string> {
  const cached = await redis.get<string>(TOKEN_CACHE_KEY);
  if (cached) return cached;
  return refreshAccessToken();
}

async function refreshAccessToken(): Promise<string> {
  const res = await fetch(AUTH_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email: env.CJ_EMAIL,
      password: env.CJ_API_KEY,
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });

  const json = (await res.json()) as CJAuthResponse;
  if (!json.result || !json.data?.accessToken) {
    throw new Error(`CJ auth failed: ${json.message ?? res.statusText}`);
  }

  await redis.set(TOKEN_CACHE_KEY, json.data.accessToken, {
    ex: TOKEN_TTL_SEC,
  });
  return json.data.accessToken;
}

async function callSearch(
  token: string,
  keywords: string[],
): Promise<Response> {
  const params = new URLSearchParams({
    pageNum: "1",
    pageSize: String(MAX_RESULTS),
    productNameEn: keywords.join(" "),
  });
  return fetch(`${SEARCH_URL}?${params}`, {
    headers: {
      "CJ-Access-Token": token,
      accept: "application/json",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
}
