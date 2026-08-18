import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { brand } from "@/lib/brand";
import { Mark } from "./Mark";
import { WhatsAppIcon } from "./WhatsAppButton";

export async function Footer() {
  const t = await getTranslations("Footer");
  const nav = await getTranslations("Nav");
  const locale = await getLocale();
  const name = locale === "en" ? brand.nameEn : brand.nameAr;

  return (
    <footer className="mt-8 border-t border-[var(--line)] bg-[var(--ink-soft)]">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-5 sm:py-14 md:grid-cols-2">
        <div>
          <Mark className="mb-4 h-16 w-16" />
          <p className="font-display text-3xl text-white">{name}</p>
          <p className="mt-2 text-sm text-gray-400">
            {locale === "en" ? brand.taglineEn : brand.taglineAr}
          </p>
          <p className="mt-3 text-xs text-gray-500">C.R. No. {brand.crNumber}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <a
              href={brand.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex size-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[var(--ivory-dim)] transition-colors hover:border-[var(--crimson)] hover:bg-[var(--crimson)] hover:text-white"
            >
              <InstagramIcon />
              <span className="sr-only">Instagram</span>
            </a>
            <a
              href={brand.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={nav("whatsapp")}
              className="inline-flex size-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[var(--ivory-dim)] transition-colors hover:border-[var(--crimson)] hover:bg-[var(--crimson)] hover:text-white"
            >
              <WhatsAppIcon />
              <span className="sr-only">{nav("whatsapp")}</span>
            </a>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-6 text-sm sm:gap-x-10">
          <div className="flex flex-col gap-1">
            <Link href="/inventory" className="inline-flex min-h-11 items-center hover:text-[var(--sand)]">
              {nav("inventory")}
            </Link>
            <Link href="/consign" className="inline-flex min-h-11 items-center hover:text-[var(--sand)]">
              {nav("consign")}
            </Link>
            <Link href="/how-it-works" className="inline-flex min-h-11 items-center hover:text-[var(--sand)]">
              {nav("howItWorks")}
            </Link>
            <Link href="/contact" className="inline-flex min-h-11 items-center hover:text-[var(--sand)]">
              {nav("contact")}
            </Link>
          </div>
          <div className="flex flex-col gap-1">
            <Link href="/privacy" className="inline-flex min-h-11 items-center hover:text-[var(--sand)]">
              {nav("privacy")}
            </Link>
            <Link href="/terms" className="inline-flex min-h-11 items-center hover:text-[var(--sand)]">
              {nav("terms")}
            </Link>
            <Link href="/booking-terms" className="inline-flex min-h-11 items-center hover:text-[var(--sand)]">
              {nav("bookingTerms")}
            </Link>
          </div>
        </div>
      </div>
      <div className="gold-rule" />
      <div className="mx-auto max-w-6xl px-4 py-5 text-center text-xs text-gray-500 sm:px-5">
        <p>
          © {new Date().getFullYear()} {brand.legalEn}. {t("rights")}
        </p>
      </div>
    </footer>
  );
}

function InstagramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="none">
      <rect
        x="3.5"
        y="3.5"
        width="17"
        height="17"
        rx="5"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <circle cx="12" cy="12" r="4.1" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" />
    </svg>
  );
}
