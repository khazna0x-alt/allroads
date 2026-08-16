"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Link, usePathname } from "@/i18n/navigation";

export function MobileNav() {
  const t = useTranslations("Nav");
  const pathname = usePathname();
  const [openPath, setOpenPath] = useState<string | null>(null);
  const open = openPath === pathname;

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenPath(null);
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const links = [
    { href: "/", label: t("home") },
    { href: "/inventory", label: t("inventory") },
    { href: "/consign", label: t("consign") },
    { href: "/contact", label: t("contact") },
  ] as const;

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="public-mobile-nav"
        onClick={() => setOpenPath(open ? null : pathname)}
        className="glass-chip inline-flex min-h-11 min-w-11 items-center justify-center text-[var(--sand-bright)]"
      >
        <span className="sr-only">{open ? t("close") : t("openMenu")}</span>
        {open ? <CloseIcon /> : <MenuIcon />}
      </button>
      {open ? (
        <div id="public-mobile-nav" className="glass-nav-panel absolute inset-x-0 top-full z-[60]">
          <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-5 py-4 text-sm">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="min-h-11 px-2 py-3 text-[var(--ivory)] hover:text-[var(--sand-bright)]"
                onClick={() => setOpenPath(null)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      ) : null}
    </div>
  );
}

function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        d="M2 4.5h14M2 9h14M2 13.5h14"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="square"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        d="M4 4l10 10M14 4L4 14"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="square"
      />
    </svg>
  );
}
