"use client";

import { useMutation, useQuery } from "convex/react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState, type KeyboardEvent } from "react";
import { WhatsAppButton } from "@/components/brand/WhatsAppButton";
import { BookingForm } from "@/components/forms/BookingForm";
import { InquiryForm } from "@/components/forms/InquiryForm";
import { PhotoCarousel } from "@/components/inventory/PhotoCarousel";
import { PhotoLightbox } from "@/components/inventory/PhotoLightbox";
import { VehicleCard } from "@/components/inventory/VehicleCard";
import { api } from "@/lib/convex";
import { cylindersFromEngine, formatDate, formatKm, formatOmr } from "@/lib/format";
import { vehiclePublicUrl, whatsappHref } from "@/lib/listing";
import { arabicMake } from "@/lib/vehicleCopy";

type FormTab = "inquire" | "book";

function formTabFromHash(hash: string): FormTab {
  return hash === "#book" ? "book" : "inquire";
}

export function VehicleDetail({ slug }: { slug: string }) {
  const locale = useLocale();
  const t = useTranslations("Inventory");
  const vehicle = useQuery(api.public.getPublishedBySlug, { slug });
  const similar = useQuery(api.public.listSimilar, { slug });
  const logWhatsApp = useMutation(api.inquiries.logWhatsAppIntent);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [formTab, setFormTab] = useState<FormTab>("inquire");

  useEffect(() => {
    function syncHash() {
      setFormTab(formTabFromHash(window.location.hash));
    }
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  function selectFormTab(tab: FormTab) {
    setFormTab(tab);
    const hash = tab === "book" ? "#book" : "#inquire";
    if (window.location.hash !== hash) {
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}${hash}`);
    }
  }

  function onFormTabKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const rtl = document.documentElement.dir === "rtl";
    const nextKey = rtl ? "ArrowLeft" : "ArrowRight";
    const prevKey = rtl ? "ArrowRight" : "ArrowLeft";
    if (event.key === nextKey || event.key === "End") {
      event.preventDefault();
      selectFormTab("book");
      document.getElementById("vehicle-tab-book")?.focus();
    } else if (event.key === prevKey || event.key === "Home") {
      event.preventDefault();
      selectFormTab("inquire");
      document.getElementById("vehicle-tab-inquire")?.focus();
    }
  }

  if (vehicle === undefined) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-5 sm:py-16" aria-busy="true">
        <p className="sr-only">{t("loading")}</p>
        <div className="inventory-skeleton h-3 w-40" />
        <div className="inventory-skeleton mt-4 h-10 w-3/4 max-w-xl" />
        <div className="inventory-skeleton mt-4 h-8 w-40" />
        <div className="inventory-skeleton mt-8 aspect-[16/10] sm:aspect-[2/1]" />
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
  const statusKey =
    vehicle.status === "reserved"
      ? "statusReserved"
      : vehicle.status === "booked"
        ? "statusBooked"
        : "statusAvailable";
  const cylinders = cylindersFromEngine(vehicle.engine);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-5 sm:py-16 lg:pb-16">
      <p className="text-[11px] tracking-[0.24em] uppercase text-[var(--sand)]">
        {vehicle.stockCode} · {t(vehicle.spec)} · {t(statusKey)}
      </p>
      <h1 className="font-display mt-3 text-3xl break-words sm:text-4xl md:text-5xl">{title}</h1>
      <p className="mt-3 text-xl text-[var(--sand-bright)] sm:text-2xl">
        {formatOmr(vehicle.priceOmr, locale)}
      </p>
      <p className="mt-2 text-sm text-[var(--ivory-dim)]">
        {t("updated")}: {formatDate(vehicle.updatedAt, locale)}
      </p>

      <div className="mt-8 overflow-hidden border border-[var(--line)]">
        {photos.length > 0 ? (
          <PhotoCarousel
            photos={photos}
            sizes="detail"
            label={t("gallery")}
            onPhotoClick={(index) => setLightboxIndex(index)}
          />
        ) : (
          <div className="mashrabiya flex min-h-64 w-full items-end p-6 sm:min-h-80 sm:p-8">
            <p className="font-display text-4xl sm:text-5xl">
              {locale === "ar" ? arabicMake(vehicle.make) : vehicle.make}
            </p>
          </div>
        )}
      </div>

      <div className="mt-10 grid gap-10 pb-24 lg:grid-cols-[1.2fr_0.8fr] lg:pb-0">
        <div className="min-w-0">
          <h2 className="font-display text-2xl">{t("technicalNotes")}</h2>
          <p className="mt-3 text-base leading-8 text-[var(--ivory-dim)] sm:text-lg">{description}</p>
          <dl className="mt-8 grid grid-cols-2 gap-3 text-sm">
            <Spec label={t("make")} value={locale === "ar" ? arabicMake(vehicle.make) : vehicle.make} />
            <Spec label={t("model")} value={vehicle.model} />
            <Spec label={t("body")} value={t(`bodyTypes.${vehicle.bodyType}`)} />
            <Spec label={t("year")} value={String(vehicle.year)} />
            <Spec label={t("price")} value={formatOmr(vehicle.priceOmr, locale)} />
            <Spec label={t("mileage")} value={formatKm(vehicle.mileageKm, locale)} />
            <Spec label={t("spec")} value={t(vehicle.spec)} />
            <Spec label={t("exteriorColor")} value={vehicle.exteriorColor} />
            <Spec label={t("interiorColor")} value={vehicle.interiorColor} />
            <Spec label={t("fuel")} value={t(vehicle.fuel)} />
            <Spec label={t("transmission")} value={t(vehicle.transmission)} />
            {cylinders !== undefined ? (
              <Spec label={t("cylinders")} value={String(cylinders)} />
            ) : vehicle.engine ? (
              <Spec label={t("engine")} value={vehicle.engine} />
            ) : null}
            <Spec label={t("status")} value={t(statusKey)} />
            <Spec label={t("stock")} value={vehicle.stockCode} />
            {vehicle.inspectedAt !== undefined ? (
              <Spec label={t("inspected")} value={formatDate(vehicle.inspectedAt, locale)} />
            ) : null}
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
        <div className="min-w-0">
          <div className="mb-6 hidden lg:block">
            <WhatsAppButton
              href={whatsapp}
              ariaLabel={t("whatsapp")}
              className="w-full"
              onClick={() =>
                void logWhatsApp({
                  vehicleId: vehicle._id,
                  locale: locale === "ar" ? "ar" : "en",
                })
              }
            />
          </div>
          <div className="relative border border-[var(--line)] bg-[var(--ink-soft)]">
            <span id="inquire" className="absolute start-0 -top-24 h-px w-px" aria-hidden="true" />
            <span id="book" className="absolute start-0 -top-24 h-px w-px" aria-hidden="true" />
            <span id="viewing" className="absolute start-0 -top-24 h-px w-px" aria-hidden="true" />
            <div
              role="tablist"
              aria-label={`${t("inquireTab")} / ${t("bookTab")}`}
              onKeyDown={onFormTabKeyDown}
              className="grid grid-cols-2 border-b border-[var(--line)]"
            >
              <button
                type="button"
                role="tab"
                id="vehicle-tab-inquire"
                aria-selected={formTab === "inquire"}
                aria-controls="inquire-panel"
                tabIndex={formTab === "inquire" ? 0 : -1}
                onClick={() => selectFormTab("inquire")}
                className={`min-h-11 border-e border-b-2 border-e-[var(--line)] px-4 text-[11px] font-semibold tracking-[0.2em] uppercase ${
                  formTab === "inquire"
                    ? "-mb-px border-b-[var(--sand)] text-[var(--sand)]"
                    : "border-b-transparent text-[var(--ivory-dim)] hover:text-[var(--sand)]"
                }`}
              >
                {t("inquireTab")}
              </button>
              <button
                type="button"
                role="tab"
                id="vehicle-tab-book"
                aria-selected={formTab === "book"}
                aria-controls="book-panel"
                tabIndex={formTab === "book" ? 0 : -1}
                onClick={() => selectFormTab("book")}
                className={`min-h-11 border-b-2 px-4 text-[11px] font-semibold tracking-[0.2em] uppercase ${
                  formTab === "book"
                    ? "-mb-px border-b-[var(--sand)] text-[var(--sand)]"
                    : "border-b-transparent text-[var(--ivory-dim)] hover:text-[var(--sand)]"
                }`}
              >
                {t("bookTab")}
              </button>
            </div>
            <div className="p-4 sm:p-6">
              <div
                id="inquire-panel"
                role="tabpanel"
                hidden={formTab !== "inquire"}
                aria-labelledby="vehicle-tab-inquire"
              >
                <p className="mb-4 text-sm text-[var(--ivory-dim)]">{t("inquireHint")}</p>
                <InquiryForm
                  vehicleId={vehicle._id}
                  stockCode={vehicle.stockCode}
                  vehicleTitle={title}
                  defaultSubject={title}
                />
              </div>
              <div
                id="book-panel"
                role="tabpanel"
                hidden={formTab !== "book"}
                aria-labelledby="vehicle-tab-book"
              >
                <p className="mb-4 text-sm text-[var(--ivory-dim)]">{t("bookHint")}</p>
                <BookingForm
                  vehicleId={vehicle._id}
                  stockCode={vehicle.stockCode}
                  vehicleTitle={title}
                  depositOmr={vehicle.depositOmr}
                  canBook={vehicle.canBook}
                  blockedReason={
                    vehicle.status === "reserved"
                      ? t("bookBlockedReserved")
                      : vehicle.status === "booked"
                        ? t("bookBlockedBooked")
                        : undefined
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {similar && similar.length > 0 ? (
        <section className="mt-16">
          <h2 className="font-display text-3xl">{t("similar")}</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {similar.map((item) => (
              <VehicleCard key={item._id} vehicle={item} />
            ))}
          </div>
        </section>
      ) : null}

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--line)] bg-[rgba(10,10,10,0.94)] px-4 py-3 backdrop-blur lg:hidden pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto flex max-w-6xl gap-2">
          <WhatsAppButton
            href={whatsapp}
            ariaLabel={t("whatsapp")}
            className="min-w-0 flex-1 px-3 text-sm"
            onClick={() =>
              void logWhatsApp({
                vehicleId: vehicle._id,
                locale: locale === "ar" ? "ar" : "en",
              })
            }
          />
          <a href={vehicle.canBook ? "#book" : "#inquire"} className="btn-secondary flex-1 px-3 text-sm">
            {vehicle.canBook ? t("book") : t("inquire")}
          </a>
        </div>
      </div>

      {lightboxIndex !== null && photos.length > 0 ? (
        <PhotoLightbox
          photos={photos}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onIndexChange={setLightboxIndex}
        />
      ) : null}
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
