"use client";

import { useEffect, useMemo, useState } from "react";

type MobileHeroBackgroundItem = {
  src: string;
  alt: string;
  type?: "image" | "video";
};

type MobileHeroBackgroundProps = {
  items: MobileHeroBackgroundItem[];
  intervalMs?: number;
};

function isVideo(src: string) {
  return /\.(mp4|webm|mov|m4v)$/i.test(src);
}

export default function MobileHeroBackground({
  items,
  intervalMs = 3500,
}: MobileHeroBackgroundProps) {
  const mediaItems = useMemo(() => {
    return items.filter((item) => Boolean(item.src));
  }, [items]);

  const [activeIndex, setActiveIndex] = useState(0);

  function showNext() {
    setActiveIndex((current) => (current + 1) % mediaItems.length);
  }

  useEffect(() => {
    if (mediaItems.length <= 1) return;

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % mediaItems.length);
    }, intervalMs);

    return () => window.clearInterval(timer);
  }, [mediaItems.length, intervalMs]);

  if (mediaItems.length === 0) return null;

  return (
    <div className="absolute inset-0 z-10 md:hidden">
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

      <div className="pointer-events-none absolute inset-0 bg-slate-950/70" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-950/70 to-slate-950" />

      <button
        type="button"
        onClick={showNext}
        className="absolute inset-0 z-20 cursor-pointer bg-transparent touch-manipulation"
        aria-label="Show next Miami hero background"
      />

      <div className="pointer-events-none absolute bottom-6 right-6 z-30 flex gap-1.5">
        {mediaItems.map((item, index) => (
          <span
            key={`mobile-hero-dot-${item.src}-${index}`}
            className={`h-2 w-2 rounded-full ${
              index === activeIndex ? "bg-cyan-300" : "bg-white/40"
            }`}
          />
        ))}
      </div>
    </div>
  );
}