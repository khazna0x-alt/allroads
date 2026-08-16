"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { PhotoCarousel } from "@/components/inventory/PhotoCarousel";
import { formatKm, formatOmr } from "@/lib/format";
import { arabicMake } from "@/lib/vehicleCopy";

export type PublicVehicleCard = {
  slug: string;
  stockCode: string;
  year: number;
  make: string;
  model: string;
  titleAr: string;
  titleEn: string;
  priceOmr: number;
  mileageKm: number;
  spec: "gcc" | "american" | "other";
  photos: Array<{ url: string; altAr: string; altEn: string }>;
};

export function VehicleCard({ vehicle }: { vehicle: PublicVehicleCard }) {
  const locale = useLocale();
  const t = useTranslations("Inventory");
  const title = locale === "ar" ? vehicle.titleAr : vehicle.titleEn;
  const photos = vehicle.photos.map((photo) => ({
    url: photo.url,
    alt: locale === "ar" ? photo.altAr : photo.altEn,
  }));

  return (
    <Link
      href={`/inventory/${vehicle.slug}`}
      className="group relative block overflow-hidden border border-[var(--line)] bg-[var(--ink-panel)]"
    >
      <div className="relative overflow-hidden bg-[var(--ink-soft)]">
        {photos.length > 0 ? (
          <PhotoCarousel photos={photos} sizes="card" label={t("gallery")} />
        ) : (
          <div className="mashrabiya flex aspect-[4/3] h-full items-end p-6">
            <p className="font-display text-4xl text-[var(--sand-bright)]">
              {locale === "ar" ? arabicMake(vehicle.make) : vehicle.make}
            </p>
          </div>
        )}
        <span className="absolute start-4 top-4 border border-[var(--sand)] bg-[rgba(10,10,10,0.72)] px-2 py-1 text-[10px] tracking-[0.2em] uppercase text-[var(--sand)]">
          {t(vehicle.spec)}
        </span>
      </div>
      <div className="space-y-2 p-5">
        <p className="text-[11px] tracking-[0.22em] uppercase text-[var(--ivory-dim)]">
          {vehicle.stockCode} · {vehicle.year}
        </p>
        <h3 className="font-display text-2xl leading-tight">{title}</h3>
        <div className="flex flex-wrap items-end justify-between gap-2 pt-2">
          <p className="text-[var(--sand-bright)]">{formatOmr(vehicle.priceOmr, locale)}</p>
          <p className="text-sm text-[var(--ivory-dim)]">{formatKm(vehicle.mileageKm, locale)}</p>
        </div>
      </div>
    </Link>
  );
}

export function VehicleCardSkeleton() {
  return (
    <div className="overflow-hidden border border-[var(--line)] bg-[var(--ink-panel)]" aria-hidden="true">
      <div className="inventory-skeleton aspect-[4/3]" />
      <div className="space-y-3 p-5">
        <div className="inventory-skeleton h-3 w-28" />
        <div className="inventory-skeleton h-7 w-4/5" />
        <div className="flex justify-between pt-1">
          <div className="inventory-skeleton h-5 w-24" />
          <div className="inventory-skeleton h-4 w-16" />
        </div>
      </div>
    </div>
  );
}

export function VehicleCardGridSkeleton({ count }: { count: number }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }, (_, index) => (
        <VehicleCardSkeleton key={index} />
      ))}
    </div>
  );
}
