"use client";

import { useMutation, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, use } from "react";
import { VehicleForm } from "@/components/admin/VehicleForm";
import { useConfirmDialog } from "@/components/admin/ConfirmDialog";
import { AdminButton, GoldRule, PageHeader, staffInventoryPath } from "@/components/admin/ui";
import { api, type Id } from "@/lib/convex";

export default function EditVehiclePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<EditFallback />}>
      <EditVehicleDesk params={params} />
    </Suspense>
  );
}

function EditFallback() {
  const t = useTranslations("Admin.inventory");
  return <p className="text-sm text-[var(--ivory-dim)]">{t("loading")}</p>;
}

function EditVehicleDesk({ params }: { params: Promise<{ id: string }> }) {
  const t = useTranslations("Admin");
  const tInventory = useTranslations("Admin.inventory");
  const confirm = useConfirmDialog();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { id } = use(params);
  const vehicleId = id as Id<"vehicles">;
  const vehicle = useQuery(api.vehicles.getStaff, { vehicleId });
  const removeVehicle = useMutation(api.vehicles.remove);
  const backHref = staffInventoryPath(searchParams.get("status"));

  if (vehicle === undefined) {
    return <p className="text-sm text-[var(--ivory-dim)]">{tInventory("loading")}</p>;
  }
  if (vehicle === null) {
    return (
      <div>
        <PageHeader
          kicker={tInventory("title")}
          title={tInventory("notFound")}
          back={
            <AdminButton href={backHref} variant="ghost">
              {tInventory("back")}
            </AdminButton>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        kicker={tInventory("title")}
        title={tInventory("edit", { stock: vehicle.stockCode })}
        back={
          <AdminButton href={backHref} variant="ghost">
            {tInventory("back")}
          </AdminButton>
        }
        actions={
          <AdminButton
            variant="danger"
            onClick={() => {
              void confirm({
                title: t("confirm.deleteTitle"),
                message: t("confirm.delete"),
                confirmLabel: tInventory("delete"),
                cancelLabel: t("confirm.cancel"),
                tone: "danger",
              }).then((ok) => {
                if (!ok) {
                  return;
                }
                void removeVehicle({ vehicleId }).then(() => {
                  router.replace(backHref);
                });
              });
            }}
          >
            {tInventory("delete")}
          </AdminButton>
        }
      />
      <GoldRule className="mb-8 mt-6" />
      <VehicleForm vehicleId={vehicleId} initial={vehicle} />
    </div>
  );
}
