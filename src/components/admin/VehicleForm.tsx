"use client";

import { useMutation, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  AdminButton,
  AdminField,
  AdminSelect,
  AdminTextarea,
  DeskCard,
  staffInventoryPath,
  staffVehiclePath,
} from "@/components/admin/ui";
import { VehicleWizardProgress } from "@/components/admin/VehicleWizardProgress";
import { api, type Id } from "@/lib/convex";
import { convexErrorMessage } from "@/lib/convexError";
import {
  emptyVehicleDraft,
  featuresFromText,
  firstIncompleteStep,
  identityComplete,
  nextWizardStep,
  parseWizardStep,
  previousWizardStep,
  type VehicleDraft,
  type WizardStep,
} from "@/lib/vehicleWizard";
import { PhotoUploader } from "./PhotoUploader";
import { ContractDesk } from "./ContractDesk";
import { InspectionForm } from "./InspectionForm";
import { OwnerDeskActions } from "./OwnerDeskActions";

type VehicleValues = {
  stockCode?: string;
  vin?: string;
  make: string;
  model: string;
  year: number;
  trim?: string;
  priceOmr: number;
  mileageKm: number;
  fuel: VehicleDraft["fuel"];
  transmission: VehicleDraft["transmission"];
  drivetrain: VehicleDraft["drivetrain"];
  spec: VehicleDraft["spec"];
  condition: VehicleDraft["condition"];
  bodyType: VehicleDraft["bodyType"];
  exteriorColor: string;
  interiorColor: string;
  engine?: string;
  features: string[];
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  ownership: VehicleDraft["ownership"];
  featured?: boolean;
  ownerName?: string;
  ownerPhone?: string;
  ownerNotes?: string;
  staffNotes?: string;
  publicHidden?: boolean;
  onSiteConfirmed?: boolean;
  contractStatus?: "unsigned" | "awaiting_signature" | "signed" | "expired" | "cancelled";
  contractStartsAt?: number;
  contractEndsAt?: number;
  contractFileName?: string;
  contractUrl?: string | null;
  publishReady?: boolean;
  publishBlockers?: string[];
  publishGrandfathered?: boolean;
  photos?: { _id: string }[];
  status?:
    | "new"
    | "under_review"
    | "inspection_scheduled"
    | "under_inspection"
    | "awaiting_contract"
    | "approved"
    | "not_accepted"
    | "approved_for_publishing"
    | "published"
    | "reserved"
    | "booked"
    | "sold"
    | "withdrawn"
    | "expired";
};

function draftFromInitial(initial?: VehicleValues): VehicleDraft {
  const draft = emptyVehicleDraft();
  if (!initial) {
    return draft;
  }
  return {
    ...draft,
    stockCode: initial.stockCode ?? "",
    vin: initial.vin ?? "",
    make: initial.make,
    model: initial.model,
    year: initial.year,
    trim: initial.trim ?? "",
    priceOmr: initial.priceOmr,
    mileageKm: initial.mileageKm,
    fuel: initial.fuel,
    transmission: initial.transmission,
    drivetrain: initial.drivetrain,
    spec: initial.spec,
    condition: initial.condition,
    bodyType: initial.bodyType,
    exteriorColor: initial.exteriorColor,
    interiorColor: initial.interiorColor,
    engine: initial.engine ?? "",
    featuresText: initial.features.join(", "),
    titleAr: initial.titleAr,
    titleEn: initial.titleEn,
    descriptionAr: initial.descriptionAr,
    descriptionEn: initial.descriptionEn,
    ownership: initial.ownership,
    featured: initial.featured === true,
    ownerName: initial.ownerName ?? "",
    ownerPhone: initial.ownerPhone ?? "",
    ownerNotes: initial.ownerNotes ?? "",
    staffNotes: initial.staffNotes ?? "",
    publicHidden: initial.publicHidden === true,
    onSiteConfirmed: initial.onSiteConfirmed === true,
  };
}

