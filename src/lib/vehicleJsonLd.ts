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
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "OMR",
      price: vehicle.priceOmr,
      availability: AVAILABILITY[vehicle.status],
      itemCondition:
        vehicle.condition === "new"
          ? "https://schema.org/NewCondition"
          : "https://schema.org/UsedCondition",
      seller: {
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
      },
    },
  };
}

export function jsonLdScript(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
