export type ImportFuel = "petrol" | "diesel" | "hybrid" | "plugin_hybrid" | "electric";
export type ImportTransmission = "automatic" | "manual";
export type ImportSpec = "gcc" | "american" | "other";
export type ImportDrivetrain = "awd" | "4wd" | "rwd" | "fwd";
export type ImportCondition = "new" | "used";
export type ImportBodyType =
  | "suv"
  | "sedan"
  | "coupe"
  | "convertible"
  | "hatchback"
  | "wagon"
  | "pickup"
  | "van";
export type ImportStatus =
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
export type ImportOwnership = "dealership" | "consignment";

export type ImportVehicleRow = {
  stockCode?: string;
  vin?: string;
  make: string;
  model: string;
  year: number;
  trim?: string;
  priceOmr: number;
  mileageKm: number;
  fuel?: ImportFuel;
  transmission?: ImportTransmission;
  drivetrain?: ImportDrivetrain;
  spec?: ImportSpec;
  condition?: ImportCondition;
  bodyType?: ImportBodyType;
  exteriorColor?: string;
  interiorColor?: string;
  engine?: string;
  features?: string[];
  titleAr?: string;
  titleEn?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  ownership?: ImportOwnership;
  status?: ImportStatus;
  staffNotes?: string;
};

export type InventorySheetFormat = "showroom" | "full";

export type ParseInventoryResult = {
  format: InventorySheetFormat;
  rows: ImportVehicleRow[];
  skippedEmpty: number;
  errors: string[];
};

export const SHOWROOM_HEADERS = [
  "NO",
  "CAR TYPE",
  "COLOR",
  "Seats",
  "Model",
  "KM",
  "Price",
  "Notes",
] as const;

export const SHOWROOM_TEMPLATE_ROWS: Array<Record<string, string | number>> = [
  {
    NO: 1,
    "CAR TYPE": "HYUNDAI SANTAFE",
    COLOR: "WHITE",
    Seats: "7-seater",
    Model: 2018,
    KM: "150.000 KM",
    Price: 5250,
    Notes: "",
  },
  {
    NO: 2,
    "CAR TYPE": "DONGFENG SHINE E2",
    COLOR: "GREY",
    Seats: "5-seater",
    Model: 2026,
    KM: "BRAND NEW",
    Price: 5200,
    Notes: "",
  },
  {
    NO: 3,
    "CAR TYPE": "AUDI RS5",
    COLOR: "GREY",
    Seats: "5-seater",
    Model: 2019,
    KM: "73.000 KM",
    Price: 16800,
    Notes: "BOOKED",
  },
];

export const SHOWROOM_INSTRUCTIONS = [
  { Column: "NO", Meaning: "Stock number. 7 becomes AR-0007. Re-import updates the same car." },
  { Column: "CAR TYPE", Meaning: "Make and model together, e.g. HYUNDAI SANTAFE or VW JETTA." },
  { Column: "COLOR", Meaning: "Exterior colour." },
  { Column: "Seats", Meaning: "5-seater, 7-seater, or BUS." },
  { Column: "Model", Meaning: "Year (2018), not the model name." },
  { Column: "KM", Meaning: "150.000 KM, 46585 KM, or BRAND NEW." },
  { Column: "Price", Meaning: "Price in OMR." },
  { Column: "Notes", Meaning: "BOOKED or RESERVED keeps the car on the floor. SOLD marks it sold. HIDDEN withdraws it. Leave blank to publish." },
];

