"use client";

import { useQuery } from "convex/react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import {
  AdminButton,
  DeskSection,
  DeskTime,
  EmptyState,
  GoldRule,
  PageHeader,
  StatusBadge,
} from "@/components/admin/ui";
import { api } from "@/lib/convex";
import { displayVehicleTitle } from "@/lib/format";

const STATUSES = [
  "new",
  "under_review",
  "inspection_scheduled",
  "under_inspection",
  "awaiting_contract",
  "approved",
  "not_accepted",
  "approved_for_publishing",
  "published",
  "reserved",
  "booked",
  "sold",
  "withdrawn",
  "expired",
] as const;

export default function AdminHomePage() {
  const t = useTranslations("Admin.overview");
  const tAdmin = useTranslations("Admin");
  const tRoles = useTranslations("Admin.roles");
  const tStatus = useTranslations("Admin.status");
  const tSource = useTranslations("Admin.inquirySource");
  const locale = useLocale();
  const me = useQuery(api.staff.me);
  const stats = useQuery(api.vehicles.dashboardStats);
  const pending = useQuery(api.vehicles.listRecentPending, { limit: 5 });
  const inquiries = useQuery(api.inquiries.listRecent, { limit: 6 });
  const inquiryStats = useQuery(api.inquiries.deskStats);
  const bookingStats = useQuery(api.bookings.deskStats);
  const role = me?.role ? tRoles(me.role) : "";
  const queueCount = stats?.queueCount ?? 0;
  const newLeads = inquiryStats?.newCount ?? 0;
  const maxStatus = stats ? Math.max(...STATUSES.map((status) => stats.byStatus[status]), 1) : 1;
  const ready = Boolean(stats && pending && inquiries && inquiryStats && bookingStats);
  const needsDecision = queueCount > 0 || newLeads > 0;

  return (
    <div>
      <PageHeader
        kicker={t("kicker")}
        title={t("title")}
        lead={`${t("signedIn", { name: me?.name ?? t("staffFallback"), role })} · ${t("lead")}`}
        actions={
          <>
            <AdminButton href="/admin/inventory/new" variant="primary">
              {t("addVehicle")}
            </AdminButton>
            <AdminButton href="/admin/consignments" variant={queueCount > 0 ? "danger" : "secondary"}>
              {queueCount > 0 ? t("reviewQueueCount", { count: queueCount }) : t("reviewQueue")}
            </AdminButton>
            <AdminButton href="/admin/import">{t("importExcel")}</AdminButton>
          </>
        }
      />
      <GoldRule />

      {ready && stats && pending && inquiries && inquiryStats && bookingStats ? (
        <div className="admin-desk-stack mt-8">
          {needsDecision ? (
            <Link href={queueCount > 0 ? "/admin/consignments" : "/admin/inquiries"} className="admin-attention admin-reveal block">
              <p className="admin-kicker">{t("attentionKicker")}</p>
              <p className="font-display mt-2 text-2xl text-pretty sm:text-3xl">
                {t("attention", { queue: queueCount, leads: newLeads })}
              </p>
              <p className="mt-2 text-sm text-[var(--ivory-dim)]">{t("attentionHint")}</p>
            </Link>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
            <Metric
              href="/admin/inventory?status=published"
              label={t("onTheFloor")}
              hint={t("onTheFloorHint")}
              value={stats.onFloor}
              hero
            />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <Metric
                href="/admin/inventory?status=published"
                label={t("featured")}
                hint={t("featuredHint")}
                value={stats.featuredPublished}
              />
              <Metric
                href="/admin/consignments"
                label={t("queue")}
                hint={t("queueHint")}
                value={stats.queueCount}
                alert={stats.queueCount > 0}
              />
              <Metric
                href="/admin/inquiries"
                label={t("newLeads")}
                hint={t("newLeadsHint")}
                value={inquiryStats.newCount}
                alert={inquiryStats.newCount > 0}
              />
              <Metric
                href="/admin/bookings"
                label={t("holds")}
                hint={t("holdsHint")}
                value={bookingStats.reservedCount + bookingStats.bookedCount}
                alert={bookingStats.reservedCount > 0}
              />
            </div>
          </div>

          <section className="admin-card admin-reveal p-5 sm:p-6">
            <p className="admin-kicker">{t("ledger")}</p>
            <h2 className="font-display mt-1 text-xl sm:text-2xl">{t("ledgerLead")}</h2>
            <ul className="mt-6 space-y-3">
              {STATUSES.map((status) => {
                const count = stats.byStatus[status];
                const width = Math.max(4, Math.round((count / maxStatus) * 100));
                const hot = (status === "new" || status === "under_review") && count > 0;
                return (
                  <li key={status}>
                    <Link
                      href={`/admin/inventory?status=${status}`}
                      className="group grid grid-cols-[7.5rem_minmax(0,1fr)_2.5rem] items-center gap-3 sm:grid-cols-[9rem_minmax(0,1fr)_3rem]"
                    >
                      <span className="truncate text-sm text-[var(--ivory-dim)] group-hover:text-[var(--ivory)]">
                        {tStatus(status)}
                      </span>
                      <span className="admin-ledger-track" aria-hidden="true">
                        <span
                          className={`admin-ledger-fill block h-full ${hot ? "admin-ledger-fill-alert" : ""}`}
                          style={{ width: `${width}%` }}
                        />
                      </span>
                      <span className="text-end font-display tabular-nums text-[var(--sand-bright)]">{count}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>

          <div className="grid gap-6 xl:grid-cols-2">
            <DeskSection
              title={t("pendingTitle")}
              kicker={t("queue")}
              action={
                <AdminButton href="/admin/consignments" variant="ghost">
                  {t("pendingViewAll")}
                </AdminButton>
              }
            >
              {pending.length === 0 ? (
                <EmptyState
                  title={t("pendingEmpty")}
                  body={t("pendingLead")}
                  action={
                    <AdminButton href="/admin/inventory/new" variant="secondary">
                      {t("addVehicle")}
                    </AdminButton>
                  }
                />
              ) : (
                <ul className="divide-y divide-[var(--line)]">
                  {pending.map((vehicle) => (
                    <li key={vehicle._id} className="py-3 first:pt-0 last:pb-0">
                      <Link href={`/admin/inventory/${vehicle._id}`} className="admin-row-link block min-w-0">
                        <p className="text-xs tracking-[0.14em] text-[var(--sand)] uppercase">{vehicle.stockCode}</p>
                        <p className="font-display mt-1 truncate text-lg">
                          {displayVehicleTitle(vehicle, locale)}
                        </p>
                        <p className="mt-1 text-sm text-[var(--ivory-dim)]">
                          {vehicle.ownerName ? (
                            <>
                              {t("owner", { name: vehicle.ownerName })}
                              <span className="mx-2 text-[var(--line)]">·</span>
                            </>
                          ) : null}
                          <DeskTime value={vehicle.createdAt} />
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </DeskSection>

            <DeskSection
              title={t("inquiriesTitle")}
              kicker={
                inquiryStats.inProgressCount > 0
                  ? t("workingLeads", { count: inquiryStats.inProgressCount })
                  : t("newLeads")
              }
              action={
                <AdminButton href="/admin/inquiries" variant="ghost">
                  {t("inquiriesViewAll")}
                </AdminButton>
              }
            >
              {inquiries.length === 0 ? (
                <EmptyState title={t("inquiriesEmpty")} body={t("inquiriesLead")} />
              ) : (
                <ul className="divide-y divide-[var(--line)]">
                  {inquiries.map((inquiry) => (
                    <li key={inquiry._id} className="py-3 first:pt-0 last:pb-0">
                      <Link href="/admin/inquiries" className="admin-row-link block min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-display truncate text-lg">{inquiry.name}</p>
                          <StatusBadge kind="inquiry" value={inquiry.status} />
                        </div>
                        <p className="mt-1 truncate text-sm">{inquiry.subject}</p>
                        <p className="mt-1 text-sm text-[var(--ivory-dim)]">
                          {tSource(inquiry.source)}
                          {inquiry.vehicleStockCode ? ` · ${inquiry.vehicleStockCode}` : ""}
                          <span className="mx-2 text-[var(--line)]">·</span>
                          <DeskTime value={inquiry.createdAt} />
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </DeskSection>
          </div>
        </div>
      ) : (
        <DeskOpening label={tAdmin("opening")} />
      )}
    </div>
  );
}

function Metric({
  href,
  label,
  hint,
  value,
  hero = false,
  alert = false,
}: {
  href: string;
  label: string;
  hint: string;
  value: number;
  hero?: boolean;
  alert?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`admin-card admin-reveal admin-plate block ${hero ? "admin-plate-hero" : ""} ${
        alert ? "admin-plate-alert" : ""
      }`}
    >
      <p className="text-xs tracking-[0.16em] text-[var(--ivory-dim)] uppercase">{label}</p>
      <p
        className={`font-display mt-3 tabular-nums ${
          hero ? "text-6xl sm:text-7xl" : "text-4xl"
        } ${alert ? "text-[#f2c4c6]" : "text-[var(--sand-bright)]"}`}
      >
        {value}
      </p>
      <p className="mt-2 text-sm text-[var(--ivory-dim)]">{hint}</p>
    </Link>
  );
}

function DeskOpening({ label }: { label: string }) {
  return (
    <div className="mt-10" aria-busy="true" aria-live="polite">
      <p className="admin-kicker">{label}</p>
      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <div className="admin-skeleton h-44" />
        <div className="grid gap-4">
          <div className="admin-skeleton h-20" />
          <div className="admin-skeleton h-20" />
          <div className="admin-skeleton h-20" />
        </div>
      </div>
      <div className="admin-skeleton mt-6 h-56" />
    </div>
  );
}
