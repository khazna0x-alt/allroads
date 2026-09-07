"use client";

import { useQuery } from "convex/react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import {
  FunnelStrip,
  ShareBars,
  SparkBars,
} from "@/components/admin/DeskCharts";
import {
  AdminButton,
  DeskTime,
  GoldRule,
  StatusBadge,
  formatOmr,
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
  const [now] = useState(() => Date.now());
  const me = useQuery(api.staff.me);
  const stats = useQuery(api.vehicles.dashboardStats);
  const analytics = useQuery(api.analytics.deskAnalytics, { now });
  const pending = useQuery(api.vehicles.listRecentPending, { limit: 5 });
  const inquiries = useQuery(api.inquiries.listRecent, { limit: 6 });
  const inquiryStats = useQuery(api.inquiries.deskStats);
  const bookingStats = useQuery(api.bookings.deskStats);
  const role = me?.role ? tRoles(me.role) : "";
  const isAdmin = me?.role === "admin";
  const queueCount = stats?.queueCount ?? 0;
  const newLeads = inquiryStats?.newCount ?? 0;
  const ready = Boolean(stats && pending && inquiries && inquiryStats && bookingStats && analytics);
  const needsDecision = queueCount > 0 || newLeads > 0;

  return (
    <div>
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="admin-title font-display text-2xl text-pretty sm:text-3xl">{t("title")}</h1>
          <p className="mt-1 text-xs text-[var(--ivory-dim)]">
            {t("signedIn", { name: me?.name ?? t("staffFallback"), role })}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <AdminButton href="/admin/inventory/new" variant="primary">
            {t("addVehicle")}
          </AdminButton>
          <AdminButton href="/admin/consignments" variant={queueCount > 0 ? "danger" : "secondary"}>
            {queueCount > 0 ? t("reviewQueueCount", { count: queueCount }) : t("reviewQueue")}
          </AdminButton>
          {isAdmin ? <AdminButton href="/admin/import">{t("importExcel")}</AdminButton> : null}
        </div>
      </header>
      <GoldRule className="mt-4" />

      {ready && stats && pending && inquiries && inquiryStats && bookingStats && analytics ? (
        <div className="admin-desk-stack admin-overview mt-5">
          {needsDecision ? (
            <Link
              href={queueCount > 0 ? "/admin/consignments" : "/admin/inquiries"}
              className="admin-attention admin-attention-compact admin-reveal"
            >
              <p className="admin-kicker">{t("attentionKicker")}</p>
              <p className="font-display text-base text-pretty sm:text-lg">
                {t("attention", { queue: queueCount, leads: newLeads })}
              </p>
            </Link>
          ) : null}

          <div className="admin-kpi">
            <Metric
              href="/admin/inventory?status=published"
              label={t("onTheFloor")}
              hint={t("onTheFloorHint")}
              value={stats.onFloor}
            />
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
            <Metric
              href="/admin/inventory?status=published"
              label={t("charts.floorValue")}
              hint={t("charts.floorValueHint")}
              value={formatOmr(analytics.floorValueOmr, locale)}
            />
          </div>

          <div className="admin-kpi admin-kpi-secondary">
            <Metric
              href="/admin/inventory?status=published"
              label={t("charts.buyPrice")}
              hint={t("charts.buyPriceHint")}
              value={analytics.pricedOnFloor}
            />
            <Metric
              href="/admin/inventory?status=published"
              label={t("charts.requestPrice")}
              hint={t("charts.requestPriceHint")}
              value={analytics.requestOnFloor}
            />
            <Metric
              href="/admin/inventory?status=published"
              label={t("charts.financePrice")}
              hint={t("charts.financePriceHint")}
              value={analytics.financeOnFloor}
            />
            <Metric
              href="/admin/inquiries"
              label={t("charts.inquiries30d")}
              hint={t("charts.inquiries30dHint")}
              value={analytics.inquiries30d}
            />
          </div>

          <FunnelStrip
            title={t("charts.funnelTitle")}
            hint={t("charts.funnelHint")}
            steps={[
              { label: t("charts.funnelQueue"), value: analytics.pipeline.queue },
              { label: t("charts.funnelReady"), value: analytics.pipeline.ready },
              { label: t("charts.funnelFloor"), value: analytics.pipeline.floor },
              { label: t("charts.funnelSold"), value: analytics.pipeline.sold },
            ]}
          />

          <div className="grid gap-3 xl:grid-cols-2">
            <SparkBars
              title={t("charts.inquiriesTitle")}
              hint={t("charts.inquiriesHint")}
              points={analytics.inquirySeries}
              locale={locale}
            />
            <SparkBars
              title={t("charts.bookingsTitle")}
              hint={t("charts.bookingsHint")}
              points={analytics.bookingSeries}
              locale={locale}
            />
            <ShareBars
              title={t("charts.makesTitle")}
              hint={t("charts.makesHint")}
              rows={analytics.makesOnFloor.map((row) => ({ ...row, label: row.key }))}
            />
            <ShareBars
              title={t("charts.sourcesTitle")}
              hint={t("charts.sourcesHint")}
              rows={analytics.inquirySources.map((row) => ({
                ...row,
                label: row.key,
              }))}
            />
          </div>

          <section className="admin-card admin-reveal p-3.5 sm:p-4">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="font-display text-lg">{t("ledger")}</h2>
              <p className="text-xs text-[var(--ivory-dim)]">{t("ledgerLead")}</p>
            </div>
            <ul className="admin-status-grid mt-3">
              {STATUSES.map((status) => {
                const count = stats.byStatus[status];
                const hot = (status === "new" || status === "under_review") && count > 0;
                return (
                  <li key={status}>
                    <Link
                      href={`/admin/inventory?status=${status}`}
                      className={`admin-status-cell ${hot ? "admin-plate-alert" : ""}`}
                    >
                      <span className="min-w-0 truncate text-xs text-[var(--ivory-dim)]">
                        {tStatus(status)}
                      </span>
                      <span
                        className={`font-display tabular-nums ${
                          hot ? "text-[#f2c4c6]" : "text-[var(--sand-bright)]"
                        }`}
                      >
                        {count}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>

          <div className="grid gap-3 xl:grid-cols-2">
            <CompactSection
              title={t("pendingTitle")}
              kicker={t("queue")}
              action={<QuietLink href="/admin/consignments">{t("pendingViewAll")}</QuietLink>}
            >
              {pending.length === 0 ? (
                <p className="py-2 text-sm text-[var(--ivory-dim)]">{t("pendingEmpty")}</p>
              ) : (
                <ul className="divide-y divide-[var(--line)]">
                  {pending.map((vehicle) => (
                    <li key={vehicle._id} className="py-2 first:pt-0 last:pb-0">
                      <Link href={`/admin/inventory/${vehicle._id}`} className="admin-row-link block min-w-0">
                        <div className="flex items-baseline justify-between gap-3">
                          <p className="font-display truncate">{displayVehicleTitle(vehicle, locale)}</p>
                          <p className="shrink-0 text-[11px] tracking-[0.12em] text-[var(--sand)] uppercase">
                            {vehicle.stockCode}
                          </p>
                        </div>
                        <p className="mt-0.5 text-xs text-[var(--ivory-dim)]">
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
            </CompactSection>

            <CompactSection
              title={t("inquiriesTitle")}
              kicker={
                inquiryStats.inProgressCount > 0
                  ? t("workingLeads", { count: inquiryStats.inProgressCount })
                  : t("newLeads")
              }
              action={<QuietLink href="/admin/inquiries">{t("inquiriesViewAll")}</QuietLink>}
            >
              {inquiries.length === 0 ? (
                <p className="py-2 text-sm text-[var(--ivory-dim)]">{t("inquiriesEmpty")}</p>
              ) : (
                <ul className="divide-y divide-[var(--line)]">
                  {inquiries.map((inquiry) => (
                    <li key={inquiry._id} className="py-2 first:pt-0 last:pb-0">
                      <Link href="/admin/inquiries" className="admin-row-link block min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-display truncate">{inquiry.name}</p>
                          <StatusBadge kind="inquiry" value={inquiry.status} />
                        </div>
                        <p className="mt-0.5 truncate text-sm">{inquiry.subject}</p>
                        <p className="mt-0.5 text-xs text-[var(--ivory-dim)]">
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
            </CompactSection>
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
  alert = false,
}: {
  href: string;
  label: string;
  hint: string;
  value: ReactNode;
  alert?: boolean;
}) {
  return (
    <Link
      href={href}
      title={hint}
      className={`admin-card admin-reveal admin-stat ${alert ? "admin-plate-alert" : ""}`}
    >
      <p className="admin-stat-label">{label}</p>
      <p
        className={`admin-stat-value font-display tabular-nums ${
          alert ? "text-[#f2c4c6]" : "text-[var(--sand-bright)]"
        }`}
      >
        {value}
      </p>
    </Link>
  );
}

function CompactSection({
  title,
  kicker,
  action,
  children,
}: {
  title: string;
  kicker?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="admin-card admin-reveal p-3.5 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          {kicker ? <p className="admin-kicker">{kicker}</p> : null}
          <h2 className="font-display text-lg">{title}</h2>
        </div>
        {action}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function QuietLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="text-xs font-semibold tracking-[0.12em] text-[var(--sand)] uppercase hover:text-[var(--sand-bright)]"
    >
      {children}
    </Link>
  );
}

function DeskOpening({ label }: { label: string }) {
  return (
    <div className="mt-5" aria-busy="true" aria-live="polite">
      <p className="admin-kicker">{label}</p>
      <div className="admin-kpi mt-4">
        <div className="admin-skeleton h-16" />
        <div className="admin-skeleton h-16" />
        <div className="admin-skeleton h-16" />
        <div className="admin-skeleton h-16" />
        <div className="admin-skeleton h-16" />
        <div className="admin-skeleton h-16" />
      </div>
      <div className="admin-skeleton mt-3 h-28" />
    </div>
  );
}
