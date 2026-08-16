"use client";

import { useMutation } from "convex/react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AdminButton, AdminField, AdminSelect, AdminTextarea, DeskCard } from "@/components/admin/ui";
import { api, type Id } from "@/lib/convex";
import { PhotoUploader } from "./PhotoUploader";
import { ContractUploader } from "./ContractUploader";

type VehicleValues = {
  stockCode?: string;
  vin?: string;
  make: string;
  model: string;
  year: number;
  trim?: string;
  priceOmr: number;
  mileageKm: number;
  fuel: "petrol" | "diesel" | "hybrid" | "plugin_hybrid" | "electric";
  transmission: "automatic" | "manual";
  drivetrain: "awd" | "4wd" | "rwd" | "fwd";
  spec: "gcc" | "american" | "other";
  condition: "new" | "used";
  bodyType: "suv" | "sedan" | "coupe" | "convertible" | "hatchback" | "wagon" | "pickup" | "van";
  exteriorColor: string;
  interiorColor: string;
  engine?: string;
  features: string[];
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  ownership: "dealership" | "consignment";
  featured?: boolean;
  ownerName?: string;
  ownerPhone?: string;
  ownerNotes?: string;
  staffNotes?: string;
  contractFileName?: string;
  contractUrl?: string | null;
};

