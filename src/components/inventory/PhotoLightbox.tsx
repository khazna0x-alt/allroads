"use client";

import { useEffect, useRef, type TouchEvent } from "react";
import { useTranslations } from "next-intl";

const SWIPE_PX = 40;

export type LightboxPhoto = {
  url: string;
  alt: string;
};

export function PhotoLightbox({
  photos,
  index,
  onClose,
  onIndexChange,
}: {
  photos: LightboxPhoto[];
  index: number;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}) {
  const t = useTranslations("Inventory");
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  const count = photos.length;
  const current = photos[Math.min(Math.max(index, 0), Math.max(count - 1, 0))];

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
      if (event.key === "ArrowLeft") {
        onIndexChange((index - 1 + count) % count);
      }
      if (event.key === "ArrowRight") {
        onIndexChange((index + 1) % count);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [count, index, onClose, onIndexChange]);

  function onTouchStart(event: TouchEvent<HTMLDivElement>) {
    const touch = event.changedTouches[0];
    if (!touch || count < 2) {
      return;
    }
    swipeStart.current = { x: touch.clientX, y: touch.clientY };
  }

  function onTouchEnd(event: TouchEvent<HTMLDivElement>) {
    const start = swipeStart.current;
    const touch = event.changedTouches[0];
    swipeStart.current = null;
    if (!start || !touch || count < 2) {
      return;
    }
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) < SWIPE_PX || Math.abs(dx) <= Math.abs(dy)) {
      return;
    }
    onIndexChange((index + (dx < 0 ? 1 : -1) + count) % count);
  }

  if (!current) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/92"
      role="dialog"
      aria-modal="true"
      aria-label={t("lightbox")}
      onClick={onClose}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <p className="text-sm text-[var(--ivory-dim)]">
          {t("photoOf", { current: index + 1, total: count })}
        </p>
        <button
          type="button"
          className="border border-[var(--sand)] px-3 py-2 text-xs tracking-[0.18em] uppercase text-[var(--sand)] hover:bg-[var(--sand)] hover:text-[var(--ink)]"
          onClick={(event) => {
            event.stopPropagation();
            onClose();
          }}
        >
          {t("closeLightbox")}
        </button>
      </div>
      <div
        className="relative flex min-h-0 flex-1 items-center justify-center px-4"
        onClick={(event) => event.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {count > 1 ? (
          <>
            <button
              type="button"
              aria-label={t("prevPhoto")}
              className="absolute start-3 z-10 flex h-12 w-12 items-center justify-center border border-[var(--sand)] bg-[rgba(10,10,10,0.72)] text-[var(--sand)] hover:bg-[var(--sand)] hover:text-[var(--ink)]"
              onClick={() => onIndexChange((index - 1 + count) % count)}
            >
              ‹
            </button>
            <button
              type="button"
              aria-label={t("nextPhoto")}
              className="absolute end-3 z-10 flex h-12 w-12 items-center justify-center border border-[var(--sand)] bg-[rgba(10,10,10,0.72)] text-[var(--sand)] hover:bg-[var(--sand)] hover:text-[var(--ink)]"
              onClick={() => onIndexChange((index + 1) % count)}
            >
              ›
            </button>
          </>
        ) : null}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current.url}
          alt={current.alt}
          className="max-h-full max-w-full object-contain"
        />
      </div>
      {count > 1 ? (
        <div
          className="flex gap-2 overflow-x-auto px-4 py-4"
          onClick={(event) => event.stopPropagation()}
        >
          {photos.map((photo, photoIndex) => (
            <button
              key={`${photo.url}-${photoIndex}`}
              type="button"
              aria-current={photoIndex === index ? "true" : undefined}
              aria-label={`${photoIndex + 1} / ${count}`}
              className={`h-16 w-20 shrink-0 overflow-hidden border ${
                photoIndex === index ? "border-[var(--sand)]" : "border-transparent opacity-70"
              }`}
              onClick={() => onIndexChange(photoIndex)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.url} alt={photo.alt} className="h-full w-full object-cover" loading="lazy" decoding="async" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
