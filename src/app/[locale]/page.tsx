import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { AboutSection } from "@/components/brand/AboutSection";
import { LocationCard } from "@/components/brand/LocationCard";
import { FeaturedCars } from "@/components/inventory/FeaturedCars";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const hero = await getTranslations("Hero");
  const services = await getTranslations("Services");
  const inventory = await getTranslations("Inventory");

  return (
    <div>
      <section className="relative -mt-[var(--header-h)] h-dvh min-h-svh overflow-hidden">
        <Image
          src="/hero.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[center_62%]"
        />
        <div className="hero-overlay absolute inset-0" aria-hidden="true" />
        <div className="omani-pattern pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="relative z-10 mx-auto flex h-full max-w-6xl flex-col px-4 sm:px-5">
          <div className="flex min-h-0 flex-1 items-center pt-[var(--header-h)] pb-20">
            <div className="min-w-0 max-w-3xl">
              <p className="reveal inline-block rounded-full border border-[var(--sand)]/50 bg-[var(--sand)]/10 px-4 py-2 text-xs font-semibold tracking-wide text-[var(--sand)] backdrop-blur-sm sm:text-sm">
                {hero("kicker")}
              </p>
              <h1 className="reveal-2 font-display mt-6 text-4xl leading-[1.35] text-white sm:text-5xl md:text-7xl">
                <span className="text-[var(--crimson)]">{hero("titleBrand")}</span>{" "}
                {hero("titleRest")}
              </h1>
              <p className="reveal-3 mt-6 max-w-2xl text-base text-gray-300 sm:text-lg md:text-xl">
                {hero("lead")}
              </p>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link href="/#services" className="btn-primary">
                  {hero("ctaServices")}
                </Link>
                <Link href="/inventory" className="btn-secondary">
                  {hero("ctaShowroom")}
                </Link>
              </div>
            </div>
          </div>
        </div>
        <a
          href="#about"
          className="hero-scroll absolute inset-x-0 bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-20"
        >
          <span className="hero-scroll-mouse" aria-hidden="true">
            <span className="hero-scroll-wheel" />
          </span>
          <svg
            className="hero-scroll-chevron"
            width="18"
            height="10"
            viewBox="0 0 18 10"
            aria-hidden="true"
            fill="none"
          >
            <path
              d="M1 1.5 9 8.5 17 1.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="square"
            />
          </svg>
          <span className="sr-only">{hero("scroll")}</span>
        </a>
      </section>

      <AboutSection />

      <section id="services" className="omani-pattern scroll-mt-24 bg-[var(--ink-soft)] py-14 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-5">
          <p className="font-bold tracking-[0.28em] uppercase text-[var(--sand)]">
            {services("eyebrow")}
          </p>
          <h2 className="font-display mt-3 text-3xl sm:text-4xl">{services("title")}</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <ServiceCard n="01" title={services("salesTitle")} body={services("salesBody")} />
            <ServiceCard
              n="02"
              title={services("vipTitle")}
              body={services("vipBody")}
              href="/consign"
            />
            <ServiceCard n="03" title={services("clearanceTitle")} body={services("clearanceBody")} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-5 sm:py-24">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="font-bold tracking-[0.28em] uppercase text-[var(--sand)]">
              {inventory("eyebrow")}
            </p>
            <h2 className="font-display mt-3 text-3xl sm:text-4xl">{inventory("homeTitle")}</h2>
          </div>
          <Link href="/inventory" className="shrink-0 text-sm text-[var(--sand)] underline">
            {inventory("title")}
          </Link>
        </div>
        <FeaturedCars />
      </section>

      <section id="location" className="scroll-mt-24 px-4 pb-14 sm:px-5 sm:pb-24">
        <div className="mx-auto max-w-6xl">
          <LocationCard />
        </div>
      </section>
    </div>
  );
}

function ServiceCard({
  n,
  title,
  body,
  href,
}: {
  n: string;
  title: string;
  body: string;
  href?: "/consign";
}) {
  const content = (
    <>
      <p className="text-[11px] tracking-[0.3em] text-[var(--sand)]">{n}</p>
      <h3 className="font-display mt-4 text-2xl">{title}</h3>
      <p className="mt-3 leading-7 text-gray-400">{body}</p>
    </>
  );

  const cardClassName =
    "service-card h-full border border-[var(--line)] bg-[var(--ink)] p-6";

  if (href) {
    return (
      <Link
        href={href}
        className={`${cardClassName} block text-inherit no-underline focus-visible:border-[var(--sand)]`}
      >
        {content}
      </Link>
    );
  }

  return <article className={cardClassName}>{content}</article>;
}
