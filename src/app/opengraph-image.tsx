import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Sourcery — Find the source of any viral TikTok product";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Astra-style branded OG card. Dark canvas + lime accent square + headline +
// tagline. Picked up automatically by metadata.openGraph.images +
// metadata.twitter.images via the Next.js file convention.
export default async function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "70px 80px",
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(16, 185, 129, 0.45) 0%, rgba(13, 58, 45, 0.18) 30%, transparent 70%), #08090c",
          color: "#f4f4f5",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "#c8ff3e",
              boxShadow: "0 0 60px 0 rgba(200, 255, 62, 0.55)",
            }}
          />
          <div style={{ fontSize: 40, fontWeight: 600, letterSpacing: -0.5 }}>
            Sourcery
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              display: "flex",
              fontSize: 84,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: -2,
            }}
          >
            Skip the spy tools.
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 84,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: -2,
              color: "#c8ff3e",
            }}
          >
            Find the source.
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 30,
              color: "#a1a1aa",
              maxWidth: 980,
              lineHeight: 1.4,
              marginTop: 12,
            }}
          >
            Paste a viral TikTok URL → get the AliExpress / CJ Dropshipping
            supplier + a Google Lens reverse-search of the actual video
            keyframes.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            color: "#71717a",
            fontSize: 22,
          }}
        >
          <div style={{ display: "flex" }}>sourcery-khaki.vercel.app</div>
          <div style={{ display: "flex", gap: 18 }}>
            <div style={{ display: "flex" }}>Next.js 16</div>
            <div style={{ display: "flex", color: "#3f3f46" }}>·</div>
            <div style={{ display: "flex" }}>Auth.js v5</div>
            <div style={{ display: "flex", color: "#3f3f46" }}>·</div>
            <div style={{ display: "flex" }}>Vercel</div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
