const ARABIC_SCRIPT = /[\u0600-\u06FF]/;

const MAKE_AR: Record<string, string> = {
  hyundai: "هيونداي",
  toyota: "تويوتا",
  nissan: "نيسان",
  honda: "هوندا",
  ford: "فورد",
  chevrolet: "شيفروليه",
  chevy: "شيفروليه",
  jeep: "جيب",
  bmw: "بي إم دبليو",
  audi: "أودي",
  porsche: "بورشه",
  kia: "كيا",
  suzuki: "سوزوكي",
  dongfeng: "دونغفنغ",
  volkswagen: "فولكسفاغن",
  vw: "فولكسفاغن",
  "mercedes-benz": "مرسيدس",
  mercedes: "مرسيدس",
  benz: "مرسيدس",
  lexus: "لكزس",
  mazda: "مازدا",
  mitsubishi: "ميتسوبيشي",
  gmc: "جي إم سي",
  cadillac: "كاديلاك",
  dodge: "دودج",
  infiniti: "إنفينيتي",
  genesis: "جينيسيس",
  mg: "إم جي",
  "land rover": "لاند روفر",
  "range rover": "رينج روفر",
  jaguar: "جاكوار",
  volvo: "فولفو",
  peugeot: "بيجو",
  renault: "رينو",
  changan: "شانجان",
  haval: "هافال",
  chery: "شيري",
  geely: "جيلي",
  tesla: "تسلا",
  mini: "ميني",
  isuzu: "إيسوزو",
  ram: "رام",
  lincoln: "لينكولن",
  chrysler: "كرايسلر",
  bentley: "بنتلي",
  "rolls-royce": "رولز رويس",
  "rolls royce": "رولز رويس",
  lamborghini: "لامبورغيني",
  ferrari: "فيراري",
  maserati: "مازيراتي",
  mclaren: "مكلارين",
  "aston martin": "أستون مارتن",
  subaru: "سوبارو",
  daihatsu: "دايهاتسو",
  "great wall": "جريت وول",
  gac: "جي إيه سي",
  byd: "بي واي دي",
  jetour: "جيتور",
  tank: "تانك",
  exeed: "إكسيد",
};

const MODEL_AR: Record<string, string> = {
  "land cruiser 300": "لاند كروزر 300",
  "land cruiser 70": "لاند كروزر 70",
  "land cruiser": "لاند كروزر",
  prado: "برادو",
  hilux: "هايلكس",
  fortuner: "فورتشنر",
  camry: "كامري",
  corolla: "كورولا",
  yaris: "يارس",
  rav4: "راف 4",
  highlander: "هايلاندر",
  tundra: "تندرا",
  sequoia: "سيكويا",
  "4runner": "فور رانر",
  patrol: "باترول",
  sunny: "صني",
  altima: "التيما",
  "x-trail": "إكس تريل",
  xtrail: "إكس تريل",
  pathfinder: "باثفايندر",
  armada: "أرمادا",
  pajero: "باجيرو",
  l200: "إل 200",
  asx: "إيه إس إكس",
  tucson: "توسان",
  "santa fe": "سنتافي",
  santafe: "سنتافي",
  sonata: "سوناتا",
  elantra: "إلنترا",
  accent: "أكسنت",
  creta: "كريتا",
  palisade: "باليسيد",
  staria: "ستاريا",
  sportage: "سبورتاج",
  sorento: "سورينتو",
  carnival: "كرنفال",
  cerato: "سيراتو",
  picanto: "بيكانتو",
  rio: "ريو",
  k5: "كي 5",
  accord: "أكورد",
  civic: "سيفيك",
  "cr-v": "سي آر في",
  crv: "سي آر في",
  "hr-v": "إتش آر في",
  wrangler: "رانجلر",
  "grand cherokee": "جراند شيروكي",
  cherokee: "شيروكي",
  compass: "كومباس",
  gladiator: "جلاديتور",
  escalade: "إسكاليد",
  tahoe: "تاهو",
  suburban: "سوبربان",
  silverado: "سيلفرادو",
  yukon: "يوكن",
  sierra: "سييرا",
  "f-150": "إف 150",
  f150: "إف 150",
  explorer: "إكسبلورر",
  expedition: "إكسبيديشن",
  mustang: "موستانج",
  ranger: "رينجر",
  charger: "تشارجر",
  challenger: "تشالنجر",
  durango: "دورانجو",
  cayenne: "كايين",
  macan: "ماكان",
  panamera: "باناميرا",
  "range rover sport": "رينج روفر سبورت",
  "range rover": "رينج روفر",
  defender: "ديفندر",
  discovery: "ديسكفري",
  "g 63": "G 63",
  "lx 600": "LX 600",
  "lx 570": "LX 570",
};

