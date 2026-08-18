"use client";

import { useEffect, useRef, useState, type MouseEvent, type TouchEvent } from "react";
import { useTranslations } from "next-intl";

export type CarouselPhoto = {
  url: string;
  alt: string;
};

const CYCLE_MS = 3000;
const SWIPE_PX = 40;

function Chevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="square"
      strokeWidth="1.75"
    >
      {direction === "left" ? (
        <path d="M14.5 5.5 8 12l6.5 6.5" />
      ) : (
        <path d="M9.5 5.5 16 12l-6.5 6.5" />
      )}
    </svg>
  );
}

export function PhotoCarousel({
  photos,
  className = "",
  sizes = "card",
  label,
  onPhotoClick,
}: {
  photos: CarouselPhoto[];
  className?: string;
  sizes?: "card" | "detail";
  label?: string;
  onPhotoClick?: (index: number) => void;
}) {
  const t = useTranslations("Inventory");
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [resumeToken, setResumeToken] = useState(0);
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  const didSwipe = useRef(false);
  const count = photos.length;
  const currentIndex = count === 0 ? 0 : Math.min(index, count - 1);
  const current = photos[currentIndex];

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (count < 2 || paused || reduceMotion) {
      return;
    }
    const timer = window.setInterval(() => {
      setIndex((currentIndex) => (currentIndex + 1) % count);
    }, CYCLE_MS);
    return () => window.clearInterval(timer);
  }, [count, paused, reduceMotion, resumeToken]);

  function goTo(nextIndex: number) {
    setIndex((nextIndex + count) % count);
    setResumeToken((token) => token + 1);
  }

  function step(delta: number) {
    setIndex((currentIndex) => (currentIndex + delta + count) % count);
    setResumeToken((token) => token + 1);
  }

  function onControlClick(event: MouseEvent, nextIndex: number) {
    event.preventDefault();
    event.stopPropagation();
    goTo(nextIndex);
  }

  function blockFollowingClick() {
    const blockClick = (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
    };
    document.addEventListener("click", blockClick, true);
    window.setTimeout(() => {
      document.removeEventListener("click", blockClick, true);
    }, 400);
  }

  function onTouchStart(event: TouchEvent<HTMLDivElement>) {
    const touch = event.changedTouches[0];
    if (!touch || count < 2) {
      return;
    }
    swipeStart.current = { x: touch.clientX, y: touch.clientY };
    setPaused(true);
  }

  function onTouchEnd(event: TouchEvent<HTMLDivElement>) {
    const start = swipeStart.current;
    const touch = event.changedTouches[0];
    swipeStart.current = null;
    setPaused(false);
    if (!start || !touch || count < 2) {
      return;
    }
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) < SWIPE_PX || Math.abs(dx) <= Math.abs(dy)) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    didSwipe.current = true;
    blockFollowingClick();
    step(dx < 0 ? 1 : -1);
  }

  function onTouchCancel() {
    swipeStart.current = null;
    setPaused(false);
  }

  if (!current) {
    return null;
  }

  const aspect = sizes === "detail" ? "aspect-[16/10] sm:aspect-[2/1]" : "aspect-[4/3]";
  const arrowClass =
    "absolute top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 items-center justify-center border border-[var(--sand)] bg-[rgba(10,10,10,0.72)] text-[var(--sand)] transition-colors md:flex hover:bg-[var(--sand)] hover:text-[var(--ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--sand)]";

  return (
    <div
      className={`photo-carousel relative overflow-hidden bg-[var(--ink-soft)] ${aspect} ${className} ${
        onPhotoClick ? "cursor-zoom-in" : ""
      }`}
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      onClick={() => {
        if (didSwipe.current) {
          didSwipe.current = false;
          return;
        }
        if (onPhotoClick) {
          onPhotoClick(currentIndex);
        }
      }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchCancel}
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
          className={`pointer-events-none absolute inset-0 h-full w-full object-cover transition-[opacity,transform] duration-700 ${
            photoIndex === currentIndex ? "opacity-100" : "opacity-0"
          } ${sizes === "card" ? "group-hover:scale-105" : ""}`}
          loading={photoIndex === currentIndex ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={photoIndex === currentIndex && sizes === "detail" ? "high" : "low"}
        />
      ))}
      {count > 1 ? (
        <>
          <button
            type="button"
            aria-label={t("prevPhoto")}
            className={`${arrowClass} left-3`}
            onClick={(event) => onControlClick(event, currentIndex - 1)}
          >
            <Chevron direction="left" />
          </button>
          <button
            type="button"
            aria-label={t("nextPhoto")}
            className={`${arrowClass} right-3`}
            onClick={(event) => onControlClick(event, currentIndex + 1)}
          >
            <Chevron direction="right" />
          </button>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center gap-1.5 bg-gradient-to-t from-black/70 to-transparent px-3 pb-3 pt-8">
            {photos.map((photo, photoIndex) =>
              sizes === "detail" ? (
                <button
                  key={`${photo.url}-${photoIndex}`}
                  type="button"
                  aria-label={`${photoIndex + 1} / ${count}`}
                  aria-current={photoIndex === currentIndex ? "true" : undefined}
                  className={`pointer-events-auto h-1.5 rounded-full transition-all ${
                    photoIndex === currentIndex
                      ? "w-7 bg-[var(--sand)]"
                      : "w-1.5 bg-white/45 hover:bg-white/80"
                  }`}
                  onClick={(event) => onControlClick(event, photoIndex)}
                />
              ) : (
                <span
                  key={`${photo.url}-${photoIndex}`}
                  aria-hidden="true"
                  className={`h-1.5 rounded-full transition-all ${
                    photoIndex === currentIndex ? "w-7 bg-[var(--sand)]" : "w-1.5 bg-white/45"
                  }`}
                />
              ),
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
