"use client";

import { useEffect, useState } from "react";

export type CarouselPhoto = {
  url: string;
  alt: string;
};

const CYCLE_MS = 4500;

export function PhotoCarousel({
  photos,
  className = "",
  sizes = "card",
  label,
}: {
  photos: CarouselPhoto[];
  className?: string;
  sizes?: "card" | "detail";
  label?: string;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const count = photos.length;
  const current = photos[Math.min(index, Math.max(count - 1, 0))];

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (index < count) {
      return;
    }
    setIndex(0);
  }, [count, index]);

  useEffect(() => {
    if (count < 2 || paused || reduceMotion) {
      return;
    }
    const timer = window.setInterval(() => {
      setIndex((currentIndex) => (currentIndex + 1) % count);
    }, CYCLE_MS);
    return () => window.clearInterval(timer);
  }, [count, paused, reduceMotion]);

  if (!current) {
    return null;
  }

  const aspect = sizes === "detail" ? "aspect-[16/10] sm:aspect-[2/1]" : "aspect-[4/3]";

  return (
    <div
      className={`photo-carousel relative overflow-hidden bg-[var(--ink-soft)] ${aspect} ${className}`}
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setPaused(false);
        }
      }}
    >
      {photos.map((photo, photoIndex) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={`${photo.url}-${photoIndex}`}
          src={photo.url}
          alt={photo.alt}
          className={`absolute inset-0 h-full w-full object-cover transition-[opacity,transform] duration-700 ${
            photoIndex === index ? "opacity-100" : "opacity-0"
          } ${sizes === "card" ? "group-hover:scale-105" : ""}`}
        />
      ))}
      {count > 1 ? (
        <div className="absolute inset-x-0 bottom-0 flex justify-center gap-1.5 bg-gradient-to-t from-black/70 to-transparent px-3 pb-3 pt-8">
          {photos.map((photo, photoIndex) =>
            sizes === "detail" ? (
              <button
                key={`${photo.url}-${photoIndex}`}
                type="button"
                aria-label={`${photoIndex + 1} / ${count}`}
                aria-current={photoIndex === index ? "true" : undefined}
                className={`h-1.5 rounded-full transition-all ${
                  photoIndex === index
                    ? "w-7 bg-[var(--sand)]"
                    : "w-1.5 bg-white/45 hover:bg-white/80"
                }`}
                onClick={() => setIndex(photoIndex)}
              />
            ) : (
              <span
                key={`${photo.url}-${photoIndex}`}
                aria-hidden="true"
                className={`h-1.5 rounded-full transition-all ${
                  photoIndex === index ? "w-7 bg-[var(--sand)]" : "w-1.5 bg-white/45"
                }`}
              />
            ),
          )}
        </div>
      ) : null}
    </div>
  );
}
