"use client";

import { useLocale, useTranslations } from "next-intl";
import { useMutation } from "convex/react";
import { Link } from "@/i18n/navigation";
import { WhatsAppButton } from "@/components/brand/WhatsAppButton";
import { PhotoCarousel } from "@/components/inventory/PhotoCarousel";
import { api, type Id } from "@/lib/convex";
import { formatKm, formatOmr } from "@/lib/format";
import { vehiclePublicUrl, whatsappHref } from "@/lib/listing";
import { arabicMake } from "@/lib/vehicleCopy";

export type PublicVehicleCard = {
  _id: Id<"vehicles">;
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
  bodyType:
    | "suv"
    | "sedan"
    | "coupe"
    | "convertible"
    | "hatchback"
    | "wagon"
    | "pickup"
    | "van";
  status: "published" | "reserved" | "booked";
  photos: Array<{ url: string; altAr: string; altEn: string }>;
};

function statusLabel(
  status: PublicVehicleCard["status"],
  t: (key: string) => string,
) {
  if (status === "reserved") {
    return t("statusReserved");
  }
  if (status === "booked") {
    return t("statusBooked");
  }
  return t("statusAvailable");
}

export function VehicleCard({ vehicle }: { vehicle: PublicVehicleCard }) {
  const locale = useLocale();
  const t = useTranslations("Inventory");
  const logWhatsApp = useMutation(api.inquiries.logWhatsAppIntent);
  const title = locale === "ar" ? vehicle.titleAr : vehicle.titleEn;
  const photos = vehicle.photos.map((photo) => ({
    url: photo.url,
    alt: locale === "ar" ? photo.altAr : photo.altEn,
  }));
  const listingUrl = vehiclePublicUrl(vehicle.slug, locale);
  const whatsapp = whatsappHref(
    t("whatsappMessage", {
      title,
      year: vehicle.year,
      stock: vehicle.stockCode,
      price: formatOmr(vehicle.priceOmr, locale),
      url: listingUrl,
    }),
  );

  return (
    <article className="group relative overflow-hidden border border-[var(--line)] bg-[var(--ink-panel)]">
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
        <Link
          href={`/inventory/${vehicle.slug}`}
          className="absolute inset-0 z-[1]"
          aria-label={t("viewDetails")}
        />
        <span className="pointer-events-none absolute start-4 top-4 z-20 border border-[var(--sand)] bg-[rgba(10,10,10,0.72)] px-2 py-1 text-[10px] tracking-[0.2em] uppercase text-[var(--sand)]">
          {t(vehicle.spec)}
        </span>
        <span className="pointer-events-none absolute end-4 top-4 z-20 border border-white/20 bg-[rgba(10,10,10,0.72)] px-2 py-1 text-[10px] tracking-[0.18em] uppercase text-white">
          {statusLabel(vehicle.status, t)}
        </span>
      </div>
      <div className="space-y-2 p-5">
        <p className="text-[11px] tracking-[0.22em] uppercase text-[var(--ivory-dim)]">
          {vehicle.stockCode} · {vehicle.year}
        </p>
        <h3 className="font-display text-2xl leading-tight">
          <Link href={`/inventory/${vehicle.slug}`}>{title}</Link>
        </h3>
        <p className="text-sm text-[var(--ivory-dim)]">
          {locale === "ar" ? arabicMake(vehicle.make) : vehicle.make} {vehicle.model} ·{" "}
          {t(`bodyTypes.${vehicle.bodyType}`)}
        </p>
        <div className="flex flex-wrap items-end justify-between gap-2 pt-2">
          <p className="text-[var(--sand-bright)]">{formatOmr(vehicle.priceOmr, locale)}</p>
          <p className="text-sm text-[var(--ivory-dim)]">{formatKm(vehicle.mileageKm, locale)}</p>
        </div>
        <div className="flex flex-col gap-2 pt-3 sm:flex-row">
          <Link href={`/inventory/${vehicle.slug}`} className="btn-secondary min-w-0 flex-1 text-center">
            {t("viewDetails")}
          </Link>
          <WhatsAppButton
            href={whatsapp}
            ariaLabel={t("whatsapp")}
            className="min-w-0 flex-1"
            onClick={() =>
              void logWhatsApp({
                vehicleId: vehicle._id,
                locale: locale === "ar" ? "ar" : "en",
              })
            }
          />
        </div>
      </div>
    </article>
  );
}

export function VehicleCardSkeleton() {
  return (
    <div className="overflow-hidden border border-[var(--line)] bg-[var(--ink-panel)]" aria-hidden="true">
      <div className="inventory-skeleton aspect-[4/3]" />
      <div className="space-y-3 p-5">
        <div className="inventory-skeleton h-3 w-28" />
        <div className="inventory-skeleton h-7 w-4/5" />
        <div className="inventory-skeleton h-4 w-2/3" />
        <div className="flex justify-between pt-1">
          <div className="inventory-skeleton h-5 w-24" />
          <div className="inventory-skeleton h-4 w-16" />
        </div>
        <div className="flex gap-2 pt-2">
          <div className="inventory-skeleton h-11 flex-1" />
          <div className="inventory-skeleton h-11 flex-1" />
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
