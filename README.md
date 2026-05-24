# Sourcery

**Find the actual TikTok source.** Paste a viral TikTok product URL (or drop the
downloaded `.mp4`) and Sourcery returns the AliExpress / CJ Dropshipping
supplier, real prices, and a Google Lens reverse-search of the actual video
keyframes — usually in under 30 seconds.

🟢 **Live:** [sourcery-khaki.vercel.app](https://sourcery-khaki.vercel.app)

---

## Why this exists

Existing TikTok-spy tools (PiPiADS, AliHunter, Sell The Trend) ship you ads
from three weeks ago. By the time their pipelines surface a winning product,
the moment is gone.

Sourcery's wedge is **speed + freshness**: identify the supplier of what's
viral *right now*, in the time it takes to copy-paste the URL.

The long-term moat is a **trending board built bottom-up from real user
lookups** at `/trending` — a winners list a competitor can't easily clone
without inheriting the user base.

This is a portfolio / resume project. Free tier, no card required.

---

## What a lookup actually does

```
                    ┌──────────────────────────────────┐
TikTok URL ───────► │ 1. yt-dlp --dump-json            │
   or               │    (caption + metadata only)     │
.mp4 upload         └──────────────────────────────────┘
                                    │
                                    ▼
                    ┌──────────────────────────────────┐
                    │ 2. extractKeywords(caption)       │
                    │    stop-word + length-weighted    │
                    └──────────────────────────────────┘
                                    │
                                    ▼
                    ┌──────────────────────────────────┐
                    │ 3. Promise.allSettled([           │
                    │      searchAliexpress(keywords),  │
                    │      searchCJ(keywords)           │
                    │    ])                             │
                    └──────────────────────────────────┘
                                    │
                                    ▼
                    ┌──────────────────────────────────┐
                    │ 4. score(candidate, keywords)     │
                    │    0.7·overlap + 0.3·priceFit     │
                    │    + bigram bonus                 │
                    └──────────────────────────────────┘
                                    │
                                    ▼
                    ┌──────────────────────────────────┐
                    │ 5. Top 3 ranked → MatchCard grid  │
                    └──────────────────────────────────┘

Parallel slow path (only for .mp4 uploads):
                    ┌──────────────────────────────────┐
.mp4 in browser ──► │ a. native <video> + canvas        │
                    │    extract 5 keyframes locally    │
                    │    (no server-side ffmpeg)        │
                    └──────────────────────────────────┘
                                    │
                                    ▼
                    ┌──────────────────────────────────┐
                    │ b. POST JPGs → Vercel Blob        │
                    │    (public, CORS-friendly)        │
                    └──────────────────────────────────┘
                                    │
                                    ▼
                    ┌──────────────────────────────────┐
                    │ c. FrameStrip renders 5 lime-glow │
                    │    thumbnails, each linking to    │
                    │    lens.google.com/uploadbyurl    │
                    └──────────────────────────────────┘
```

The result page polls `GET /api/lookup/[id]` every 2s until matches AND
frames have arrived, then stops. Matches usually land in ~15s, frames
follow ~15–30s later.

---

## Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 16** (App Router, Turbopack) | Server actions, file-system routing, streaming |
| Hosting | **Vercel** Hobby ($0) | Edge + serverless in one deploy |
| Auth | **Auth.js v5** + Resend magic links | No passwords; one-click sign-in |
| Database | **Neon** Postgres + **Drizzle** ORM | Type-safe queries, serverless-friendly |
| Cache / rate-limit | **Upstash** Redis (sliding-window 10/24h) | Free tier, REST-based |
| Async work | `@vercel/functions` `waitUntil()` | 25s sync budget + ~30s background grace |
| Frame extraction | Browser `<video>` + Canvas | 100× faster than ffmpeg.wasm; no Linux binary on prod |
| Keyframe hosting | **Vercel Blob** (public store) | Google Lens can fetch the JPGs |
| Reverse-search | `https://lens.google.com/uploadbyurl?url=...` | Pure URL builder, no API call |
| Email | **Resend** | 100 / day free, dev-friendly DX |
| Observability | **Sentry** (server + client + edge) | Production-quality error catch |
| Styling | **Tailwind 4** | Theme tokens in CSS, no config file |
| Type safety env | `@t3-oss/env-nextjs` + zod | Compile-time check that env is wired right |

---

## Things that broke along the way

These are the production-only surprises that took the project from "works
on my machine" to "actually runs on Vercel."

1. **AliExpress anti-bot punish-pages.** First batch of test URLs came back
   empty. The matcher now detects the captcha response, returns `[]` cleanly,
   and the UI shows a graceful badge instead of an error.
2. **Vercel serverless has no Python 3.** `yt-dlp-exec` ships the Python
   flavor of yt-dlp, so URL ingestion died on prod with
   `env: 'python3': No such file or directory`. First fix was a `.mp4`
   upload fallback. Final fix (Stream B): swap yt-dlp entirely for
   **scraping ssstik.io** — one request returns both the caption and a
   watermark-free `.mp4` URL hosted on their CDN. No Python, no binaries.
   The server fetches the mp4 bytes, re-hosts on Vercel Blob so the
   client can grab them CORS-safely, and frame extraction runs in the
   browser exactly like the upload path. Code in
   [src/lib/ingestion/ssstik.ts](src/lib/ingestion/ssstik.ts).
3. **TikTok IP-blocks Vercel's data-center range.** Even when yt-dlp ran,
   it 403'd against TikTok. ssstik dodges this entirely since it runs
   from its own infra; we never call TikTok directly from Vercel.
4. **ffmpeg-static silently fails on Vercel Linux.** Status flipped to
   `completed` but `frame_urls` stayed `null`. Solution: moved keyframe
   extraction to the **browser** via `@ffmpeg/ffmpeg` WASM.
5. **ffmpeg.wasm was too slow.** A typical short TikTok took 60+ seconds
   per frame on single-threaded WASM. Pivoted to the **native
   `HTMLVideoElement` + `<canvas>` API** — hardware-accelerated, ~100×
   faster, no 10MB WASM payload. Code at
   [src/app/lookup/video-processor.ts](src/app/lookup/video-processor.ts).
6. **Vercel Blob private-store gotcha.** First store was set to "private"
   and silently rejected `access: "public"` uploads. New public store fixed
   it; the gotcha is captured in the on-call notes.
7. **Turbopack broke yt-dlp + ffmpeg binary path resolution.** Both
   packages had to be added to `serverExternalPackages` in
   `next.config.ts` so Turbopack doesn't try to bundle their platform
   binaries.
8. **Upstash token typo, surfaced via Sentry within seconds.** First
   prod deploy returned 500 on every lookup. Sentry caught
   `WRONGPASS Authentication failed` instantly; re-pasting the Vercel
   env var fixed it.
9. **Tailwind 4's `@theme inline` doesn't export CSS variables at runtime.**
   The visual redesign initially shipped as black-and-white because
   `bg-[var(--color-accent)]` was undefined. Switched to plain `@theme {}`
   and the lime accents resolved.

---

## Run locally

```bash
# 1. Clone
git clone https://github.com/abdulelah-cs7890/sourcery
cd sourcery

# 2. Install
pnpm install

# 3. Copy env template
cp .env.example .env.local
# Fill in: Neon DATABASE_URL, Upstash REDIS_*, Resend, Auth secrets,
# CJ dev API creds, Vercel Blob token, Sentry DSN.

# 4. Run migrations
pnpm db:migrate

# 5. Dev server
pnpm dev
```

Then open [http://localhost:3000](http://localhost:3000).

---

## Status

| Sprint | Status |
|---|---|
| Week 1 — foundations + lookup skeleton | ✅ shipped |
| Week 2 — real ingestion + matching | ✅ shipped |
| Week 3 — visual matching + Sentry | ✅ shipped |
| Week 4a — public surface + deploy | ✅ shipped |
| Week 4b — browser-side frame extraction | ✅ shipped |
| Week 4c — README + trending + margin calc | 🔨 in progress |
| Week 4d — full visual redesign (Astra-style) | ✅ shipped |

---

## License

MIT. Built solo over four weeks as a portfolio project.
