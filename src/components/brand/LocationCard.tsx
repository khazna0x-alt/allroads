import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { brand } from "@/lib/brand";

export async function LocationCard({
  compact = false,
}: {
  compact?: boolean;
}) {
  const t = await getTranslations("Location");
  const minHeight = compact
    ? "min-h-[16rem] sm:min-h-[18rem]"
    : "min-h-[18rem] sm:min-h-[24rem]";

  return (
    <a
      href={brand.maps}
      target="_blank"
      rel="noopener noreferrer"
      className={`relative block overflow-hidden rounded border border-[var(--line)] ${minHeight}`}
    >
      <Image
        src="/location.jpg"
        alt=""
        fill
        sizes="(max-width: 1152px) 100vw, 1152px"
        className="object-cover object-center"
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-[rgba(10,10,10,0.94)] via-[rgba(10,10,10,0.55)] to-[rgba(10,10,10,0.2)]"
        aria-hidden="true"
      />
      <div className="omani-pattern pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className={`relative z-10 flex ${minHeight} flex-col justify-end p-5 sm:p-8`}>
        <p className="text-[11px] font-semibold tracking-[0.28em] uppercase text-[var(--sand)]">
          {t("eyebrow")}
        </p>
        <h2 className="font-display mt-2 text-2xl text-white sm:text-4xl">{t("title")}</h2>
        <p className="mt-2 text-sm text-gray-400 sm:text-base">{t("city")}</p>
        <span className="btn-secondary mt-6 w-fit px-5 py-3 text-sm">{t("maps")}</span>
      </div>
    </a>
  );
}