const MAKE_ALIASES: Array<{ match: string; canonical: string }> = [
  { match: "MERCEDES BENZ", canonical: "Mercedes-Benz" },
  { match: "MERCEDES-BENZ", canonical: "Mercedes-Benz" },
  { match: "ROLLS ROYCE", canonical: "Rolls-Royce" },
  { match: "ROLLS-ROYCE", canonical: "Rolls-Royce" },
  { match: "ASTON MARTIN", canonical: "Aston Martin" },
  { match: "ALFA ROMEO", canonical: "Alfa Romeo" },
  { match: "LAND ROVER", canonical: "Land Rover" },
  { match: "RANGE ROVER", canonical: "Land Rover" },
  { match: "GREAT WALL", canonical: "Great Wall" },
  { match: "VOLKSWAGEN", canonical: "Volkswagen" },
  { match: "CHEVROLET", canonical: "Chevrolet" },
  { match: "MITSUBISHI", canonical: "Mitsubishi" },
  { match: "MERCEDES", canonical: "Mercedes-Benz" },
  { match: "INFINITI", canonical: "Infiniti" },
  { match: "CADILLAC", canonical: "Cadillac" },
  { match: "CHRYSLER", canonical: "Chrysler" },
  { match: "MASERATI", canonical: "Maserati" },
  { match: "BENTLEY", canonical: "Bentley" },
  { match: "FERRARI", canonical: "Ferrari" },
  { match: "LAMBORGHINI", canonical: "Lamborghini" },
  { match: "PORSCHE", canonical: "Porsche" },
  { match: "HYUNDAI", canonical: "Hyundai" },
  { match: "DONGFENG", canonical: "Dongfeng" },
  { match: "GENESIS", canonical: "Genesis" },
  { match: "TOYOTA", canonical: "Toyota" },
  { match: "NISSAN", canonical: "Nissan" },
  { match: "SUZUKI", canonical: "Suzuki" },
  { match: "SUBARU", canonical: "Subaru" },
  { match: "JAGUAR", canonical: "Jaguar" },
  { match: "CITROEN", canonical: "Citroen" },
  { match: "CITROËN", canonical: "Citroen" },
  { match: "PEUGEOT", canonical: "Peugeot" },
  { match: "RENAULT", canonical: "Renault" },
  { match: "CHANGAN", canonical: "Changan" },
  { match: "HAVAL", canonical: "Haval" },
  { match: "GAC", canonical: "GAC" },
  { match: "GEELY", canonical: "Geely" },
  { match: "CHERY", canonical: "Chery" },
  { match: "TESLA", canonical: "Tesla" },
  { match: "LEXUS", canonical: "Lexus" },
  { match: "HONDA", canonical: "Honda" },
  { match: "MAZDA", canonical: "Mazda" },
  { match: "VOLVO", canonical: "Volvo" },
  { match: "SKODA", canonical: "Skoda" },
  { match: "ŠKODA", canonical: "Skoda" },
  { match: "AUDI", canonical: "Audi" },
  { match: "BMW", canonical: "BMW" },
  { match: "MINI", canonical: "MINI" },
  { match: "JEEP", canonical: "Jeep" },
  { match: "FORD", canonical: "Ford" },
  { match: "DODGE", canonical: "Dodge" },
  { match: "RAM", canonical: "Ram" },
  { match: "GMC", canonical: "GMC" },
  { match: "KIA", canonical: "Kia" },
  { match: "MG", canonical: "MG" },
  { match: "VW", canonical: "Volkswagen" },
];

const SUV_MODELS = [
  "santafe",
  "santa fe",
  "tucson",
  "teramont",
  "atlas",
  "rav4",
  "kicks",
  "trax",
  "cherokee",
  "cayenne",
  "vitara",
  "mage",
  "sportage",
  "sorento",
  "cx-5",
  "cx5",
  "x5",
  "x3",
  "q5",
  "q7",
  "land cruiser",
  "prado",
  "patrol",
  "pajero",
  "fortuner",
  "highlander",
];

const SEDAN_MODELS = [
  "jetta",
  "sunny",
  "accent",
  "cerato",
  "passat",
  "c300",
  "c 300",
  "avalon",
  "dzire",
  "shine",
  "camry",
  "corolla",
  "accord",
  "altima",
  "sonata",
  "elantra",
  "civic",
];

const COUPE_MODELS = ["rs5", "veloster", "mustang", "supra", "911", "cayman"];

type CanonicalField =
  | "no"
  | "stockCode"
  | "vin"
  | "carType"
  | "make"
  | "model"
  | "year"
  | "trim"
  | "exteriorColor"
  | "interiorColor"
  | "seats"
  | "km"
  | "mileageKm"
  | "priceOmr"
  | "fuel"
  | "transmission"
  | "drivetrain"
  | "spec"
  | "condition"
  | "bodyType"
  | "engine"
  | "features"
  | "titleAr"
  | "titleEn"
  | "descriptionAr"
  | "descriptionEn"
  | "ownership"
  | "status"
  | "staffNotes"
  | "notes";

