"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useId, useRef, useState } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

const localeMessageKey = {
  ar: "arabic",
  en: "english",
} as const;

export function LocaleSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations("Nav");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const currentKey = locale === "en" ? "english" : "arabic";

  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        aria-haspopup="listbox"
        aria-label={t("language")}
        onClick={() => setOpen((value) => !value)}
        className="glass-chip inline-flex min-h-11 items-center gap-1.5 px-2.5 text-[13px] text-[var(--sand-bright)] transition-colors hover:border-[var(--sand)] hover:bg-[color-mix(in_srgb,var(--sand)_16%,transparent)] sm:gap-2 sm:px-3"
      >
        <span className="max-w-[6.5rem] truncate sm:max-w-none">{t(currentKey)}</span>
        <ChevronIcon open={open} />
      </button>
      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-label={t("language")}
          className="glass-menu absolute end-0 top-[calc(100%+0.35rem)] z-[70] min-w-[10.5rem] overflow-hidden py-1"
        >
          {routing.locales.map((code) => {
            const selected = code === locale;
            return (
              <li key={code} role="none">
                <Link
                  href={pathname}
                  locale={code}
                  hrefLang={code}
                  role="option"
                  aria-selected={selected}
                  onClick={() => setOpen(false)}
                  className={`flex min-h-11 items-center justify-between gap-3 px-3 text-sm ${
                    selected
                      ? "bg-[color-mix(in_srgb,var(--sand)_18%,transparent)] text-[var(--sand-bright)]"
                      : "text-[var(--ivory)] hover:bg-[color-mix(in_srgb,var(--sand)_10%,transparent)] hover:text-[var(--sand-bright)]"
                  }`}
                >
                  <span>{t(localeMessageKey[code])}</span>
                  {selected ? <CheckIcon /> : null}
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" className="text-[var(--sand)]">
      <path
        d="M2 6.2 L4.6 8.8 L10 3.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="square"
      />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      aria-hidden="true"
      className={`shrink-0 text-[var(--sand)] transition-transform ${open ? "rotate-180" : ""}`}
    >
      <path
        d="M2 3.5 L5 6.5 L8 3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="square"
      />
    </svg>
  );
}