const TRIM_AR: Record<string, string> = {
  "full option": "فل أوبشن",
  "full options": "فل أوبشن",
  "fl option": "فل أوبشن",
  hatchback: "هاتشباك",
  "f sport": "أف سبورت",
};

const SPEC_AR: Record<string, string> = {
  gcc: "خليجي",
  american: "أمريكي",
  other: "أخرى",
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function lookup(dictionary: Record<string, string>, value: string): string | undefined {
  const key = value.trim().toLowerCase().replace(/\s+/g, " ");
  return dictionary[key];
}

function translatePhrase(value: string, dictionary: Record<string, string>): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }
  const exact = lookup(dictionary, trimmed);
  if (exact) {
    return exact;
  }

  const entries = Object.entries(dictionary).sort((a, b) => b[0].length - a[0].length);
  let result = trimmed;
  for (const [english, arabic] of entries) {
    result = result.replace(new RegExp(escapeRegExp(english), "ig"), arabic);
  }
  return result;
}

export function pickArabicText(candidates: Array<string | undefined>, fallback: string): string {
  for (const candidate of candidates) {
    if (candidate && hasArabicScript(candidate)) {
      return candidate.trim();
    }
  }
  return fallback;
}

export function hasArabicScript(value: string): boolean {
  return ARABIC_SCRIPT.test(value);
}

export function arabicMake(make: string): string {
  return lookup(MAKE_AR, make) ?? make.trim();
}

export function buildArabicTitle(input: {
  year: number;
  make: string;
  model: string;
  trim?: string;
}): string {
  const make = arabicMake(input.make);
  const model = translatePhrase(input.model, MODEL_AR);
  const rawTrim = input.trim?.trim() ?? "";
  const trim = rawTrim ? (lookup(TRIM_AR, rawTrim) ?? translatePhrase(rawTrim, TRIM_AR)) : "";
  const modelHasTrim = rawTrim.length > 0 && model.toLowerCase().includes(rawTrim.toLowerCase());
  return [make, model, modelHasTrim ? "" : trim, String(input.year)].filter(Boolean).join(" ");
}

export function buildArabicDescription(input: {
  year: number;
  make: string;
  model: string;
  mileageKm: number;
  spec: string;
  condition: string;
}): string {
  const make = arabicMake(input.make);
  const model = translatePhrase(input.model, MODEL_AR);
  const spec = SPEC_AR[input.spec] ?? input.spec;
  const condition = input.condition === "new" ? "جديدة" : "مستعملة";
  const mileage =
    input.mileageKm === 0
      ? "عداد صفر"
      : `${input.mileageKm.toLocaleString("en-US")} كم`;
  return `${make} ${model} موديل ${input.year}، ${mileage}، مواصفات ${spec}، ${condition}.`;
}

export function resolveArabicTitle(input: {
  titleAr: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
}): string {
  if (hasArabicScript(input.titleAr)) {
    return input.titleAr.trim();
  }
  return buildArabicTitle(input);
}

export function resolveArabicDescription(input: {
  descriptionAr: string;
  year: number;
  make: string;
  model: string;
  mileageKm: number;
  spec: string;
  condition: string;
}): string {
  if (hasArabicScript(input.descriptionAr)) {
    return input.descriptionAr.trim();
  }
  return buildArabicDescription(input);
}
