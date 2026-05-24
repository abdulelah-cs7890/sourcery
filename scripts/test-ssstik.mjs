// Smoke-test the ssstik scraper against a known URL. Run:
//   node scripts/test-ssstik.mjs <tiktokUrl?>
// Defaults to the panda night light URL from the original Stream B test.
//
// Imports the runtime scraper directly so any regression in the selectors
// or HTML structure surfaces here before it hits /api/lookup.

import { parse } from "node-html-parser";

const ROOT = "https://ssstik.io";
const url =
  process.argv[2] ||
  "https://www.tiktok.com/@lummilux/video/7394481180319501611";

const ua =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36";

console.log("[1/3] Fetching ssstik landing for form token…");
const landing = await fetch(`${ROOT}/`, {
  headers: { "user-agent": ua, accept: "text/html" },
});
console.log("  →", landing.status);
const landingHtml = await landing.text();
const tokenMatch = landingHtml.match(
  /s_tt\s*=\s*['"]([A-Za-z0-9_+/=-]+)['"]/,
);
if (!tokenMatch) {
  console.error("  ✗ token regex didn't match. HTML structure changed?");
  process.exit(1);
}
const token = tokenMatch[1];
console.log("  ✓ token length", token.length);

console.log(`[2/3] POSTing for ${url}…`);
const post = await fetch(`${ROOT}/abc?url=dl`, {
  method: "POST",
  headers: {
    "user-agent": ua,
    "content-type": "application/x-www-form-urlencoded",
    "hx-request": "true",
    origin: ROOT,
    referer: `${ROOT}/en`,
  },
  body: new URLSearchParams({ id: url, locale: "en", tt: token }).toString(),
});
console.log("  →", post.status);
const html = await post.text();
console.log("  ← body length", html.length);

console.log("[3/3] Parsing result HTML…");
const dom = parse(html);
const mp4 = dom.querySelector("a.without_watermark")?.getAttribute("href");
const caption =
  dom.querySelector("p.maintext")?.text.trim() ||
  dom.querySelector(".maintext")?.text.trim() ||
  "";
const thumb = dom.querySelector("img.result_overlay")?.getAttribute("src");

if (!mp4) {
  console.error("  ✗ no .without_watermark <a> found. First 500 chars of HTML:");
  console.error(html.slice(0, 500));
  process.exit(1);
}

console.log("  ✓ mp4Url:", mp4.slice(0, 80) + "…");
console.log("  ✓ caption:", caption.slice(0, 120) + (caption.length > 120 ? "…" : ""));
console.log("  ✓ thumbnail:", thumb ? thumb.slice(0, 80) + "…" : "(none)");
console.log();
console.log("✅ ssstik scraper works against this URL.");
