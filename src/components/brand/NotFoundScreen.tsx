import Link from "next/link";
import { Mark } from "@/components/brand/Mark";

export function NotFoundScreen({
  locale,
  kicker,
  title,
  lead,
  home,
  inventory,
}: {
  locale: string;
  kicker: string;
  title: string;
  lead: string;
  home: string;
  inventory: string;
}) {
  const homeHref = locale === "en" ? "/en" : "/";
  const inventoryHref = locale === "en" ? "/en/inventory" : "/inventory";

  return (
    <div className="relative mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center px-5 py-20 text-center">
      <div className="mashrabiya pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />
      <p className="relative text-[11px] tracking-[0.28em] uppercase text-[var(--sand)]">{kicker}</p>
      <p className="relative mt-4 font-display text-[5.5rem] leading-none text-[var(--sand)]">404</p>
      <Mark className="relative mt-4 h-16 w-16" eager />
      <h1 className="relative mt-6 font-display text-3xl text-pretty sm:text-4xl">{title}</h1>
      <p className="relative mt-4 max-w-xl text-base leading-7 text-[var(--ivory-dim)] text-pretty">{lead}</p>
      <div className="relative mt-10 flex flex-wrap items-center justify-center gap-3">
        <Link href={homeHref} className="btn-primary min-h-11 px-5">
          {home}
        </Link>
        <Link href={inventoryHref} className="btn-secondary min-h-11 px-5">
          {inventory}
        </Link>
      </div>
    </div>
  );
}