const HEADER_ALIASES: Record<string, CanonicalField> = {
  no: "no",
  number: "no",
  stock: "stockCode",
  stockcode: "stockCode",
  stockno: "stockCode",
  vin: "vin",
  cartype: "carType",
  vehicle: "carType",
  name: "carType",
  make: "make",
  model: "model",
  year: "year",
  trim: "trim",
  color: "exteriorColor",
  colour: "exteriorColor",
  exteriorcolor: "exteriorColor",
  exteriorcolour: "exteriorColor",
  interiorcolor: "interiorColor",
  interiorcolour: "interiorColor",
  seats: "seats",
  km: "km",
  mileage: "mileageKm",
  mileagekm: "mileageKm",
  price: "priceOmr",
  priceomr: "priceOmr",
  fuel: "fuel",
  transmission: "transmission",
  drivetrain: "drivetrain",
  spec: "spec",
  condition: "condition",
  bodytype: "bodyType",
  engine: "engine",
  features: "features",
  titlear: "titleAr",
  titleen: "titleEn",
  descriptionar: "descriptionAr",
  descriptionen: "descriptionEn",
  ownership: "ownership",
  status: "status",
  staffnotes: "staffNotes",
  notes: "notes",
  remark: "notes",
  remarks: "notes",
};

export function parseInventorySheet(rawRows: Record<string, unknown>[]): ParseInventoryResult {
  const errors: string[] = [];
  const rows: ImportVehicleRow[] = [];
  let skippedEmpty = 0;
  const format = detectFormat(rawRows);

  rawRows.forEach((raw, index) => {
    const mapped = mapRow(raw);
    if (isEmptyRow(mapped, format)) {
      skippedEmpty += 1;
      return;
    }

    const parsed = format === "showroom" ? parseShowroomRow(mapped) : parseFullRow(mapped);
    if ("error" in parsed) {
      errors.push(`Row ${index + 2}: ${parsed.error}`);
      return;
    }
    rows.push(parsed.row);
  });

  return { format, rows, skippedEmpty, errors };
}

export function detectFormat(rawRows: Record<string, unknown>[]): InventorySheetFormat {
  const keys = new Set<CanonicalField>();
  for (const raw of rawRows.slice(0, 5)) {
    for (const key of Object.keys(raw)) {
      const field = canonicalField(key);
      if (field) {
        keys.add(field);
      }
    }
  }
  if (keys.has("carType") || (keys.has("km") && keys.has("seats") && !keys.has("make"))) {
    return "showroom";
  }
  return "full";
}

function mapRow(raw: Record<string, unknown>): Partial<Record<CanonicalField, unknown>> {
  const mapped: Partial<Record<CanonicalField, unknown>> = {};
  const leftovers: string[] = [];

  for (const [key, value] of Object.entries(raw)) {
    const field = canonicalField(key);
    if (field) {
      if (mapped[field] === undefined || mapped[field] === "") {
        mapped[field] = value;
      }
      continue;
    }
    const text = cellText(value);
    if (text) {
      leftovers.push(text);
    }
  }

  if (!mapped.notes && leftovers.length > 0) {
    mapped.notes = leftovers.join(" ");
  }

  return mapped;
}

function canonicalField(key: string): CanonicalField | undefined {
  const normalized = normalizeKey(key);
  if (!normalized || normalized.startsWith("empty")) {
    return undefined;
  }
  return HEADER_ALIASES[normalized];
}

function isEmptyRow(
  mapped: Partial<Record<CanonicalField, unknown>>,
  format: InventorySheetFormat,
): boolean {
  if (format === "showroom") {
    return !cellText(mapped.carType) && !cellText(mapped.make);
  }
  return !cellText(mapped.make) && !cellText(mapped.model) && !cellText(mapped.carType);
}

