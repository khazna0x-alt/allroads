"use client";

import { useQuery } from "convex/react";
import { useLocale, useTranslations } from "next-intl";
import { use } from "react";
import { InquiryForm } from "@/components/forms/InquiryForm";
import { brand } from "@/lib/brand";
import { api } from "@/lib/convex";
import { formatKm, formatOmr } from "@/lib/format";
import { arabicMake } from "@/lib/vehicleCopy";

export default function VehicleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const locale = useLocale();
  const t = useTranslations("Inventory");
  const vehicle = useQuery(api.public.getPublishedBySlug, { slug });

  if (vehicle === undefined) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-5 sm:py-16" aria-busy="true">
        <p className="sr-only">{t("loading")}</p>
        <div className="inventory-skeleton h-3 w-40" />
        <div className="inventory-skeleton mt-4 h-10 w-3/4 max-w-xl" />
        <div className="inventory-skeleton mt-4 h-8 w-40" />
        <div className="mt-8 grid gap-3 md:grid-cols-2">
          <div className="inventory-skeleton aspect-[4/3]" />
          <div className="inventory-skeleton hidden aspect-[4/3] md:block" />
        </div>
        <div className="mt-10 grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-3">
            <div className="inventory-skeleton h-4 w-full" />
            <div className="inventory-skeleton h-4 w-11/12" />
            <div className="inventory-skeleton h-4 w-4/5" />
            <div className="mt-8 grid grid-cols-2 gap-3">
              {Array.from({ length: 8 }, (_, index) => (
                <div key={index} className="inventory-skeleton h-16" />
              ))}
            </div>
          </div>
          <div className="inventory-skeleton min-h-64" />
        </div>
      </div>
    );
  }
  if (vehicle === null) {
    return <div className="px-4 py-20 text-center sm:px-5">{t("empty")}</div>;
  }

  const title = locale === "ar" ? vehicle.titleAr : vehicle.titleEn;
  const description = locale === "ar" ? vehicle.descriptionAr : vehicle.descriptionEn;
  const whatsappHref = `${brand.whatsapp}?text=${encodeURIComponent(title)}`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-5 sm:py-16 lg:pb-16">
      <p className="text-[11px] tracking-[0.24em] uppercase text-[var(--sand)]">
        {vehicle.stockCode} · {t(vehicle.spec)}
      </p>
      <h1 className="font-display mt-3 text-3xl break-words sm:text-4xl md:text-5xl">{title}</h1>
      <p className="mt-3 text-xl text-[var(--sand-bright)] sm:text-2xl">{formatOmr(vehicle.priceOmr, locale)}</p>

      <div className="gallery-scroll mt-8 flex snap-x snap-mandatory gap-3 overflow-x-auto md:grid md:grid-cols-2 md:overflow-visible">
        {vehicle.photos.length > 0 ? (
          vehicle.photos.map((photo) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={photo.url}
              src={photo.url}
              alt={locale === "ar" ? photo.altAr : photo.altEn}
              className="aspect-[4/3] w-[min(100%,28rem)] shrink-0 snap-center object-cover md:w-full"
            />
          ))
        ) : (
          <div className="mashrabiya flex min-h-64 w-full items-end border border-[var(--line)] p-6 sm:min-h-80 sm:p-8">
            <p className="font-display text-4xl sm:text-5xl">
              {locale === "ar" ? arabicMake(vehicle.make) : vehicle.make}
            </p>
          </div>
        )}
      </div>

      <div className="mt-10 grid gap-10 pb-24 lg:grid-cols-[1.2fr_0.8fr] lg:pb-0">
        <div className="min-w-0">
          <p className="text-base leading-8 text-[var(--ivory-dim)] sm:text-lg">{description}</p>
          <dl className="mt-8 grid grid-cols-2 gap-3 text-sm">
            <Spec label={t("year")} value={String(vehicle.year)} />
            <Spec label={t("mileage")} value={formatKm(vehicle.mileageKm, locale)} />
            <Spec label={t("fuel")} value={t(vehicle.fuel)} />
            <Spec label={t("transmission")} value={t(vehicle.transmission)} />
            <Spec label={t("spec")} value={t(vehicle.spec)} />
            <Spec label={t("condition")} value={t(vehicle.condition)} />
            <Spec label={t("stock")} value={vehicle.stockCode} />
            <Spec label={t("available")} value={t("available")} />
          </dl>
          {vehicle.features.length > 0 ? (
            <ul className="mt-6 flex flex-wrap gap-2">
              {vehicle.features.map((feature) => (
                <li key={feature} className="border border-[var(--line)] px-3 py-1 text-sm break-words">
                  {feature}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <div id="inquire" className="min-w-0 scroll-mt-24 border border-[var(--line)] bg-[var(--ink-soft)] p-4 sm:p-6">
          <a
            href={whatsappHref}
            className="btn-primary mb-6 hidden w-full lg:flex"
          >
            {t("whatsapp")}
          </a>
          <h2 className="font-display mb-4 text-2xl">{t("inquire")}</h2>
          <InquiryForm vehicleId={vehicle._id} defaultSubject={title} />
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--line)] bg-[rgba(10,10,10,0.94)] px-4 py-3 backdrop-blur lg:hidden pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto flex max-w-6xl gap-2">
          <a
            href={whatsappHref}
            className="btn-primary flex-1 px-3 text-sm"
          >
            {t("whatsapp")}
          </a>
          <a
            href="#inquire"
            className="btn-secondary flex-1 px-3 text-sm"
          >
            {t("inquire")}
          </a>
        </div>
      </div>
    </div>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 border border-[var(--line)] p-3">
      <dt className="text-[var(--ivory-dim)]">{label}</dt>
      <dd className="mt-1 break-words">{value}</dd>
    </div>
  );
}
