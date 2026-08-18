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
    <article className="group relative flex h-full flex-col overflow-hidden border border-[var(--line)] bg-[var(--ink-panel)]">
      <div className="relative shrink-0 overflow-hidden bg-[var(--ink-soft)]">
        {photos.length > 0 ? (
          <PhotoCarousel photos={photos} sizes="card" label={t("gallery")} />
        ) : (
          <div className="mashrabiya flex aspect-[4/3] items-end p-6">
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
      <div className="flex flex-1 flex-col p-5">
        <p className="text-[11px] tracking-[0.22em] uppercase text-[var(--ivory-dim)]">
          {vehicle.stockCode} · {vehicle.year}
        </p>
        <h3 className="font-display mt-2 text-2xl leading-tight">
          <Link href={`/inventory/${vehicle.slug}`}>{title}</Link>
        </h3>
        <p className="mt-2 text-sm text-[var(--ivory-dim)]">
          {locale === "ar" ? arabicMake(vehicle.make) : vehicle.make} {vehicle.model} ·{" "}
          {t(`bodyTypes.${vehicle.bodyType}`)}
        </p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-2">
          <p className="text-[var(--sand-bright)]">{formatOmr(vehicle.priceOmr, locale)}</p>
          <p className="text-sm text-[var(--ivory-dim)]">{formatKm(vehicle.mileageKm, locale)}</p>
        </div>
        <div className="mt-auto grid grid-cols-2 items-stretch gap-2 pt-4">
          <Link
            href={`/inventory/${vehicle.slug}`}
            className="btn-secondary flex h-11 w-full min-w-0 items-center justify-center px-2 text-center text-sm whitespace-nowrap"
          >
            {t("viewDetails")}
          </Link>
          <WhatsAppButton
            href={whatsapp}
            ariaLabel={t("whatsapp")}
            className="h-11 w-full min-w-0 px-2 text-sm"
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
    <div className="flex h-full flex-col overflow-hidden border border-[var(--line)] bg-[var(--ink-panel)]" aria-hidden="true">
      <div className="inventory-skeleton aspect-[4/3] shrink-0" />
      <div className="flex flex-1 flex-col p-5">
        <div className="inventory-skeleton h-3 w-28" />
        <div className="inventory-skeleton mt-2 h-7 w-4/5" />
        <div className="inventory-skeleton mt-2 h-4 w-2/3" />
        <div className="mt-2 flex justify-between">
          <div className="inventory-skeleton h-5 w-24" />
          <div className="inventory-skeleton h-4 w-16" />
        </div>
        <div className="mt-auto grid grid-cols-2 gap-2 pt-4">
          <div className="inventory-skeleton h-11" />
          <div className="inventory-skeleton h-11" />
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
