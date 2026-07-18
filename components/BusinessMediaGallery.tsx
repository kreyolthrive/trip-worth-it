"use client";

import Image from "next/image";
import { useRef, useState } from "react";

type MediaItem = {
  src: string;
  type: "image" | "video";
  poster?: string;
};

export default function BusinessMediaGallery({
  primary,
  secondary,
  alt,
  compact = false,
}: {
  primary?: MediaItem;
  secondary?: MediaItem;
  alt: string;
  compact?: boolean;
}) {
  const [failedSources, setFailedSources] = useState<string[]>([]);
  const candidates = [primary, secondary].filter(Boolean) as MediaItem[];
  const items = candidates.filter(
    (item, index) =>
      !failedSources.includes(item.src) &&
      candidates.findIndex(
        (candidate) =>
          candidate.src === item.src && candidate.type === item.type
      ) === index
  );
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const safeActiveIndex = activeIndex < items.length ? activeIndex : 0;
  const height = compact
    ? "h-64 sm:h-[390px]"
    : "h-72 sm:h-[480px]";

  function markFailed(src: string) {
    setFailedSources((current) =>
      current.includes(src) ? current : [...current, src]
    );
  }

  function renderMedia(item: MediaItem, index: number) {
    if (item.type === "video") {
      return (
        <div className="relative h-full w-full overflow-hidden bg-slate-950">
          <video
            className="absolute inset-0 h-full w-full scale-110 object-cover opacity-65 blur-xl"
            src={item.src}
            poster={item.poster}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-slate-950/15" />
          <video
            className="relative z-10 h-full w-full object-contain"
            src={item.src}
            poster={item.poster}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            onError={() => markFailed(item.src)}
            aria-label={`${alt}${index > 0 ? `, view ${index + 1}` : ""}`}
          />
        </div>
      );
    }

    return (
      <Image
        src={item.src}
        alt={`${alt}${index > 0 ? `, view ${index + 1}` : ""}`}
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
        className="object-cover"
        onError={() => markFailed(item.src)}
      />
    );
  }

  if (items.length === 0) {
    return (
      <div className={`${height} rounded-[1.5rem] bg-gradient-to-br from-cyan-50 to-slate-200`} />
    );
  }

  return (
    <div className="business-gallery group/gallery">
      <div
        ref={trackRef}
        role={items.length > 1 ? "button" : undefined}
        tabIndex={items.length > 1 ? 0 : undefined}
        aria-label={
          items.length > 1
            ? `Show next photo for ${alt}`
            : undefined
        }
        onClick={() => {
          if (
            items.length > 1 &&
            window.matchMedia("(hover: none), (pointer: coarse)").matches
          ) {
            setActiveIndex((current) => (current + 1) % items.length);
          }
        }}
        onKeyDown={(event) => {
          if (items.length > 1 && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault();
            setActiveIndex((current) => (current + 1) % items.length);
          }
        }}
        onScroll={(event) => {
          const width = event.currentTarget.clientWidth;
          if (width > 0) {
            setActiveIndex(Math.round(event.currentTarget.scrollLeft / width));
          }
        }}
        className={`${height} business-gallery-track overflow-hidden rounded-[1.5rem] bg-slate-100`}
      >
        {items.map((item, index) => (
          <div
            key={`${item.src}-${index}`}
            className={`business-gallery-slide ${index === 1 ? "business-gallery-secondary" : ""} ${safeActiveIndex === index ? "business-gallery-mobile-active" : ""}`}
          >
            {renderMedia(item, index)}
          </div>
        ))}
      </div>

      {items.length > 1 ? (
        <div className="mt-3 flex items-center justify-center gap-2 md:hidden" aria-label="Media gallery position">
          {items.map((item, index) => (
            <button
              key={`${item.src}-indicator-${index}`}
              type="button"
              aria-label={`Show media ${index + 1}`}
              aria-current={safeActiveIndex === index ? "true" : undefined}
              onClick={() => {
                const track = trackRef.current;
                if (!track) return;
                track.scrollTo({ left: track.clientWidth * index, behavior: "smooth" });
                setActiveIndex(index);
              }}
              className={`h-2.5 rounded-full transition-all ${
                safeActiveIndex === index ? "w-7 bg-cyan-500" : "w-2.5 bg-slate-300 hover:bg-slate-400"
              }`}
            />
          ))}
          <span className="ml-2 text-[10px] font-black uppercase tracking-[0.14em] text-slate-400 md:hidden">
            Tap image
          </span>
        </div>
      ) : null}

      <style>{`
        .business-gallery-track { position: relative; }
        .business-gallery-slide { position: absolute; inset: 0; transition: opacity 700ms ease, transform 700ms ease; }
        .business-gallery-secondary { opacity: 0; transform: scale(1.035); }
        .business-gallery:hover .business-gallery-secondary,
        .business-gallery:focus-within .business-gallery-secondary { opacity: 1; transform: scale(1); }
        .business-gallery:hover .business-gallery-slide:first-child,
        .business-gallery:focus-within .business-gallery-slide:first-child { opacity: 0; transform: scale(1.025); }

        @media (hover: none), (pointer: coarse) {
          .business-gallery-track {
            display: block;
            overflow: hidden;
          }
          .business-gallery-slide {
            display: none;
          }
          .business-gallery-slide.business-gallery-mobile-active {
            display: block;
            position: absolute;
            inset: 0;
            opacity: 1 !important;
            transform: none !important;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .business-gallery-slide { transition: none; }
          .business-gallery-track { scroll-behavior: auto; }
        }
      `}</style>
    </div>
  );
}