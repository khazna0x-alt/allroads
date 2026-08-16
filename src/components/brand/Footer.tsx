import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { brand } from "@/lib/brand";
import { Mark } from "./Mark";

export async function Footer() {
  const t = await getTranslations("Footer");
  const nav = await getTranslations("Nav");
  const locale = await getLocale();
  const name = locale === "en" ? brand.nameEn : brand.nameAr;
  const location = locale === "en" ? brand.locationEn : brand.locationAr;
  const city = locale === "en" ? brand.cityEn : brand.cityAr;

  return (
    <footer className="mt-8 border-t border-[var(--line)] bg-[var(--ink-soft)]">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-5 sm:py-14 md:grid-cols-3">
        <div>
          <Mark className="mb-4 h-16 w-16" />
          <p className="font-display text-3xl text-white">{name}</p>
          <p className="mt-2 text-sm text-gray-400">
            {locale === "en" ? brand.taglineEn : brand.taglineAr}
          </p>
          <p className="mt-3 text-xs text-gray-500">C.R. No. {brand.crNumber}</p>
        </div>
        <div className="text-sm leading-7 text-gray-400">
          <p>{location}</p>
          <p>{city}</p>
          <a
            href={brand.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex size-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[var(--ivory-dim)] transition-colors hover:border-[var(--crimson)] hover:bg-[var(--crimson)] hover:text-white"
          >
            <InstagramIcon />
            <span className="sr-only">Instagram</span>
          </a>
        </div>
        <div className="flex flex-col gap-1 text-sm">
          <Link href="/inventory" className="inline-flex min-h-11 items-center hover:text-[var(--sand)]">
            {nav("inventory")}
          </Link>
          <Link href="/consign" className="inline-flex min-h-11 items-center hover:text-[var(--sand)]">
            {nav("consign")}
          </Link>
          <Link href="/contact" className="inline-flex min-h-11 items-center hover:text-[var(--sand)]">
            {nav("contact")}
          </Link>
          <Link href="/privacy" className="inline-flex min-h-11 items-center hover:text-[var(--sand)]">
            {nav("privacy")}
          </Link>
          <Link href="/terms" className="inline-flex min-h-11 items-center hover:text-[var(--sand)]">
            {nav("terms")}
          </Link>
        </div>
      </div>
      <div className="gold-rule" />
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-5 text-xs text-gray-500 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-5">
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
