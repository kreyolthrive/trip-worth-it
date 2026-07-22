"use client";

import { useEffect, useMemo, useState } from "react";

type HeroMediaItem = {
  src: string;
  alt: string;
  type?: "image" | "video";
};

type MobileHeroMediaSliderProps = {
  items: HeroMediaItem[];
  intervalMs?: number;
};

function isVideo(src: string) {
  return /\.(mp4|webm|mov|m4v)$/i.test(src);
}

export default function MobileHeroMediaSlider({
  items,
  intervalMs = 3500,
}: MobileHeroMediaSliderProps) {
  const mediaItems = useMemo(() => {
    return items.filter((item) => Boolean(item.src));
  }, [items]);

  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (mediaItems.length <= 1) return;

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % mediaItems.length);
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [mediaItems.length, intervalMs]);

  if (mediaItems.length === 0) return null;

  function goNext() {
    setActiveIndex((current) => (current + 1) % mediaItems.length);
  }

  return (
    <div
      className="relative h-[360px] overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950 shadow-2xl"
      aria-label="Miami local guide media preview"
    >
      {mediaItems.map((item, index) => {
        const active = index === activeIndex;
        const itemIsVideo = item.type === "video" || isVideo(item.src);

        return (
          <div
            key={`${item.src}-${index}`}
            className={`absolute inset-0 transition-opacity duration-700 ${
              active ? "opacity-100" : "opacity-0"
            }`}
            aria-hidden={!active}
          >
            {itemIsVideo ? (
              <video
                className="h-full w-full object-cover"
                src={item.src}
                muted
                loop
                autoPlay={active}
                playsInline
                preload="metadata"
              />
            ) : (
              <img
                className="h-full w-full object-cover"
                src={item.src}
                alt={item.alt}
              />
            )}
          </div>
        );
      })}

      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/10 to-transparent" />

      <div className="absolute bottom-4 left-4 right-4">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-200">
          Miami Local Discovery
        </p>
        <p className="mt-2 text-lg font-black leading-tight text-white">
          Food, nightlife, services, events, and useful local places.
        </p>

        <button
          type="button"
          onClick={goNext}
          className="mt-4 inline-flex min-h-10 items-center justify-center rounded-full bg-white/90 px-4 text-xs font-black text-slate-950"
        >
          Tap to preview next
        </button>
      </div>

      <div className="absolute right-4 top-4 flex gap-1.5">
        {mediaItems.map((item, index) => (
          <span
            key={`dot-${item.src}-${index}`}
            className={`h-2 w-2 rounded-full ${
              index === activeIndex ? "bg-cyan-300" : "bg-white/40"
            }`}
          />
        ))}
      </div>
    </div>
  );
}