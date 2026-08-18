import Image from "next/image";
import { getTranslations } from "next-intl/server";

export async function AboutSection() {
  const t = await getTranslations("About");

  return (
    <section id="about" className="omani-pattern relative scroll-mt-24 py-16 sm:py-24">
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 md:grid-cols-2 md:gap-16">
          <div className="min-w-0">
            <p className="mb-2 text-sm font-bold tracking-[0.28em] text-[var(--sand)] uppercase">
              {t("eyebrow")}
            </p>
            <h2 className="font-display mb-6 text-3xl text-white sm:text-4xl">{t("title")}</h2>
            <p className="mb-6 text-justify text-lg leading-relaxed text-gray-400">{t("body")}</p>
            <div className="mt-8 flex items-center gap-5 rounded-lg border border-white/5 bg-[var(--ink-soft)] p-5 sm:gap-6 sm:p-6">
              <ShieldHalved />
              <div className="min-w-0">
                <h3 className="mb-1 text-lg font-bold text-white">{t("pillarTitle")}</h3>
                <p className="text-sm text-gray-400">{t("pillarBody")}</p>
              </div>
            </div>
          </div>

          <div className="relative mx-6 mt-4 md:mx-0 md:mt-0">
            <div
              className="absolute -top-6 -start-6 z-0 size-32 rounded-lg border-2 border-[var(--sand)] opacity-50"
              aria-hidden="true"
            />
            <div
              className="absolute -end-6 -bottom-6 z-0 size-48 rounded-lg bg-[var(--crimson)] opacity-50"
              aria-hidden="true"
            />
            <div className="relative z-10 flex h-[min(500px,70vw)] w-full items-center justify-center overflow-hidden rounded-lg bg-[var(--ink)] shadow-2xl md:h-[500px]">
              <Image
                src="/allroadslogo.png"
                alt={t("imageAlt")}
                width={1080}
                height={1130}
                sizes="(max-width: 768px) 70vw, 28rem"
                className="h-auto w-[min(72%,22rem)] object-contain drop-shadow-[0_0_48px_rgba(212,175,55,0.16)]"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ShieldHalved() {
  return (
    <svg
      viewBox="0 0 512 512"
      aria-hidden="true"
      className="size-9 shrink-0 text-[var(--crimson)] sm:size-10"
    >
      <path
        fill="currentColor"
        d="M256 0c4.6 0 9.2 1 13.4 2.9L457.7 82.8c22 9.3 38.4 31 38.3 57.2c-.5 99.2-41.3 280.7-213.6 363.2c-16.7 8-36.1 8-52.8 0C57.3 420.7 16.5 239.2 16 140c-.1-26.2 16.3-47.9 38.3-57.2L242.7 2.9C246.8 1 251.4 0 256 0zm0 66.8V444.8C394 378 431.1 230.1 432 141.4L256 66.8z"
      />
    </svg>
  );
}