function parseShowroomRow(
  mapped: Partial<Record<CanonicalField, unknown>>,
): { row: ImportVehicleRow } | { error: string } {
  const carType = cellText(mapped.carType) || [cellText(mapped.make), cellText(mapped.model)].filter(Boolean).join(" ");
  if (!carType) {
    return { error: "Missing CAR TYPE" };
  }

  const parsedName = parseCarType(carType);
  const year = parseYear(mapped.year ?? mapped.model);
  if (year === undefined) {
    return { error: `Missing or invalid year in Model column (${cellText(mapped.model) || "empty"})` };
  }

  const priceOmr = parsePrice(mapped.priceOmr);
  if (priceOmr === undefined) {
    return { error: `Missing or invalid Price (${cellText(mapped.priceOmr) || "empty"})` };
  }

  const mileage = parseMileage(mapped.km ?? mapped.mileageKm);
  const seats = cellText(mapped.seats);
  const notes = parseNotes(mapped.notes ?? mapped.status ?? mapped.staffNotes);
  const color = titleCaseWords(cellText(mapped.exteriorColor));
  const bodyType = inferBodyType(carType, seats, parsedName.model);
  const stockCode = stockFromNo(mapped.stockCode ?? mapped.no);

  const features = [seats ? normalizeSeats(seats) : undefined].filter(
    (value): value is string => Boolean(value),
  );

  return {
    row: {
      stockCode,
      make: parsedName.make,
      model: parsedName.model,
      year,
      trim: parsedName.trim,
      priceOmr,
      mileageKm: mileage.km,
      condition: mileage.condition,
      exteriorColor: color,
      bodyType,
      drivetrain: bodyType === "sedan" || bodyType === "hatchback" || bodyType === "coupe" ? "fwd" : "awd",
      features,
      titleEn: [String(year), parsedName.make, parsedName.model, parsedName.trim].filter(Boolean).join(" "),
      ownership: "dealership",
      status: notes.status ?? "published",
      staffNotes: notes.staffNotes,
    },
  };
}

function parseFullRow(
  mapped: Partial<Record<CanonicalField, unknown>>,
): { row: ImportVehicleRow } | { error: string } {
  const make = cellText(mapped.make);
  const model = cellText(mapped.model);
  const year = parseYear(mapped.year);
  const priceOmr = parsePrice(mapped.priceOmr);
  const mileage = parseMileage(mapped.mileageKm ?? mapped.km);

  if (!make || !model) {
    return { error: "Make and model are required" };
  }
  if (year === undefined) {
    return { error: "Year is required" };
  }
  if (priceOmr === undefined) {
    return { error: "Price is required" };
  }

  const notes = parseNotes(mapped.notes ?? mapped.status ?? mapped.staffNotes);
  const fuel = parseEnum(mapped.fuel, ["petrol", "diesel", "hybrid", "plugin_hybrid", "electric"] as const);
  const transmission = parseEnum(mapped.transmission, ["automatic", "manual"] as const);
  const spec = parseEnum(mapped.spec, ["gcc", "american", "other"] as const);
  const drivetrain = parseEnum(mapped.drivetrain, ["awd", "4wd", "rwd", "fwd"] as const);
  const condition =
    parseEnum(mapped.condition, ["new", "used"] as const) ?? mileage.condition;
  const bodyType = parseEnum(mapped.bodyType, [
    "suv",
    "sedan",
    "coupe",
    "convertible",
    "hatchback",
    "wagon",
    "pickup",
    "van",
  ] as const);
  const ownership = parseEnum(mapped.ownership, ["dealership", "consignment"] as const);
  const status =
    parseEnum(mapped.status, [
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
      "pending_review",
      "draft",
      "hidden",
      "rejected",
    ] as const) ?? notes.status;
  const mappedStatus = status ? mapImportedStatus(status) : undefined;

  const featuresText = cellText(mapped.features);
  const features = featuresText
    ? featuresText.split(/[|,]/).map((part) => part.trim()).filter(Boolean)
    : undefined;

  return {
    row: {
      stockCode: cellText(mapped.stockCode) || stockFromNo(mapped.no),
      vin: cellText(mapped.vin),
      make,
      model,
      year,
      trim: cellText(mapped.trim),
      priceOmr,
      mileageKm: mileage.km,
      fuel,
      transmission,
      drivetrain,
      spec,
      condition,
      bodyType,
      exteriorColor: cellText(mapped.exteriorColor),
      interiorColor: cellText(mapped.interiorColor),
      engine: cellText(mapped.engine),
      features,
      titleAr: cellText(mapped.titleAr),
      titleEn: cellText(mapped.titleEn),
      descriptionAr: cellText(mapped.descriptionAr),
      descriptionEn: cellText(mapped.descriptionEn),
      ownership,
      status: mappedStatus,
      staffNotes: cellText(mapped.staffNotes) || notes.staffNotes,
    },
  };
}