export function VehicleForm({
  vehicleId,
  initial,
}: {
  vehicleId?: Id<"vehicles">;
  initial?: VehicleValues;
}) {
  const t = useTranslations("Admin");
  const router = useRouter();
  const create = useMutation(api.vehicles.create);
  const update = useMutation(api.vehicles.update);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSubmit(formData: FormData) {
    const payload: VehicleValues = {
      stockCode: String(formData.get("stockCode") ?? "") || undefined,
      vin: String(formData.get("vin") ?? "") || undefined,
      make: String(formData.get("make") ?? ""),
      model: String(formData.get("model") ?? ""),
      year: Number(formData.get("year")),
      trim: String(formData.get("trim") ?? "") || undefined,
      priceOmr: Number(formData.get("priceOmr")),
      mileageKm: Number(formData.get("mileageKm")),
      fuel: String(formData.get("fuel")) as VehicleValues["fuel"],
      transmission: String(formData.get("transmission")) as VehicleValues["transmission"],
      drivetrain: String(formData.get("drivetrain")) as VehicleValues["drivetrain"],
      spec: String(formData.get("spec")) as VehicleValues["spec"],
      condition: String(formData.get("condition")) as VehicleValues["condition"],
      bodyType: String(formData.get("bodyType")) as VehicleValues["bodyType"],
      exteriorColor: String(formData.get("exteriorColor") ?? ""),
      interiorColor: String(formData.get("interiorColor") ?? ""),
      engine: String(formData.get("engine") ?? "") || undefined,
      features: String(formData.get("features") ?? "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      titleAr: String(formData.get("titleAr") ?? ""),
      titleEn: String(formData.get("titleEn") ?? ""),
      descriptionAr: String(formData.get("descriptionAr") ?? ""),
      descriptionEn: String(formData.get("descriptionEn") ?? ""),
      ownership: String(formData.get("ownership")) as VehicleValues["ownership"],
      featured: formData.get("featured") === "on",
      ownerName: String(formData.get("ownerName") ?? "") || undefined,
      ownerPhone: String(formData.get("ownerPhone") ?? "") || undefined,
      ownerNotes: String(formData.get("ownerNotes") ?? "") || undefined,
      staffNotes: String(formData.get("staffNotes") ?? "") || undefined,
    };

    setSaving(true);
    try {
      if (vehicleId) {
        await update({ vehicleId, ...payload });
      } else {
        const id = await create(payload);
        router.push(`/admin/inventory/${id}`);
        return;
      }
      router.push("/admin/inventory");
    } catch {
      setError(t("inventory.saveFailed"));
      setSaving(false);
    }
  }

  return (
    <form action={onSubmit} className="space-y-6">
      <DeskCard>
        <h2 className="font-display text-xl">{t("inventory.sections.identity")}</h2>
        <div className="mt-5 grid min-w-0 gap-4 md:grid-cols-2">
          <AdminField name="stockCode" label={t("fields.stockCode")} defaultValue={initial?.stockCode} />
          <AdminField name="vin" label={t("fields.vin")} defaultValue={initial?.vin} spellCheck={false} />
          <AdminField name="make" label={t("fields.make")} defaultValue={initial?.make} required />
          <AdminField name="model" label={t("fields.model")} defaultValue={initial?.model} required />
          <AdminField
            name="year"
            label={t("fields.year")}
            type="number"
            inputMode="numeric"
            defaultValue={initial?.year ?? 2020}
            required
          />
          <AdminField name="trim" label={t("fields.trim")} defaultValue={initial?.trim} />
          <AdminSelect
            name="ownership"
            label={t("fields.ownership")}
            defaultValue={initial?.ownership ?? "dealership"}
            options={["dealership", "consignment"]}
            formatLabel={(value) => t(`options.ownership.${value}`)}
          />
          <label className="flex min-h-11 items-center gap-3 text-sm md:mt-7">
            <input
              type="checkbox"
              name="featured"
              defaultChecked={initial?.featured}
              className="size-4 accent-[var(--sand)]"
            />
            {t("inventory.featured")}
          </label>
        </div>
      </DeskCard>

      <DeskCard>
        <h2 className="font-display text-xl">{t("inventory.sections.specs")}</h2>
        <div className="mt-5 grid min-w-0 gap-4 md:grid-cols-2">
          <AdminField
            name="priceOmr"
            label={t("fields.priceOmr")}
            type="number"
            inputMode="numeric"
            defaultValue={initial?.priceOmr ?? 0}
            required
          />
          <AdminField
            name="mileageKm"
            label={t("fields.mileageKm")}
            type="number"
            inputMode="numeric"
            defaultValue={initial?.mileageKm ?? 0}
            required
          />
          <AdminSelect
            name="fuel"
            label={t("fields.fuel")}
            defaultValue={initial?.fuel ?? "petrol"}
            options={["petrol", "diesel", "hybrid", "plugin_hybrid", "electric"]}
            formatLabel={(value) => t(`options.fuel.${value}`)}
          />
          <AdminSelect
            name="transmission"
            label={t("fields.transmission")}
            defaultValue={initial?.transmission ?? "automatic"}
            options={["automatic", "manual"]}
            formatLabel={(value) => t(`options.transmission.${value}`)}
          />
          <AdminSelect
            name="drivetrain"
            label={t("fields.drivetrain")}
            defaultValue={initial?.drivetrain ?? "awd"}
            options={["awd", "4wd", "rwd", "fwd"]}
            formatLabel={(value) => t(`options.drivetrain.${value}`)}
          />
          <AdminSelect
            name="spec"
            label={t("fields.spec")}
            defaultValue={initial?.spec ?? "gcc"}
            options={["gcc", "american", "other"]}
            formatLabel={(value) => t(`options.spec.${value}`)}
          />
          <AdminSelect
            name="condition"
            label={t("fields.condition")}
            defaultValue={initial?.condition ?? "used"}
            options={["new", "used"]}
            formatLabel={(value) => t(`options.condition.${value}`)}
          />
          <AdminSelect
            name="bodyType"
            label={t("fields.bodyType")}
            defaultValue={initial?.bodyType ?? "suv"}
            options={["suv", "sedan", "coupe", "convertible", "hatchback", "wagon", "pickup", "van"]}
            formatLabel={(value) => t(`options.bodyType.${value}`)}
          />
          <AdminField name="exteriorColor" label={t("fields.exteriorColor")} defaultValue={initial?.exteriorColor} />
          <AdminField name="interiorColor" label={t("fields.interiorColor")} defaultValue={initial?.interiorColor} />
          <AdminField name="engine" label={t("fields.engine")} defaultValue={initial?.engine} />
          <AdminField name="features" label={t("fields.features")} defaultValue={initial?.features.join(", ")} />
        </div>
      </DeskCard>

      <DeskCard>
        <h2 className="font-display text-xl">{t("inventory.sections.copy")}</h2>
        <div className="mt-5 grid min-w-0 gap-4 md:grid-cols-2">
          <AdminField
            name="titleAr"
            label={t("fields.titleAr")}
            defaultValue={initial?.titleAr}
            required
            className="md:col-span-2"
            dir="rtl"
          />
          <AdminField
            name="titleEn"
            label={t("fields.titleEn")}
            defaultValue={initial?.titleEn}
            required
            className="md:col-span-2"
            dir="ltr"
          />
          <AdminTextarea name="descriptionAr" label={t("fields.descriptionAr")} defaultValue={initial?.descriptionAr} dir="rtl" />
          <AdminTextarea name="descriptionEn" label={t("fields.descriptionEn")} defaultValue={initial?.descriptionEn} dir="ltr" />
        </div>
      </DeskCard>

      <DeskCard>
        <h2 className="font-display text-xl">{t("inventory.sections.owner")}</h2>
        <div className="mt-5 grid min-w-0 gap-4 md:grid-cols-2">
          <AdminField name="ownerName" label={t("fields.ownerName")} defaultValue={initial?.ownerName} autoComplete="name" />
          <AdminField
            name="ownerPhone"
            label={t("fields.ownerPhone")}
            defaultValue={initial?.ownerPhone}
            inputMode="tel"
            autoComplete="tel"
          />
          <AdminTextarea name="ownerNotes" label={t("fields.ownerNotes")} defaultValue={initial?.ownerNotes} />
          <AdminTextarea name="staffNotes" label={t("fields.staffNotes")} defaultValue={initial?.staffNotes} />
        </div>
      </DeskCard>

      <DeskCard>
        <h2 className="font-display text-xl">{t("inventory.sections.contract")}</h2>
        <p className="mt-2 text-sm text-[var(--ivory-dim)]">{t("fields.contract")}</p>
        {vehicleId ? (
          <ContractUploader
            vehicleId={vehicleId}
            contractUrl={initial?.contractUrl}
            contractFileName={initial?.contractFileName}
          />
        ) : (
          <p className="mt-4 text-sm text-[var(--ivory-dim)]">{t("inventory.saveFirstContract")}</p>
        )}
      </DeskCard>

      {error ? (
        <p className="text-sm text-[#f2c4c6]" role="alert">
          {error}
        </p>
      ) : null}
      <AdminButton type="submit" variant="primary" className="w-full" disabled={saving}>
        {t("inventory.save")}
      </AdminButton>
      {vehicleId ? (
        <PhotoUploader vehicleId={vehicleId} />
      ) : (
        <p className="text-sm text-[var(--ivory-dim)]">{t("inventory.saveFirstPhotos")}</p>
      )}
    </form>
  );
}
