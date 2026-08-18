"use client";

import { useQuery } from "convex/react";
import { useLocale, useTranslations } from "next-intl";
import { AdminButton, DeskTime } from "@/components/admin/ui";
import { api, type Id } from "@/lib/convex";
import { displayVehicleTitle } from "@/lib/format";

export function InspectionReport({ vehicleId }: { vehicleId: Id<"vehicles"> }) {
  const t = useTranslations("Admin");
  const locale = useLocale();
  const vehicle = useQuery(api.vehicles.getStaff, { vehicleId });
  const inspection = useQuery(api.inspections.getForVehicle, { vehicleId });

  if (vehicle === undefined || inspection === undefined) {
    return <p className="text-sm text-[var(--ivory-dim)]">{t("inventory.loading")}</p>;
  }
  if (vehicle === null) {
    return <p className="text-sm text-[var(--ivory-dim)]">{t("inventory.notFound")}</p>;
  }

  const rows: Array<{ label: string; value: string }> = [
    { label: t("fields.stockCode"), value: vehicle.stockCode },
    { label: t("fields.vin"), value: vehicle.vin ?? "—" },
    { label: t("inspection.inspectorName"), value: inspection?.inspectorName ?? "—" },
    {
      label: t("inspection.inspectedAt"),
      value: inspection?.inspectedAt ? new Date(inspection.inspectedAt).toLocaleString(locale === "ar" ? "ar-OM" : "en-GB") : "—",
    },
    {
      label: t("inspection.verdict"),
      value: inspection?.verdict ? t(`inspection.verdicts.${inspection.verdict}`) : t("inspection.verdictUnset"),
    },
    {
      label: t("inspection.chassisMatch"),
      value: inspection?.chassisMatchesDocs === true ? t("inspection.yes") : t("inspection.no"),
    },
    {
      label: t("inspection.actualMileage"),
      value: inspection?.actualMileageKm !== undefined ? String(inspection.actualMileageKm) : "—",
    },
    { label: t("inspection.body"), value: inspection?.bodyNotes ?? "—" },
    { label: t("inspection.paint"), value: inspection?.paintNotes ?? "—" },
    { label: t("inspection.accident"), value: inspection?.accidentHistory ?? "—" },
    { label: t("inspection.engine"), value: inspection?.engineNotes ?? "—" },
    { label: t("inspection.transmission"), value: inspection?.transmissionNotes ?? "—" },
    { label: t("inspection.ac"), value: inspection?.acNotes ?? "—" },
    { label: t("inspection.interior"), value: inspection?.interiorNotes ?? "—" },
    { label: t("inspection.tires"), value: inspection?.tiresNotes ?? "—" },
    { label: t("inspection.ownership"), value: inspection?.ownershipReview ?? "—" },
    { label: t("inspection.notes"), value: inspection?.notes ?? "—" },
  ];

  return (
    <article className="inspection-print admin-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-3 print:hidden">
        <div>
          <p className="admin-kicker">{t("inspection.reportKicker")}</p>
          <h1 className="font-display mt-2 text-3xl">{t("inspection.reportTitle")}</h1>
          <p className="mt-1 text-sm text-[var(--ivory-dim)]">
            {displayVehicleTitle(vehicle, locale)} · {vehicle.stockCode}
          </p>
        </div>
        <AdminButton type="button" variant="primary" onClick={() => window.print()}>
          {t("inspection.print")}
        </AdminButton>
      </div>
      <header className="hidden print:block">
        <p className="text-xs tracking-[0.2em] uppercase">All Roads</p>
        <h1 className="mt-1 text-2xl">{t("inspection.reportTitle")}</h1>
        <p className="mt-1">
          {displayVehicleTitle(vehicle, locale)} · {vehicle.stockCode}
        </p>
      </header>
      <dl className="mt-6 grid gap-3 text-sm">
        {rows.map((row) => (
          <div key={row.label} className="grid gap-1 border-b border-[var(--line)] pb-3 md:grid-cols-[12rem_minmax(0,1fr)]">
            <dt className="text-[var(--ivory-dim)]">{row.label}</dt>
            <dd className="whitespace-pre-wrap">{row.value}</dd>
          </div>
        ))}
      </dl>
      {inspection?.photos && inspection.photos.length > 0 ? (
        <section className="mt-6">
          <h2 className="font-display text-xl">{t("inspection.photos")}</h2>
          <div className="mt-4 grid grid-cols-2 gap-4">
            {inspection.photos.map((photo) => (
              <figure key={photo._id}>
                {photo.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photo.url} alt={photo.caption} className="w-full object-cover" />
                ) : null}
                <figcaption className="mt-2 text-xs">{photo.caption}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      ) : null}
      {inspection?.updatedAt ? (
        <p className="mt-6 text-xs text-[var(--ivory-dim)]">
          {t("inspection.printedAt")} <DeskTime value={inspection.updatedAt} />
        </p>
      ) : null}
    </article>
  );
}
