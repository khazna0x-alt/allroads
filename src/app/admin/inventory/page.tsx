"use client";

import { useMutation, usePaginatedQuery } from "convex/react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { startTransition, Suspense, useMemo, useState } from "react";
import { useConfirmDialog } from "@/components/admin/ConfirmDialog";
import {
  AdminButton,
  AdminCheckbox,
  EmptyState,
  FilterChip,
  formatOmr,
  GoldRule,
  PageHeader,
  parseStaffInventoryStatus,
  staffInventoryStatuses,
  staffNewVehiclePath,
  staffVehiclePath,
  StatusBadge,
} from "@/components/admin/ui";
import { api, type Id } from "@/lib/convex";
import { displayVehicleTitle } from "@/lib/format";

export default function AdminInventoryPage() {
  return (
    <Suspense fallback={<InventoryFallback />}>
      <InventoryDesk />
    </Suspense>
  );
}

function InventoryFallback() {
  const t = useTranslations("Admin.inventory");
  return <p className="text-sm text-[var(--ivory-dim)]">{t("loading")}</p>;
}

function InventoryDesk() {
  const t = useTranslations("Admin");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const confirm = useConfirmDialog();
  const status = parseStaffInventoryStatus(searchParams.get("status")) ?? "";
  const { results, status: pageStatus, loadMore } = usePaginatedQuery(
    api.vehicles.listStaff,
    { status: status || undefined },
    { initialNumItems: 20 },
  );
  const setStatusMany = useMutation(api.vehicles.setStatusMany);
  const removeMany = useMutation(api.vehicles.removeMany);
  const [selected, setSelected] = useState<Set<Id<"vehicles">>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [selectionStatus, setSelectionStatus] = useState(status);
  if (selectionStatus !== status) {
    setSelectionStatus(status);
    setSelected(new Set());
  }

  const pageIds = useMemo(() => results.map((vehicle) => vehicle._id), [results]);
  const selectedCount = selected.size;
  const selectedOnPage = pageIds.filter((id) => selected.has(id)).length;
  const allOnPageSelected = pageIds.length > 0 && selectedOnPage === pageIds.length;
  const someOnPageSelected = selectedOnPage > 0 && !allOnPageSelected;
  const selectedIds = useMemo(() => [...selected], [selected]);

  function setFilter(next: string) {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (next) {
        params.set("status", next);
      } else {
        params.delete("status");
      }
      const query = params.toString();
      router.replace(query ? `/admin/inventory?${query}` : "/admin/inventory");
    });
  }

  function toggleOne(vehicleId: Id<"vehicles">, checked: boolean) {
    setSelected((current) => {
      const next = new Set(current);
      if (checked) {
        next.add(vehicleId);
      } else {
        next.delete(vehicleId);
      }
      return next;
    });
  }

  function toggleSelectAll() {
    setSelected((current) => {
      const next = new Set(current);
      if (allOnPageSelected) {
        for (const id of pageIds) {
          next.delete(id);
        }
      } else {
        for (const id of pageIds) {
          next.add(id);
        }
      }
      return next;
    });
  }

  async function runBulk(
    request: {
      title: string;
      message: string;
      confirmLabel: string;
      tone?: "default" | "danger";
    },
    action: () => Promise<unknown>,
  ) {
    const ok = await confirm({
      title: request.title,
      message: request.message,
      confirmLabel: request.confirmLabel,
      cancelLabel: t("confirm.cancel"),
      tone: request.tone,
    });
    if (!ok) {
      return;
    }
    setBulkBusy(true);
    try {
      await action();
      setSelected(new Set());
    } finally {
      setBulkBusy(false);
    }
  }

  function bulkPublish() {
    void runBulk(
      {
        title: t("confirm.bulkPublishTitle"),
        message: t("confirm.bulkPublish", { count: selectedCount }),
        confirmLabel: t("inventory.publish"),
      },
      () => setStatusMany({ vehicleIds: selectedIds, status: "published" }),
    );
  }

  function bulkHide() {
    void runBulk(
      {
        title: t("confirm.bulkHideTitle"),
        message: t("confirm.bulkHide", { count: selectedCount }),
        confirmLabel: t("inventory.hide"),
      },
      () => setStatusMany({ vehicleIds: selectedIds, status: "hidden" }),
    );
  }

  function bulkDraft() {
    void runBulk(
      {
        title: t("confirm.bulkDraftTitle"),
        message: t("confirm.bulkDraft", { count: selectedCount }),
        confirmLabel: t("inventory.draft"),
      },
      () => setStatusMany({ vehicleIds: selectedIds, status: "draft" }),
    );
  }

  function bulkSold() {
    void runBulk(
      {
        title: t("confirm.bulkSoldTitle"),
        message: t("confirm.bulkSold", { count: selectedCount }),
        confirmLabel: t("inventory.sold"),
        tone: "danger",
      },
      () => setStatusMany({ vehicleIds: selectedIds, status: "sold" }),
    );
  }

  function bulkDelete() {
    void runBulk(
      {
        title: t("confirm.bulkDeleteTitle"),
        message: t("confirm.bulkDelete", { count: selectedCount }),
        confirmLabel: t("inventory.delete"),
        tone: "danger",
      },
      () => removeMany({ vehicleIds: selectedIds }),
    );
  }

  return (
    <div className={selectedCount > 0 ? "pb-28" : undefined}>
      <PageHeader
        kicker={t("nav.inventory")}
        title={t("inventory.title")}
        actions={
          <AdminButton href={staffNewVehiclePath(status)} variant="primary">
            {t("inventory.add")}
          </AdminButton>
        }
      />
      <GoldRule />
      <div className="mt-6 flex gap-2 overflow-x-auto pb-1 sm:flex-wrap">
        <FilterChip active={status === ""} onClick={() => setFilter("")}>
          {t("inventory.all")}
        </FilterChip>
        {staffInventoryStatuses.map((value) => (
          <FilterChip key={value} active={status === value} onClick={() => setFilter(value)}>
            {t(`status.${value}`)}
          </FilterChip>
        ))}
      </div>
      {results.length > 0 ? (
        <div className="mt-4 flex items-center gap-2 md:hidden">
          <AdminCheckbox
            checked={allOnPageSelected}
            indeterminate={someOnPageSelected}
            onChange={() => toggleSelectAll()}
            label={t("inventory.selectAll")}
          />
          <p className="text-sm text-[var(--ivory-dim)]">{t("inventory.selectAll")}</p>
        </div>
      ) : null}
      <div className="mt-6 space-y-3 md:hidden">
        {results.map((vehicle) => (
          <article
            key={vehicle._id}
            className={`admin-card p-4 ${selected.has(vehicle._id) ? "border-[var(--sand)]" : ""}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Link
                  href={staffVehiclePath(vehicle._id, status)}
                  className="text-xs tracking-[0.14em] text-[var(--sand)] uppercase underline-offset-4 hover:underline"
                >
                  {vehicle.stockCode}
                </Link>
                <h2 className="font-display mt-1 text-xl break-words">
                  {displayVehicleTitle(vehicle, locale)}
                </h2>
              </div>
              <AdminCheckbox
                checked={selected.has(vehicle._id)}
                onChange={(checked) => toggleOne(vehicle._id, checked)}
                label={t("inventory.selectRow", { stock: vehicle.stockCode })}
              />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <StatusBadge value={vehicle.status} />
              <p className="text-sm tabular-nums text-[var(--ivory-dim)]">
                {formatOmr(vehicle.priceOmr, locale)} {t("omr")}
              </p>
            </div>
            <div className="mt-4">
              <VehicleActions vehicleId={vehicle._id} published={vehicle.status === "published"} statusFilter={status} />
            </div>
          </article>
        ))}
      </div>
      <div className="mt-6 hidden overflow-x-auto md:block">
        <table className="admin-table w-full min-w-[720px] text-sm">
          <thead>
            <tr>
              <th className="w-11">
                <AdminCheckbox
                  checked={allOnPageSelected}
                  indeterminate={someOnPageSelected}
                  onChange={() => toggleSelectAll()}
                  label={t("inventory.selectAll")}
                />
              </th>
              <th>{t("inventory.stock")}</th>
              <th>{t("inventory.vehicle")}</th>
              <th>{t("inventory.statusCol")}</th>
              <th>{t("inventory.price")}</th>
              <th>{t("inventory.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {results.map((vehicle) => (
              <tr key={vehicle._id} className={selected.has(vehicle._id) ? "bg-[var(--sand)]/8" : undefined}>
                <td>
                  <AdminCheckbox
                    checked={selected.has(vehicle._id)}
                    onChange={(checked) => toggleOne(vehicle._id, checked)}
                    label={t("inventory.selectRow", { stock: vehicle.stockCode })}
                  />
                </td>
                <td className="font-medium">
                  <Link
                    href={staffVehiclePath(vehicle._id, status)}
                    className="text-[var(--sand)] underline-offset-4 hover:underline"
                  >
                    {vehicle.stockCode}
                  </Link>
                </td>
                <td className="min-w-0">
                  {displayVehicleTitle(vehicle, locale)}
                </td>
                <td>
                  <StatusBadge value={vehicle.status} />
                </td>
                <td className="tabular-nums">
                  {formatOmr(vehicle.priceOmr, locale)} {t("omr")}
                </td>
                <td>
                  <VehicleActions
                    vehicleId={vehicle._id}
                    published={vehicle.status === "published"}
                    statusFilter={status}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {results.length === 0 && pageStatus !== "LoadingFirstPage" ? (
        <div className="mt-6">
          <EmptyState
            title={t("inventory.empty")}
            action={
              <AdminButton href={staffNewVehiclePath(status)} variant="primary">
                {t("inventory.add")}
              </AdminButton>
            }
          />
        </div>
      ) : null}
      {pageStatus === "CanLoadMore" ? (
        <AdminButton onClick={() => loadMore(20)} className="mt-6">
          {t("loadMore")}
        </AdminButton>
      ) : null}
      {selectedCount > 0 ? (
        <div className="admin-bulk-bar" role="region" aria-label={t("inventory.selected", { count: selectedCount })}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-[var(--sand-bright)]">{t("inventory.selected", { count: selectedCount })}</p>
            <div className="flex flex-wrap gap-2">
              <AdminButton onClick={bulkPublish} disabled={bulkBusy}>
                {t("inventory.publish")}
              </AdminButton>
              <AdminButton onClick={bulkHide} disabled={bulkBusy}>
                {t("inventory.hide")}
              </AdminButton>
              <AdminButton onClick={bulkDraft} disabled={bulkBusy}>
                {t("inventory.draft")}
              </AdminButton>
              <AdminButton variant="danger" onClick={bulkSold} disabled={bulkBusy}>
                {t("inventory.sold")}
              </AdminButton>
              <AdminButton variant="danger" onClick={bulkDelete} disabled={bulkBusy}>
                {t("inventory.delete")}
              </AdminButton>
              <AdminButton variant="ghost" onClick={() => setSelected(new Set())} disabled={bulkBusy}>
                {t("inventory.clearSelection")}
              </AdminButton>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function VehicleActions({
  vehicleId,
  published,
  statusFilter,
}: {
  vehicleId: Id<"vehicles">;
  published: boolean;
  statusFilter: string;
}) {
  const t = useTranslations("Admin");
  const setVehicleStatus = useMutation(api.vehicles.setStatus);

  return (
    <div className="flex flex-wrap gap-2">
      <AdminButton href={staffVehiclePath(vehicleId, statusFilter)} variant="ghost">
        {t("inventory.editLink")}
      </AdminButton>
      {published ? (
        <AdminButton onClick={() => void setVehicleStatus({ vehicleId, status: "hidden" })}>
          {t("inventory.hide")}
        </AdminButton>
      ) : (
        <AdminButton onClick={() => void setVehicleStatus({ vehicleId, status: "published" })}>
          {t("inventory.publish")}
        </AdminButton>
      )}
    </div>
  );
}
