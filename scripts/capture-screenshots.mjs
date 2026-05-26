// Captures the 5 README screenshots against production
// (https://sourcery-khaki.vercel.app) using Playwright.
//
// Auth bypass: writes a verification_tokens row directly to Neon with a
// known raw token, then Playwright visits the Auth.js callback URL to
// exchange it for a session cookie. No email round-trip.
//
// Run: node --env-file=.env.local scripts/capture-screenshots.mjs

import { chromium } from "playwright";
import { neon } from "@neondatabase/serverless";
import { mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import crypto from "node:crypto";

const SITE = process.env.SOURCERY_SITE || "https://sourcery-khaki.vercel.app";
const EMAIL = "abdulallah7981@gmail.com"; // your account
const PANDA_URL =
  "https://www.tiktok.com/@lummilux/video/7394481180319501611";
const OUT = "docs/screenshots";

const VIEWPORT = { width: 1440, height: 900 };

const sql = neon(process.env.DATABASE_URL);

if (!existsSync(OUT)) await mkdir(OUT, { recursive: true });

// ── Step 1: forge a verification token, insert into Neon ─────────────
const rawToken = crypto.randomBytes(32).toString("hex");
const hashed = crypto
  .createHash("sha256")
  .update(rawToken + process.env.AUTH_SECRET)
  .digest("hex");
const expires = new Date(Date.now() + 60 * 60 * 1000); // +1h

await sql`
  INSERT INTO verification_tokens (identifier, token, expires)
  VALUES (${EMAIL}, ${hashed}, ${expires})
`;

const callbackUrl = `${SITE}/api/auth/callback/resend?callbackUrl=${encodeURIComponent(SITE + "/lookup")}&token=${rawToken}&email=${encodeURIComponent(EMAIL)}`;

console.log("Auth callback URL built. Token expires:", expires.toISOString());

// ── Step 2: launch Playwright, exchange token for session cookie ─────
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: VIEWPORT,
  deviceScaleFactor: 2, // crisper PNGs on retina-like output
});
const page = await context.newPage();

async function shot(name, opts = {}) {
  const path = `${OUT}/${name}`;
  // Full-page captures get heavy fast at 2x DPI — switch to JPEG q=88
  // for those so the README stays under a reasonable repo size.
  const isJpeg = name.endsWith(".jpg");
  await page.screenshot({
    path,
    fullPage: opts.fullPage ?? false,
    type: isJpeg ? "jpeg" : "png",
    ...(isJpeg ? { quality: 88 } : {}),
  });
  console.log("  ✓ saved", path);
}

console.log("[1/5] Capturing 01-hero.png (landing, no auth needed)…");
await page.goto(SITE + "/", { waitUntil: "networkidle" });
await page.waitForTimeout(500);
await shot("01-hero.png");

console.log("[auth] Exchanging token for session cookie…");
await page.goto(callbackUrl, { waitUntil: "load", timeout: 20_000 });
// Auth.js redirects to /lookup after success. If we land on /signin?error=…
// the token was rejected — bail with context.
const after = page.url();
if (after.includes("/signin") && after.includes("error")) {
  console.error("Auth bypass failed:", after);
  await browser.close();
  process.exit(1);
}
console.log("  ✓ authenticated; current URL:", after);

console.log("[2/5] Capturing 02-lookup-form.png…");
await page.goto(SITE + "/lookup", { waitUntil: "networkidle" });
await page.waitForSelector("input[type=url]");
await page.waitForTimeout(500);
await shot("02-lookup-form.png");

console.log("[3/5] Submitting panda URL via API (bypassing form) + capturing matches…");
// POST directly using Playwright's request context (inherits cookies from page).
const apiRes = await context.request.post(SITE + "/api/lookup", {
  data: { tiktokUrl: PANDA_URL },
  headers: { "content-type": "application/json" },
});
const apiBody = await apiRes.json().catch(() => null);
console.log("  /api/lookup →", apiRes.status(), JSON.stringify(apiBody).slice(0, 200));
if (apiRes.status() !== 200 || !apiBody?.id) {
  console.error("Lookup creation failed; bailing.");
  await browser.close();
  process.exit(1);
}
const lookupId = apiBody.id;
console.log("  lookupId:", lookupId);

await page.goto(`${SITE}/lookup/${lookupId}`, { waitUntil: "networkidle" });

// Wait for matches to render (MatchCard contains "% match" text)
await page.waitForFunction(
  () => document.body.innerText.includes("% match"),
  { timeout: 60_000 },
);
await page.waitForTimeout(1_000);
await shot("03-matches.jpg", { fullPage: true });

console.log("[4/5] Waiting for frame strip…");
// FrameStrip renders <img alt="Frame N"> tags. Wait for the first one.
await page.waitForSelector('img[alt^="Frame "]', { timeout: 90_000 });
await page.waitForTimeout(2_000); // let all 5 load
await shot("04-frame-strip.jpg", { fullPage: true });

// Grab the first keyframe URL for the Lens screenshot
const firstFrameUrl = await page.getAttribute(
  'img[alt="Frame 1"]',
  "src",
);
console.log("  first frame URL:", firstFrameUrl?.slice(0, 80) + "…");

// Lens result skipped intentionally — Google reCAPTCHA-walls any
// automated browser, so we can't get a clean Lens screenshot from
// Playwright. The README pivots to /trending instead as the final
// showcase shot.
console.log("[5/5] Capturing /trending board…");
await page.goto(SITE + "/trending", { waitUntil: "networkidle" });
await page.waitForTimeout(1_000);
await shot("05-trending.jpg", { fullPage: true });

await browser.close();

// ── Cleanup: delete the token we forged so it can't be reused ────────
await sql`
  DELETE FROM verification_tokens WHERE token = ${hashed}
`;

console.log();
console.log("✅ All 5 screenshots saved to", OUT + "/");
