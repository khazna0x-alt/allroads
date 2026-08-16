import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { brand } from "@/lib/brand";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { Mark } from "./Mark";
import { MobileNav } from "./MobileNav";

export async function Header() {
  const t = await getTranslations("Nav");
  const locale = await getLocale();
  const name = locale === "en" ? brand.nameEn : brand.nameAr;
  const subtitle = locale === "en" ? brand.subtitleEn : brand.subtitleAr;

  return (
    <header className="glass-nav fixed inset-x-0 top-0 z-40">
      <div className="relative mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-5">
        <Link href="/" className="flex min-w-0 items-center gap-2 text-white sm:gap-3">
          <Mark className="h-12 w-12 shrink-0 sm:h-14 sm:w-14" eager />
          <span className="min-w-0 leading-tight">
            <span className="font-display block truncate text-lg tracking-wider sm:text-xl">
              {name}
            </span>
            <span className="block truncate text-[10px] tracking-[0.28em] uppercase text-[var(--sand)]">
              {subtitle}
            </span>
          </span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-[var(--ivory-dim)] md:flex">
          <Link href="/" className="hover:text-[var(--sand)]">
            {t("home")}
          </Link>
          <Link href="/inventory" className="hover:text-[var(--sand)]">
            {t("inventory")}
          </Link>
          <Link href="/consign" className="hover:text-[var(--sand)]">
            {t("consign")}
          </Link>
          <Link href="/contact" className="hover:text-[var(--sand)]">
            {t("contact")}
          </Link>
        </nav>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <LocaleSwitcher />
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