export function parseCarType(carType: string): { make: string; model: string; trim?: string } {
  const cleaned = carType.replace(/\s+/g, " ").trim();
  const upper = cleaned.toUpperCase();

  for (const alias of MAKE_ALIASES) {
    if (upper === alias.match || upper.startsWith(`${alias.match} `)) {
      const rest = cleaned.slice(alias.match.length).trim();
      return splitModelTrim(alias.canonical, rest);
    }
  }

  const [first = cleaned, ...rest] = cleaned.split(" ");
  return splitModelTrim(titleCaseWords(first), rest.join(" "));
}

function splitModelTrim(make: string, rest: string): { make: string; model: string; trim?: string } {
  const remaining = rest.replace(/\s+(19|20)\d{2}$/, "").trim();
  const upper = remaining.toUpperCase();
  const trimMarkers = [" FULL OPTION", " FULL OPT"];
  for (const marker of trimMarkers) {
    const index = upper.indexOf(marker);
    if (index > 0) {
      return {
        make,
        model: titleCaseModel(remaining.slice(0, index)),
        trim: titleCaseWords(remaining.slice(index).trim()),
      };
    }
  }

  return {
    make,
    model: titleCaseModel(remaining) || make,
  };
}

function stockFromNo(value: unknown): string | undefined {
  const raw = cellText(value);
  if (!raw) {
    return undefined;
  }
  if (/^AR-/i.test(raw)) {
    return raw.toUpperCase();
  }
  const numeric = Number(raw);
  if (Number.isFinite(numeric) && numeric > 0) {
    return `AR-${String(Math.trunc(numeric)).padStart(4, "0")}`;
  }
  return raw;
}

function parseYear(value: unknown): number | undefined {
  const raw = cellText(value);
  if (!raw) {
    return undefined;
  }
  const match = raw.match(/(19|20)\d{2}/);
  if (!match) {
    return undefined;
  }
  const year = Number(match[0]);
  if (year < 1980 || year > 2035) {
    return undefined;
  }
  return year;
}

function parsePrice(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  const raw = cellText(value).replace(/omr|ر\.ع\.?/gi, "").trim();
  if (!raw) {
    return undefined;
  }
  const european = raw.match(/^(\d{1,3}(?:\.\d{3})+)(?:[.,]\d+)?$/);
  if (european?.[1]) {
    return Number(european[1].replace(/\./g, ""));
  }
  const cleaned = Number(raw.replace(/,/g, ""));
  return Number.isFinite(cleaned) ? cleaned : undefined;
}

function parseMileage(value: unknown): { km: number; condition?: ImportCondition } {
  if (typeof value === "number" && Number.isFinite(value)) {
    return { km: Math.max(0, Math.round(value)), condition: value === 0 ? "new" : "used" };
  }
  const raw = cellText(value);
  if (!raw) {
    return { km: 0 };
  }
  if (/brand\s*new|^new$|zero/i.test(raw) && !/\d/.test(raw.replace(/20\d{2}/, ""))) {
    return { km: 0, condition: "new" };
  }
  const numericPart = raw.replace(/km/gi, "").trim();
  const european = numericPart.match(/^(\d{1,3}(?:\.\d{3})+)$/);
  if (european?.[1]) {
    return { km: Number(european[1].replace(/\./g, "")), condition: "used" };
  }
  const american = numericPart.match(/^(\d{1,3}(?:,\d{3})+)$/);
  if (american?.[1]) {
    return { km: Number(american[1].replace(/,/g, "")), condition: "used" };
  }
  const plain = Number(numericPart.replace(/[^\d.]/g, ""));
  if (!Number.isFinite(plain)) {
    return { km: 0 };
  }
  return { km: Math.round(plain), condition: plain === 0 ? "new" : "used" };
}

function parseNotes(value: unknown): { status?: ImportStatus; staffNotes?: string } {
  const raw = cellText(value);
  if (!raw) {
    return {};
  }
  const upper = raw.toUpperCase();
  if (upper === "BOOKED") {
    return { status: "booked", staffNotes: raw };
  }
  if (upper === "RESERVED") {
    return { status: "reserved", staffNotes: raw };
  }
  if (upper === "SOLD") {
    return { status: "sold", staffNotes: raw };
  }
  if (upper === "HIDDEN" || upper === "WITHDRAWN") {
    return { status: "withdrawn", staffNotes: raw };
  }
  return { staffNotes: raw };
}

