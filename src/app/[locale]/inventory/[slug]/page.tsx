import { fetchQuery } from "convex/nextjs";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { VehicleDetail } from "@/components/inventory/VehicleDetail";
import { api } from "@/lib/convex";
import { formatVehiclePrice } from "@/lib/pricing";
import { jsonLdScript, vehicleJsonLd } from "@/lib/vehicleJsonLd";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "Inventory" });
  const vehicle = await fetchQuery(api.public.getPublishedBySlug, { slug });
  if (!vehicle) {
    return {
      title: t("title"),
      description: t("lead"),
    };
  }
  const title = locale === "ar" ? vehicle.titleAr : vehicle.titleEn;
  const price = formatVehiclePrice(vehicle, locale, t);
  const description = (
    (locale === "ar" ? vehicle.descriptionAr : vehicle.descriptionEn).trim() ||
    t("metaDescription", {
      year: vehicle.year,
      make: vehicle.make,
      model: vehicle.model,
      price,
      stock: vehicle.stockCode,
    })
  ).slice(0, 180);
  const photo = vehicle.photos[0]?.url;
  const images = photo ? [{ url: photo }] : [{ url: "/og.png", width: 512, height: 512 }];

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images,
    },
    twitter: {
      card: photo ? "summary_large_image" : "summary",
      title,
      description,
      images: photo ? [photo] : ["/og.png"],
    },
  };
}

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const vehicle = await fetchQuery(api.public.getPublishedBySlug, { slug });
  if (!vehicle) {
    notFound();
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(vehicleJsonLd(vehicle, locale)) }}
      />
      <VehicleDetail slug={slug} />
    </>
  );
}
