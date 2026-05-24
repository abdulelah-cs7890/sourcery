import { parse } from "node-html-parser";
import { IngestionError } from "./types";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36";

const ROOT = "https://ssstik.io";
const FETCH_TIMEOUT_MS = 15_000;

export type SsstikResult = {
  caption: string;
  mp4Url: string;
  thumbnailUrl: string | null;
};

/**
 * Scrape ssstik.io for the caption + watermark-free .mp4 URL of a public
 * TikTok video. Pure HTML scrape; selectors are all local so a structural
 * change at ssstik is a one-file swap.
 *
 * Flow:
 *   1. GET ssstik.io/en          → extract the per-session `tt` form-token
 *   2. POST ssstik.io/abc?url=dl → form-encoded body { id, locale, tt }
 *   3. Parse response HTML       → .without_watermark href, .maintext text
 */
export async function fetchViaSsstik(
  tiktokUrl: string,
): Promise<SsstikResult> {
  const token = await fetchFormToken();
  const html = await postForResult(tiktokUrl, token);
  const dom = parse(html);

  const mp4Link = dom.querySelector("a.without_watermark")?.getAttribute("href");
  if (!mp4Link) {
    // ssstik renders a different markup when it can't process the URL
    // (private, removed, region-blocked, etc). Map to the same error type
    // the UI already handles.
    throw new IngestionError(
      "unreachable",
      "ssstik did not return a video URL (private/removed/region-blocked?)",
    );
  }

  const caption =
    dom.querySelector("p.maintext")?.text.trim() ||
    dom.querySelector(".maintext")?.text.trim() ||
    "";

  const thumbnailUrl =
    dom.querySelector("img.result_overlay")?.getAttribute("src") ?? null;

  return {
    caption,
    mp4Url: mp4Link,
    thumbnailUrl,
  };
}

async function fetchFormToken(): Promise<string> {
  const res = await fetchWithTimeout(`${ROOT}/`, {
    headers: { "user-agent": USER_AGENT, accept: "text/html" },
  });
  if (!res.ok) {
    throw new IngestionError(
      "unknown",
      `ssstik token fetch returned ${res.status}`,
    );
  }
  const html = await res.text();
  // Token is a JS variable in an inline <script>:
  //   ... s_furl = 'abc', s_tt = 'YVBjMTIz', s_prov = ...
  // Could also appear unprefixed in older builds. Match both.
  const match = html.match(/s_tt\s*=\s*['"]([A-Za-z0-9_+/=-]+)['"]/);
  if (!match) {
    throw new IngestionError(
      "unknown",
      "ssstik form-token not found in landing HTML",
    );
  }
  return match[1];
}

async function postForResult(
  tiktokUrl: string,
  token: string,
): Promise<string> {
  const body = new URLSearchParams({
    id: tiktokUrl,
    locale: "en",
    tt: token,
  });

  const res = await fetchWithTimeout(`${ROOT}/abc?url=dl`, {
    method: "POST",
    headers: {
      "user-agent": USER_AGENT,
      "content-type": "application/x-www-form-urlencoded",
      "hx-request": "true",
      origin: ROOT,
      referer: `${ROOT}/en`,
    },
    body: body.toString(),
  });

  if (!res.ok) {
    if (res.status === 429) {
      throw new IngestionError(
        "timeout",
        "ssstik rate-limited (429)",
      );
    }
    throw new IngestionError(
      "unknown",
      `ssstik POST returned ${res.status}`,
    );
  }
  return res.text();
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new IngestionError("timeout", `${url} timed out`);
    }
    throw new IngestionError(
      "unknown",
      err instanceof Error ? err.message : String(err),
    );
  } finally {
    clearTimeout(timer);
  }
}
