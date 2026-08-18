"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Link } from "@/i18n/navigation";

type Journey = "sellers" | "buyers";

const STEP_IDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;
type StepId = (typeof STEP_IDS)[number];

function journeyFromHash(hash: string): Journey {
  return hash === "#buyers" ? "buyers" : "sellers";
}

export function HowItWorks() {
  const t = useTranslations("HowItWorks");
  const listRef = useRef<HTMLOListElement>(null);
  const [journey, setJourney] = useState<Journey>("sellers");

  useEffect(() => {
    function syncHash() {
      setJourney(journeyFromHash(window.location.hash));
    }
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  useEffect(() => {
    const root = listRef.current;
    if (!root) {
      return;
    }
    const steps = root.querySelectorAll<HTMLElement>(".how-step");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      steps.forEach((step) => step.classList.add("is-in"));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.2 },
    );
    steps.forEach((step) => observer.observe(step));
    return () => observer.disconnect();
  }, [journey]);

  function selectJourney(next: Journey) {
    setJourney(next);
    const hash = next === "buyers" ? "#buyers" : "#sellers";
    if (window.location.hash !== hash) {
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}${hash}`);
    }
  }

  function onTabKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const rtl = document.documentElement.dir === "rtl";
    const nextKey = rtl ? "ArrowLeft" : "ArrowRight";
    const prevKey = rtl ? "ArrowRight" : "ArrowLeft";
    if (event.key === nextKey || event.key === "End") {
      event.preventDefault();
      selectJourney("buyers");
      document.getElementById("how-tab-buyers")?.focus();
    } else if (event.key === prevKey || event.key === "Home") {
      event.preventDefault();
      selectJourney("sellers");
      document.getElementById("how-tab-sellers")?.focus();
    }
  }

  const isSellers = journey === "sellers";
  const stepNs = isSellers ? "sellerSteps" : "buyerSteps";
  const icons = isSellers ? SELLER_ICONS : BUYER_ICONS;
  const primaryHref = isSellers ? "/consign" : "/inventory";
  const primaryLabel = isSellers ? t("ctaList") : t("ctaBrowse");
  const secondaryHref = isSellers ? "/inventory" : "/consign";
  const secondaryLabel = isSellers ? t("ctaBrowse") : t("ctaList");

  return (
    <div className="relative mt-10">
      <span id="sellers" className="absolute start-0 -top-24 h-px w-px" aria-hidden="true" />
      <span id="buyers" className="absolute start-0 -top-24 h-px w-px" aria-hidden="true" />
      <div
        role="tablist"
        aria-label={t("tablist")}
        onKeyDown={onTabKeyDown}
        className="grid grid-cols-2 border-b border-[var(--line)]"
      >
        <button
          type="button"
          role="tab"
          id="how-tab-sellers"
          aria-selected={isSellers}
          aria-controls="how-panel-sellers"
          tabIndex={isSellers ? 0 : -1}
          onClick={() => selectJourney("sellers")}
          className={`min-h-11 border-e border-b-2 border-e-[var(--line)] px-4 text-[11px] font-semibold tracking-[0.2em] uppercase ${
            isSellers
              ? "-mb-px border-b-[var(--sand)] text-[var(--sand)]"
              : "border-b-transparent text-[var(--ivory-dim)] hover:text-[var(--sand)]"
          }`}
        >
          {t("sellerTab")}
        </button>
        <button
          type="button"
          role="tab"
          id="how-tab-buyers"
          aria-selected={!isSellers}
          aria-controls="how-panel-buyers"
          tabIndex={isSellers ? -1 : 0}
          onClick={() => selectJourney("buyers")}
          className={`min-h-11 border-b-2 px-4 text-[11px] font-semibold tracking-[0.2em] uppercase ${
            isSellers
              ? "border-b-transparent text-[var(--ivory-dim)] hover:text-[var(--sand)]"
              : "-mb-px border-b-[var(--sand)] text-[var(--sand)]"
          }`}
        >
          {t("buyerTab")}
        </button>
      </div>

      <div
        id={isSellers ? "how-panel-sellers" : "how-panel-buyers"}
        role="tabpanel"
        aria-labelledby={isSellers ? "how-tab-sellers" : "how-tab-buyers"}
        className="border border-t-0 border-[var(--line)] bg-[var(--ink-soft)] p-4 sm:p-8"
      >
        <p className="max-w-3xl text-base leading-7 text-gray-400 sm:text-lg">{t(isSellers ? "sellerLead" : "buyerLead")}</p>

        <ol ref={listRef} className="relative mt-10">
          {STEP_IDS.map((id) => (
            <li key={`${journey}-${id}`} className="how-step relative flex gap-4 pb-10 last:pb-0 sm:gap-6">
              {id < 10 ? (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute start-[calc(1.25rem-0.5px)] top-10 bottom-0 w-px bg-[color-mix(in_srgb,var(--sand)_38%,transparent)]"
                />
              ) : null}
              <span className="relative z-[1] flex size-10 shrink-0 items-center justify-center border border-[var(--sand)] bg-[var(--ink)] font-display text-xs tabular-nums tracking-wider text-[var(--sand)]">
                {String(id).padStart(2, "0")}
              </span>
              <div className="min-w-0 pt-1">
                <div className="flex items-start gap-2.5">
                  {icons[id]()}
                  <h2 className="font-display text-xl leading-snug text-white sm:text-2xl">
                    {t(`${stepNs}.${id}.title`)}
                  </h2>
                </div>
                <p className="mt-2 text-base leading-7 text-gray-400">{t(`${stepNs}.${id}.body`)}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Link href={primaryHref} className="btn-primary">
          {primaryLabel}
        </Link>
        <Link href={secondaryHref} className="btn-secondary">
          {secondaryLabel}
        </Link>
        <Link href="/contact" className="btn-secondary">
          {t("ctaContact")}
        </Link>
      </div>
    </div>
  );
}

function StrokeIcon({ children }: { children: ReactNode }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="mt-0.5 shrink-0 text-[var(--sand)]"
    >
      {children}
    </svg>
  );
}

function IconSubmit() {
  return (
    <StrokeIcon>
      <rect x="5" y="3" width="14" height="18" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" />
    </StrokeIcon>
  );
}

function IconEye() {
  return (
    <StrokeIcon>
      <path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="2.4" stroke="currentColor" strokeWidth="1.6" />
    </StrokeIcon>
  );
}

function IconCalendar() {
  return (
    <StrokeIcon>
      <rect x="4" y="5" width="16" height="15" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 3v4M16 3v4M4 10h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" />
    </StrokeIcon>
  );
}

function IconClipboard() {
  return (
    <StrokeIcon>
      <rect x="6" y="5" width="12" height="16" stroke="currentColor" strokeWidth="1.6" />
      <path d="M9 5V3h6v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" />
      <path d="M9 11h6M9 15h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" />
    </StrokeIcon>
  );
}

function IconTag() {
  return (
    <StrokeIcon>
      <path d="M3 12 12 3h8v8l-9 9-8-8z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="miter" />
      <circle cx="16.2" cy="7.8" r="1.15" stroke="currentColor" strokeWidth="1.6" />
    </StrokeIcon>
  );
}

function IconDocument() {
  return (
    <StrokeIcon>
      <path d="M7 3h7l5 5v13H7V3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="miter" />
      <path d="M14 3v5h5M10 13h6M10 17h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" />
    </StrokeIcon>
  );
}

function IconCamera() {
  return (
    <StrokeIcon>
      <path d="M4 8h3l2-2h6l2 2h3v11H4V8z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="miter" />
      <circle cx="12" cy="13.5" r="3.2" stroke="currentColor" strokeWidth="1.6" />
    </StrokeIcon>
  );
}

function IconCheckCircle() {
  return (
    <StrokeIcon>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 12.2l2.6 2.6L16.2 9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" />
    </StrokeIcon>
  );
}

function IconChat() {
  return (
    <StrokeIcon>
      <path d="M5 5h14v10H8l-3 3V5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="miter" />
    </StrokeIcon>
  );
}

function IconKey() {
  return (
    <StrokeIcon>
      <circle cx="8" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M11.5 12H21v3M17 12v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" />
    </StrokeIcon>
  );
}

function IconGrid() {
  return (
    <StrokeIcon>
      <rect x="4" y="4" width="6.5" height="6.5" stroke="currentColor" strokeWidth="1.6" />
      <rect x="13.5" y="4" width="6.5" height="6.5" stroke="currentColor" strokeWidth="1.6" />
      <rect x="4" y="13.5" width="6.5" height="6.5" stroke="currentColor" strokeWidth="1.6" />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" stroke="currentColor" strokeWidth="1.6" />
    </StrokeIcon>
  );
}

function IconSearch() {
  return (
    <StrokeIcon>
      <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.6" />
      <path d="M16 16l4.5 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" />
    </StrokeIcon>
  );
}

function IconFile() {
  return (
    <StrokeIcon>
      <path d="M7 3h7l5 5v13H7V3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="miter" />
      <path d="M14 3v5h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" />
    </StrokeIcon>
  );
}

function IconImage() {
  return (
    <StrokeIcon>
      <rect x="3" y="5" width="18" height="14" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="8.5" cy="10" r="1.4" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3 16.5 8 13l3.5 2.5L15 13l6 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" />
    </StrokeIcon>
  );
}

function IconMessage() {
  return (
    <StrokeIcon>
      <rect x="3" y="5" width="18" height="12" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3 7l9 6 9-6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" />
    </StrokeIcon>
  );
}

function IconPhone() {
  return (
    <StrokeIcon>
      <rect x="8" y="2.5" width="8" height="19" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M11 18.5h2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" />
    </StrokeIcon>
  );
}

function IconCalendarCheck() {
  return (
    <StrokeIcon>
      <rect x="4" y="5" width="16" height="15" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 3v4M16 3v4M4 10h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" />
      <path d="M9.5 16.2 11.3 18l4.2-4.4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" />
    </StrokeIcon>
  );
}

function IconCoins() {
  return (
    <StrokeIcon>
      <ellipse cx="12" cy="7.5" rx="7" ry="2.6" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M5 7.5v4c0 1.45 3.13 2.6 7 2.6s7-1.15 7-2.6v-4M5 11.5v4c0 1.45 3.13 2.6 7 2.6s7-1.15 7-2.6v-4"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </StrokeIcon>
  );
}

const SELLER_ICONS: Record<StepId, () => ReactNode> = {
  1: IconSubmit,
  2: IconEye,
  3: IconCalendar,
  4: IconClipboard,
  5: IconTag,
  6: IconDocument,
  7: IconCamera,
  8: IconCheckCircle,
  9: IconChat,
  10: IconKey,
};

const BUYER_ICONS: Record<StepId, () => ReactNode> = {
  1: IconGrid,
  2: IconSearch,
  3: IconFile,
  4: IconImage,
  5: IconMessage,
  6: IconPhone,
  7: IconEye,
  8: IconCalendarCheck,
  9: IconCoins,
  10: IconKey,
};
