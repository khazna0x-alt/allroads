import { brand } from "./brand";
import { vehiclePublicUrl } from "./listing";
import { absoluteUrl } from "./site";

type PublicVehicle = {
  slug: string;
  stockCode: string;
  make: string;
  model: string;
  year: number;
  priceOmr: number;
  priceMode?: "buy" | "request" | "finance";
  financeMonthlyOmr?: number;
  mileageKm: number;
  fuel: string;
  transmission: string;
  bodyType: string;
  spec: string;
  condition: string;
  exteriorColor: string;
  interiorColor: string;
  status: "published" | "reserved" | "booked";
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  photos: Array<{ url: string }>;
};

const FUEL: Record<string, string> = {
  petrol: "Gasoline",
  diesel: "Diesel",
  hybrid: "Hybrid",
  plugin_hybrid: "Plug-in Hybrid",
  electric: "Electric",
};

const AVAILABILITY: Record<PublicVehicle["status"], string> = {
  published: "https://schema.org/InStock",
  reserved: "https://schema.org/LimitedAvailability",
  booked: "https://schema.org/PreOrder",
};

function offerSeller(locale: string) {
  return {
    "@type": "AutoDealer",
    name: locale === "ar" ? brand.legalAr : brand.legalEn,
    telephone: brand.phoneE164,
    email: brand.email,
    url: absoluteUrl(locale, "/"),
    address: {
      "@type": "PostalAddress",
      streetAddress: locale === "ar" ? brand.locationAr : brand.locationEn,
      addressLocality: "Al Amerat",
      addressRegion: "Muscat Governorate",
      addressCountry: "OM",
    },
  };
}

export function vehicleJsonLd(vehicle: PublicVehicle, locale: string): Record<string, unknown> {
  const name = locale === "ar" ? vehicle.titleAr : vehicle.titleEn;
  const description = (locale === "ar" ? vehicle.descriptionAr : vehicle.descriptionEn).trim();
  const url = vehiclePublicUrl(vehicle.slug, locale);
  const images = vehicle.photos.map((photo) => photo.url).filter(Boolean);

  return {
    "@context": "https://schema.org",
    "@type": "Vehicle",
    name,
    url,
    sku: vehicle.stockCode,
    brand: { "@type": "Brand", name: vehicle.make },
    model: vehicle.model,
    vehicleModelDate: String(vehicle.year),
    mileageFromOdometer: {
      "@type": "QuantitativeValue",
      value: vehicle.mileageKm,
      unitCode: "KMT",
    },
    color: vehicle.exteriorColor,
    vehicleInteriorColor: vehicle.interiorColor,
    fuelType: FUEL[vehicle.fuel] ?? vehicle.fuel,
    vehicleTransmission: vehicle.transmission === "automatic" ? "Automatic" : "Manual",
    bodyType: vehicle.bodyType,
    vehicleConfiguration: vehicle.spec === "gcc" ? "GCC" : vehicle.spec,
    image: images,
    description: description || name,
    offers:
      vehicle.priceMode === "request"
        ? {
            "@type": "Offer",
            url,
            availability: AVAILABILITY[vehicle.status],
            itemCondition:
              vehicle.condition === "new"
                ? "https://schema.org/NewCondition"
                : "https://schema.org/UsedCondition",
            seller: offerSeller(locale),
          }
        : {
            "@type": "Offer",
            url,
            priceCurrency: "OMR",
            price:
              vehicle.priceMode === "finance" ? vehicle.financeMonthlyOmr ?? 0 : vehicle.priceOmr,
            ...(vehicle.priceMode === "finance" ? { unitText: "MONTH" } : {}),
            availability: AVAILABILITY[vehicle.status],
            itemCondition:
              vehicle.condition === "new"
                ? "https://schema.org/NewCondition"
                : "https://schema.org/UsedCondition",
            seller: offerSeller(locale),
          },
  };
}

export function jsonLdScript(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
