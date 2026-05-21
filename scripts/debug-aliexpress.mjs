// One-off diagnostic for the AliExpress matcher. Fetches the search page
// directly with our exact UA + headers so we can see whether AliExpress is
// returning real product HTML, a captcha, or something else.
// Run: node scripts/debug-aliexpress.mjs [query]

const query = process.argv.slice(2).join(" ") || "led moon lamp";
const url = `https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(query)}`;

console.log(`\n=== AliExpress diagnostic: "${query}" ===`);
console.log(`URL: ${url}\n`);

const headers = {
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
  "accept-language": "en-US,en;q=0.9",
  "cache-control": "no-cache",
};

const start = Date.now();
const res = await fetch(url, { headers, cache: "no-store" });
const elapsed = Date.now() - start;

console.log(`Status: ${res.status} ${res.statusText}`);
console.log(`Elapsed: ${elapsed}ms`);
console.log(`Final URL after redirects: ${res.url}`);
console.log(`Content-Type: ${res.headers.get("content-type")}`);

const html = await res.text();
console.log(`Body length: ${html.length}\n`);

// ── Indicator scan ──────────────────────────────────────────
const indicators = {
  "contains 'captcha'": html.toLowerCase().includes("captcha"),
  "contains 'verify'": html.toLowerCase().includes("verify"),
  "contains 'robot'": html.toLowerCase().includes("robot"),
  "contains '/item/'": html.includes("/item/"),
  "contains 'window.runParams'": html.includes("window.runParams"),
  "contains 'window._dida_config_'": html.includes("window._dida_config_"),
  "contains 'productId'": html.includes("productId"),
  "contains '<title>'": html.includes("<title>"),
};
console.log("─── Page indicators ───");
for (const [k, v] of Object.entries(indicators)) {
  console.log(`  ${v ? "✓" : "✗"} ${k}`);
}

// Pull <title> for a quick page-type read
const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
if (titleMatch) console.log(`\n<title>: ${titleMatch[1].trim()}`);

// ── runParams extraction ───────────────────────────────────
console.log("\n─── window.runParams ───");
const variants = [
  /window\.runParams\s*=\s*({[\s\S]*?});\s*<\/script>/,
  /window\.runParams\s*=\s*({[\s\S]*?});\s*var\s/,
  /_dida_config_\._init_data_\s*=\s*({[\s\S]*?});/,
];
let parsed = null;
for (let i = 0; i < variants.length; i++) {
  const m = html.match(variants[i]);
  console.log(`  pattern[${i}]: ${m ? `matched (${m[1].length} bytes)` : "no match"}`);
  if (m && !parsed) {
    try {
      parsed = JSON.parse(m[1]);
      console.log(`  pattern[${i}] parsed OK`);
    } catch (e) {
      console.log(`  pattern[${i}] parse FAILED: ${String(e).slice(0, 200)}`);
    }
  }
}

if (parsed) {
  const items =
    parsed?.mods?.itemList?.content ??
    parsed?.itemList?.content ??
    parsed?.data?.itemList?.content ??
    [];
  console.log(`  items count: ${items.length}`);
  if (items[0]) {
    console.log(`  first item keys: ${Object.keys(items[0]).slice(0, 25).join(", ")}`);
  }
}

// ── DOM-level item link scan ───────────────────────────────
const itemAnchorMatches = html.match(/\/item\/\d+\.html/g) ?? [];
console.log(`\n─── DOM item anchors: ${itemAnchorMatches.length} found ───`);
if (itemAnchorMatches.length > 0) {
  console.log(`  first 3: ${itemAnchorMatches.slice(0, 3).join(", ")}`);
}

// ── First 800 chars of body for human inspection ───────────
console.log("\n─── Body sample (first 800 chars) ───");
console.log(html.slice(0, 800).replace(/\s+/g, " "));
console.log("\n=== end ===\n");
