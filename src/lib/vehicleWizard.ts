export const WIZARD_STEPS = ["identity", "specs", "copy", "owner", "photos"] as const;

export type WizardStep = (typeof WIZARD_STEPS)[number];

export type VehicleDraft = {
  stockCode: string;
  vin: string;
  make: string;
  model: string;
  year: number;
  trim: string;
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
  engine: string;
  featuresText: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  ownership: "dealership" | "consignment";
  featured: boolean;
  ownerName: string;
  ownerPhone: string;
  ownerNotes: string;
  staffNotes: string;
  publicHidden: boolean;
  onSiteConfirmed: boolean;
};

export const emptyVehicleDraft = (): VehicleDraft => ({
  stockCode: "",
  vin: "",
  make: "",
  model: "",
  year: 2020,
  trim: "",
  priceOmr: 0,
  mileageKm: 0,
  fuel: "petrol",
  transmission: "automatic",
  drivetrain: "awd",
  spec: "gcc",
  condition: "used",
  bodyType: "suv",
  exteriorColor: "",
  interiorColor: "",
  engine: "",
  featuresText: "",
  titleAr: "",
  titleEn: "",
  descriptionAr: "",
  descriptionEn: "",
  ownership: "dealership",
  featured: false,
  ownerName: "",
  ownerPhone: "",
  ownerNotes: "",
  staffNotes: "",
  publicHidden: false,
  onSiteConfirmed: false,
});

export function parseWizardStep(value: string | null): WizardStep | undefined {
  return WIZARD_STEPS.find((step) => step === value);
}

export function wizardStepIndex(step: WizardStep): number {
  return WIZARD_STEPS.indexOf(step);
}

export function nextWizardStep(step: WizardStep): WizardStep | undefined {
  return WIZARD_STEPS[wizardStepIndex(step) + 1];
}

export function previousWizardStep(step: WizardStep): WizardStep | undefined {
  return WIZARD_STEPS[wizardStepIndex(step) - 1];
}

function filled(value: string): boolean {
  return value.trim().length > 0;
}

export function identityComplete(draft: VehicleDraft): boolean {
  return filled(draft.make) && filled(draft.model) && draft.year >= 1980 && draft.year <= 2100;
}

export function specsComplete(draft: VehicleDraft): boolean {
  return (
    Number.isFinite(draft.priceOmr) &&
    draft.priceOmr > 0 &&
    Number.isFinite(draft.mileageKm) &&
    draft.mileageKm >= 0 &&
    filled(draft.exteriorColor) &&
    filled(draft.interiorColor)
  );
}

export function copyComplete(draft: VehicleDraft): boolean {
  return filled(draft.titleAr) && filled(draft.titleEn);
}

export function ownerComplete(draft: VehicleDraft): boolean {
  if (draft.ownership !== "consignment") {
    return true;
  }
  return filled(draft.ownerName) && filled(draft.ownerPhone);
}

export function photosComplete(photoCount: number): boolean {
  return photoCount > 0;
}

export function stepComplete(
  step: WizardStep,
  draft: VehicleDraft,
  photoCount: number,
): boolean {
  switch (step) {
    case "identity":
      return identityComplete(draft);
    case "specs":
      return specsComplete(draft);
    case "copy":
      return copyComplete(draft);
    case "owner":
      return ownerComplete(draft);
    case "photos":
      return photosComplete(photoCount);
  }
}

export function firstIncompleteStep(
  draft: VehicleDraft,
  photoCount: number,
): WizardStep {
  return WIZARD_STEPS.find((step) => !stepComplete(step, draft, photoCount)) ?? "photos";
}

export function incompleteStepCount(draft: VehicleDraft, photoCount: number): number {
  return WIZARD_STEPS.filter((step) => !stepComplete(step, draft, photoCount)).length;
}

export function featuresFromText(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
