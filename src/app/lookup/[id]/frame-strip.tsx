import { buildLensUrl } from "@/lib/matchers/google-lens";

export default function FrameStrip({ frames }: { frames: string[] }) {
  if (frames.length === 0) return null;
  return (
    <section className="mb-6">
      <h2 className="text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">
        Search the video itself ↓
      </h2>
      <p className="text-xs text-zinc-500 mb-3">
        Click any frame to reverse-search it on Google Lens. Best for when the
        TikTok caption is generic and the keyword matches below miss.
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {frames.map((frameUrl, i) => (
          <a
            key={frameUrl}
            href={buildLensUrl(frameUrl)}
            target="_blank"
            rel="noopener noreferrer"
            title={`Reverse-search frame ${i + 1} on Google Lens`}
            className="shrink-0 rounded-md overflow-hidden border border-zinc-200 dark:border-zinc-800 hover:ring-2 hover:ring-zinc-400 transition"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={frameUrl}
              alt={`Frame ${i + 1}`}
              className="w-20 h-20 object-cover"
              loading="lazy"
            />
          </a>
        ))}
      </div>
    </section>
  );
}