function writePayload(draft: VehicleDraft) {
  return {
    stockCode: draft.stockCode.trim() || undefined,
    vin: draft.vin.trim() || undefined,
    make: draft.make.trim(),
    model: draft.model.trim(),
    year: draft.year,
    trim: draft.trim.trim() || undefined,
    priceOmr: draft.priceOmr,
    mileageKm: draft.mileageKm,
    fuel: draft.fuel,
    transmission: draft.transmission,
    drivetrain: draft.drivetrain,
    spec: draft.spec,
    condition: draft.condition,
    bodyType: draft.bodyType,
    exteriorColor: draft.exteriorColor,
    interiorColor: draft.interiorColor,
    engine: draft.engine.trim() || undefined,
    features: featuresFromText(draft.featuresText),
    titleAr: draft.titleAr,
    titleEn: draft.titleEn,
    descriptionAr: draft.descriptionAr,
    descriptionEn: draft.descriptionEn,
    ownership: draft.ownership,
    featured: draft.featured,
    ownerName: draft.ownerName.trim() || undefined,
    ownerPhone: draft.ownerPhone.trim() || undefined,
    ownerNotes: draft.ownerNotes.trim() || undefined,
    staffNotes: draft.staffNotes.trim() || undefined,
    publicHidden: draft.publicHidden,
    onSiteConfirmed: draft.onSiteConfirmed,
  };
}