function mapImportedStatus(status: string): ImportStatus {
  switch (status) {
    case "pending_review":
      return "under_review";
    case "draft":
      return "approved";
    case "rejected":
      return "not_accepted";
    case "hidden":
      return "withdrawn";
    default:
      return status as ImportStatus;
  }
}

function inferBodyType(carType: string, seats: string, model: string): ImportBodyType {
  const haystack = `${carType} ${model} ${seats}`.toLowerCase();
  if (haystack.includes("bus") || haystack.includes("van")) {
    return "van";
  }
  if (haystack.includes("pick")) {
    return "pickup";
  }
  if (haystack.includes("hatch")) {
    return "hatchback";
  }
  if (COUPE_MODELS.some((item) => haystack.includes(item))) {
    return "coupe";
  }
  if (seats.toLowerCase().includes("7")) {
    return "suv";
  }
  if (SUV_MODELS.some((item) => haystack.includes(item))) {
    return "suv";
  }
  if (SEDAN_MODELS.some((item) => haystack.includes(item))) {
    return "sedan";
  }
  return "suv";
}

function normalizeSeats(seats: string): string {
  const lower = seats.trim().toLowerCase();
  if (lower === "bus") {
    return "BUS";
  }
  const match = lower.match(/(\d+)\s*-?\s*seat/);
  if (match?.[1]) {
    return `${match[1]}-seater`;
  }
  return seats.trim();
}

function parseEnum<T extends string>(value: unknown, allowed: readonly T[]): T | undefined {
  const raw = cellText(value).toLowerCase().replace(/[\s-]+/g, "_");
  if (!raw) {
    return undefined;
  }
  return allowed.find((item) => item === raw);
}

function cellText(value: unknown): string {
  if (value === undefined || value === null) {
    return "";
  }
  return String(value).replace(/\uFEFF/g, "").trim();
}

function normalizeKey(key: string): string {
  return key.replace(/\uFEFF/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function titleCaseWords(value: string): string {
  if (!value) {
    return "";
  }
  return value
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((word) => {
      if (/^[A-Z0-9]{1,6}$/i.test(word) && /\d/.test(word)) {
        return word.toUpperCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

function titleCaseModel(value: string): string {
  return titleCaseWords(value).replace(/\bRs(\d)/i, "RS$1");
}

export function toShowroomExportRow(vehicle: {
  stockCode: string;
  make: string;
  model: string;
  year: number;
  trim: string;
  priceOmr: number;
  mileageKm: number;
  condition: ImportCondition;
  bodyType: ImportBodyType;
  exteriorColor: string;
  features: string;
  status: ImportStatus;
  staffNotes?: string;
}): Record<string, string | number> {
  const numeric = vehicle.stockCode.replace(/^AR-/i, "").replace(/^0+(?=\d)/, "");
  const seatsFromFeatures = vehicle.features
    .split("|")
    .map((part) => part.trim())
    .find((part) => /seater|bus/i.test(part));
  const seats =
    seatsFromFeatures ??
    (vehicle.bodyType === "van" ? "BUS" : vehicle.bodyType === "suv" ? "5-seater" : "5-seater");
  const km =
    vehicle.condition === "new" && vehicle.mileageKm === 0
      ? "BRAND NEW"
      : `${vehicle.mileageKm.toLocaleString("de-DE")} KM`;
  const notes = (() => {
    if (/booked|reserved/i.test(vehicle.staffNotes ?? "")) {
      return "BOOKED";
    }
    if (vehicle.status === "booked") {
      return "BOOKED";
    }
    if (vehicle.status === "reserved") {
      return "RESERVED";
    }
    if (vehicle.status === "sold") {
      return "SOLD";
    }
    if (vehicle.status === "withdrawn" || vehicle.status === "expired") {
      return "HIDDEN";
    }
    return vehicle.staffNotes ?? "";
  })();

  return {
    NO: numeric || vehicle.stockCode,
    "CAR TYPE": [vehicle.make, vehicle.model, vehicle.trim].filter(Boolean).join(" ").toUpperCase(),
    COLOR: vehicle.exteriorColor,
    Seats: seats,
    Model: vehicle.year,
    KM: km,
    Price: vehicle.priceOmr,
    Notes: notes,
  };
}
