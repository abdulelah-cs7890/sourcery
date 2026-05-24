import { buildLensUrl } from "@/lib/matchers/google-lens";

export default function FrameStrip({ frames }: { frames: string[] }) {
  if (frames.length === 0) return null;
  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-2">
        <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] shadow-[var(--shadow-glow-lime)]" />
          Reverse-search any frame
        </span>
      </div>
      <h2 className="text-sm font-medium mb-1 text-[var(--color-text)]">
        Search the video itself ↓
      </h2>
      <p className="text-xs text-[var(--color-text-muted)] mb-4">
        Click any frame to reverse-search it on Google Lens. Best for when the
        TikTok caption is generic and the keyword matches below miss.
      </p>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {frames.map((frameUrl, i) => (
          <a
            key={frameUrl}
            href={buildLensUrl(frameUrl)}
            target="_blank"
            rel="noopener noreferrer"
            title={`Reverse-search frame ${i + 1} on Google Lens`}
            className="shrink-0 rounded-xl overflow-hidden ring-1 ring-[var(--color-border)] hover:ring-[var(--color-accent)] hover:shadow-[var(--shadow-glow-lime)] transition"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={frameUrl}
              alt={`Frame ${i + 1}`}
              className="w-24 h-24 object-cover"
              loading="lazy"
            />
          </a>
        ))}
      </div>
    </section>
  );
}