export function VehicleForm({
  vehicleId,
  initial,
}: {
  vehicleId?: Id<"vehicles">;
  initial?: VehicleValues;
}) {
  const t = useTranslations("Admin");
  const tw = useTranslations("Admin.inventory.wizard");
  const router = useRouter();
  const searchParams = useSearchParams();
  const create = useMutation(api.vehicles.create);
  const update = useMutation(api.vehicles.update);
  const live = useQuery(api.vehicles.getStaff, vehicleId ? { vehicleId } : "skip");
  const [draft, setDraft] = useState(() => draftFromInitial(initial));
  const [step, setStep] = useState<WizardStep>(
    () =>
      parseWizardStep(searchParams.get("step")) ??
      (initial
        ? firstIncompleteStep(draftFromInitial(initial), initial.photos?.length ?? 0)
        : "identity"),
  );
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const photoCount = live?.photos.length ?? initial?.photos?.length ?? 0;
  const photosLocked = !vehicleId;
  const statusFilter = searchParams.get("status");

  useEffect(() => {
    if (!saved) {
      return;
    }
    const timer = window.setTimeout(() => setSaved(false), 2500);
    return () => window.clearTimeout(timer);
  }, [saved]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  function patch<K extends keyof VehicleDraft>(key: K, value: VehicleDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function syncStep(next: WizardStep, id: Id<"vehicles"> | undefined = vehicleId) {
    setStep(next);
    const params = new URLSearchParams(searchParams.toString());
    params.set("step", next);
    const path = id ? `/admin/inventory/${id}` : "/admin/inventory/new";
    const query = params.toString();
    router.replace(query ? `${path}?${query}` : path, { scroll: false });
  }

  async function persist(): Promise<Id<"vehicles"> | undefined> {
    if (!identityComplete(draft)) {
      setError(tw("identityRequired"));
      syncStep("identity");
      return undefined;
    }
    const write = writePayload(draft);
    if (vehicleId) {
      await update({ vehicleId, ...write });
      return vehicleId;
    }
    return await create(write);
  }

  async function persistAndGo(target: WizardStep | "stay" | "finish") {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const id = await persist();
      if (!id) {
        setSaving(false);
        return;
      }
      if (target === "finish") {
        router.push(staffInventoryPath(statusFilter));
        return;
      }
      const dest = target === "stay" ? step : target;
      setSaved(true);
      if (!vehicleId) {
        router.replace(staffVehiclePath(id, statusFilter, dest));
        return;
      }
      if (dest !== step) {
        syncStep(dest, id);
      }
    } catch (err) {
      setError(convexErrorMessage(err, t("inventory.saveFailed")));
    } finally {
      setSaving(false);
    }
  }

  async function saveStep(advance: boolean) {
    const dest = advance ? nextWizardStep(step) : undefined;
    await persistAndGo(dest ?? "stay");
  }

  async function selectStep(nextStep: WizardStep) {
    if (nextStep === step) {
      return;
    }
    if (vehicleId || nextStep === "photos") {
      await persistAndGo(nextStep);
      return;
    }
    syncStep(nextStep);
  }

  async function finish() {
    await persistAndGo("finish");
  }

  const previous = previousWizardStep(step);
  const next = nextWizardStep(step);

  return (
    <div className="space-y-6">
      <VehicleWizardProgress
        step={step}
        draft={draft}
        photoCount={photoCount}
        photosLocked={photosLocked}
        onSelect={(nextStep) => void selectStep(nextStep)}
      />

      {step !== "photos" ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void saveStep(Boolean(next));
          }}
          className="space-y-6"
        >
          <DeskCard>
            <h2 className="font-display text-xl">{t(`inventory.sections.${sectionKey(step)}`)}</h2>
            <div className="mt-5 grid min-w-0 gap-4 md:grid-cols-2">
              {step === "identity" ? <IdentityFields draft={draft} patch={patch} /> : null}
              {step === "specs" ? <SpecsFields draft={draft} patch={patch} /> : null}
              {step === "copy" ? <CopyFields draft={draft} patch={patch} /> : null}
              {step === "owner" ? <OwnerFields draft={draft} patch={patch} /> : null}
            </div>
          </DeskCard>
          <WizardFooter
            error={error}
            saved={saved}
            saving={saving}
            previous={previous}
            next={next}
            onBack={() => previous && void selectStep(previous)}
            onSave={() => void saveStep(false)}
          />
        </form>
      ) : (
        <div className="space-y-6">
          {vehicleId ? (
            <PhotoUploader vehicleId={vehicleId} />
          ) : (
            <DeskCard>
              <h2 className="font-display text-xl">{t("inventory.sections.photos")}</h2>
              <p className="mt-3 text-sm text-[var(--ivory-dim)]">{tw("photosLocked")}</p>
            </DeskCard>
          )}
          <WizardFooter
            error={error}
            saved={saved}
            saving={saving}
            previous={previous}
            next={undefined}
            finish
            onBack={() => previous && void selectStep(previous)}
            onSave={() => void finish()}
          />
          {vehicleId ? (
            <div className="space-y-6">
              <DeskCard>
                <h2 className="font-display text-xl">{t("consignments.approveForPublish")}</h2>
                <div className="mt-4">
                  <OwnerDeskActions
                    vehicle={{
                      _id: vehicleId,
                      status: initial?.status ?? "approved",
                      publishReady: initial?.publishReady ?? false,
                      publishBlockers: initial?.publishBlockers ?? [],
                      publishGrandfathered: initial?.publishGrandfathered,
                      onSiteConfirmed: draft.onSiteConfirmed,
                      contractEndsAt: initial?.contractEndsAt,
                      staffNotes: draft.staffNotes,
                    }}
                    showNotes={false}
                    showEditLink={false}
                  />
                </div>
              </DeskCard>
              <ContractDesk
                vehicleId={vehicleId}
                contractStatus={initial?.contractStatus}
                contractStartsAt={initial?.contractStartsAt}
                contractEndsAt={initial?.contractEndsAt}
                contractUrl={initial?.contractUrl}
                contractFileName={initial?.contractFileName}
              />
              <InspectionForm vehicleId={vehicleId} />
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

function sectionKey(step: WizardStep): "identity" | "specs" | "copy" | "owner" | "photos" {
  return step;
}

function WizardFooter({
  error,
  saved,
  saving,
  previous,
  next,
  finish,
  onBack,
  onSave,
}: {
  error: string;
  saved: boolean;
  saving: boolean;
  previous?: WizardStep;
  next?: WizardStep;
  finish?: boolean;
  onBack: () => void;
  onSave: () => void;
}) {
  const t = useTranslations("Admin.inventory");
  const tw = useTranslations("Admin.inventory.wizard");
  return (
    <div className="space-y-3">
      {error ? (
        <p className="text-sm text-[#f2c4c6]" role="alert">
          {error}
        </p>
      ) : null}
      {saved && !error ? (
        <p className="text-sm text-[var(--sand)]" role="status">
          {tw("saved")}
        </p>
      ) : null}
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-between">
        <AdminButton type="button" variant="ghost" disabled={!previous || saving} onClick={onBack}>
          {tw("back")}
        </AdminButton>
        <div className="flex flex-col gap-2 sm:flex-row">
          {finish ? null : (
            <AdminButton type="button" disabled={saving} onClick={onSave}>
              {tw("save")}
            </AdminButton>
          )}
          <AdminButton
            type={finish ? "button" : "submit"}
            variant="primary"
            disabled={saving}
            onClick={finish ? onSave : undefined}
          >
            {finish ? tw("done") : next ? tw("saveContinue") : t("save")}
          </AdminButton>
        </div>
      </div>
    </div>
  );
}

function IdentityFields({
  draft,
  patch,
}: {
  draft: VehicleDraft;
  patch: <K extends keyof VehicleDraft>(key: K, value: VehicleDraft[K]) => void;
}) {
  const t = useTranslations("Admin");
  return (
    <>
      <AdminField
        name="stockCode"
        label={t("fields.stockCode")}
        value={draft.stockCode}
        onChange={(value) => patch("stockCode", value)}
      />
      <AdminField
        name="vin"
        label={t("fields.vin")}
        value={draft.vin}
        onChange={(value) => patch("vin", value)}
        spellCheck={false}
      />
      <AdminField
        name="make"
        label={t("fields.make")}
        value={draft.make}
        onChange={(value) => patch("make", value)}
        required
      />
      <AdminField
        name="model"
        label={t("fields.model")}
        value={draft.model}
        onChange={(value) => patch("model", value)}
        required
      />
      <AdminField
        name="year"
        label={t("fields.year")}
        type="number"
        inputMode="numeric"
        value={String(draft.year || "")}
        onChange={(value) => patch("year", Number(value) || 0)}
        required
      />
      <AdminField
        name="trim"
        label={t("fields.trim")}
        value={draft.trim}
        onChange={(value) => patch("trim", value)}
      />
      <AdminSelect
        name="ownership"
        label={t("fields.ownership")}
        value={draft.ownership}
        onChange={(value) => patch("ownership", value as VehicleDraft["ownership"])}
        options={["dealership", "consignment"]}
        formatLabel={(value) => t(`options.ownership.${value}`)}
      />
      <label className="flex min-h-11 items-center gap-3 text-sm md:mt-7">
        <input
          type="checkbox"
          name="featured"
          checked={draft.featured}
          onChange={(event) => patch("featured", event.target.checked)}
          className="size-4 accent-[var(--sand)]"
        />
        {t("inventory.featured")}
      </label>
      <label className="flex min-h-11 items-center gap-3 text-sm">
        <input
          type="checkbox"
          name="onSiteConfirmed"
          checked={draft.onSiteConfirmed}
          onChange={(event) => patch("onSiteConfirmed", event.target.checked)}
          className="size-4 accent-[var(--sand)]"
        />
        {t("inventory.onSite")}
      </label>
      <label className="flex min-h-11 items-center gap-3 text-sm">
        <input
          type="checkbox"
          name="publicHidden"
          checked={draft.publicHidden}
          onChange={(event) => patch("publicHidden", event.target.checked)}
          className="size-4 accent-[var(--sand)]"
        />
        {t("inventory.publicHidden")}
      </label>
    </>
  );
}

function SpecsFields({
  draft,
  patch,
}: {
  draft: VehicleDraft;
  patch: <K extends keyof VehicleDraft>(key: K, value: VehicleDraft[K]) => void;
}) {
  const t = useTranslations("Admin");
  return (
    <>
      <AdminField
        name="priceOmr"
        label={t("fields.priceOmr")}
        type="number"
        inputMode="numeric"
        value={String(draft.priceOmr || "")}
        onChange={(value) => patch("priceOmr", Number(value) || 0)}
        required
      />
      <AdminField
        name="mileageKm"
        label={t("fields.mileageKm")}
        type="number"
        inputMode="numeric"
        value={String(draft.mileageKm)}
        onChange={(value) => patch("mileageKm", Number(value) || 0)}
        required
      />
      <AdminSelect
        name="fuel"
        label={t("fields.fuel")}
        value={draft.fuel}
        onChange={(value) => patch("fuel", value as VehicleDraft["fuel"])}
        options={["petrol", "diesel", "hybrid", "plugin_hybrid", "electric"]}
        formatLabel={(value) => t(`options.fuel.${value}`)}
      />
      <AdminSelect
        name="transmission"
        label={t("fields.transmission")}
        value={draft.transmission}
        onChange={(value) => patch("transmission", value as VehicleDraft["transmission"])}
        options={["automatic", "manual"]}
        formatLabel={(value) => t(`options.transmission.${value}`)}
      />
      <AdminSelect
        name="drivetrain"
        label={t("fields.drivetrain")}
        value={draft.drivetrain}
        onChange={(value) => patch("drivetrain", value as VehicleDraft["drivetrain"])}
        options={["awd", "4wd", "rwd", "fwd"]}
        formatLabel={(value) => t(`options.drivetrain.${value}`)}
      />
      <AdminSelect
        name="spec"
        label={t("fields.spec")}
        value={draft.spec}
        onChange={(value) => patch("spec", value as VehicleDraft["spec"])}
        options={["gcc", "american", "other"]}
        formatLabel={(value) => t(`options.spec.${value}`)}
      />
      <AdminSelect
        name="condition"
        label={t("fields.condition")}
        value={draft.condition}
        onChange={(value) => patch("condition", value as VehicleDraft["condition"])}
        options={["new", "used"]}
        formatLabel={(value) => t(`options.condition.${value}`)}
      />
      <AdminSelect
        name="bodyType"
        label={t("fields.bodyType")}
        value={draft.bodyType}
        onChange={(value) => patch("bodyType", value as VehicleDraft["bodyType"])}
        options={["suv", "sedan", "coupe", "convertible", "hatchback", "wagon", "pickup", "van"]}
        formatLabel={(value) => t(`options.bodyType.${value}`)}
      />
      <AdminField
        name="exteriorColor"
        label={t("fields.exteriorColor")}
        value={draft.exteriorColor}
        onChange={(value) => patch("exteriorColor", value)}
      />
      <AdminField
        name="interiorColor"
        label={t("fields.interiorColor")}
        value={draft.interiorColor}
        onChange={(value) => patch("interiorColor", value)}
      />
      <AdminField
        name="engine"
        label={t("fields.engine")}
        value={draft.engine}
        onChange={(value) => patch("engine", value)}
      />
      <AdminField
        name="features"
        label={t("fields.features")}
        value={draft.featuresText}
        onChange={(value) => patch("featuresText", value)}
      />
    </>
  );
}

function CopyFields({
  draft,
  patch,
}: {
  draft: VehicleDraft;
  patch: <K extends keyof VehicleDraft>(key: K, value: VehicleDraft[K]) => void;
}) {
  const t = useTranslations("Admin");
  return (
    <>
      <AdminField
        name="titleAr"
        label={t("fields.titleAr")}
        value={draft.titleAr}
        onChange={(value) => patch("titleAr", value)}
        className="md:col-span-2"
        dir="rtl"
      />
      <AdminField
        name="titleEn"
        label={t("fields.titleEn")}
        value={draft.titleEn}
        onChange={(value) => patch("titleEn", value)}
        className="md:col-span-2"
        dir="ltr"
      />
      <AdminTextarea
        name="descriptionAr"
        label={t("fields.descriptionAr")}
        value={draft.descriptionAr}
        onChange={(value) => patch("descriptionAr", value)}
        dir="rtl"
      />
      <AdminTextarea
        name="descriptionEn"
        label={t("fields.descriptionEn")}
        value={draft.descriptionEn}
        onChange={(value) => patch("descriptionEn", value)}
        dir="ltr"
      />
    </>
  );
}

function OwnerFields({
  draft,
  patch,
}: {
  draft: VehicleDraft;
  patch: <K extends keyof VehicleDraft>(key: K, value: VehicleDraft[K]) => void;
}) {
  const t = useTranslations("Admin");
  return (
    <>
      <AdminField
        name="ownerName"
        label={t("fields.ownerName")}
        value={draft.ownerName}
        onChange={(value) => patch("ownerName", value)}
        autoComplete="name"
      />
      <AdminField
        name="ownerPhone"
        label={t("fields.ownerPhone")}
        value={draft.ownerPhone}
        onChange={(value) => patch("ownerPhone", value)}
        inputMode="tel"
        autoComplete="tel"
      />
      <AdminTextarea
        name="ownerNotes"
        label={t("fields.ownerNotes")}
        value={draft.ownerNotes}
        onChange={(value) => patch("ownerNotes", value)}
      />
      <AdminTextarea
        name="staffNotes"
        label={t("fields.staffNotes")}
        value={draft.staffNotes}
        onChange={(value) => patch("staffNotes", value)}
      />
    </>
  );
}
