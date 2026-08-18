import { fetchQuery } from "convex/nextjs";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { VehicleDetail } from "@/components/inventory/VehicleDetail";
import { api } from "@/lib/convex";
import { formatOmr } from "@/lib/format";
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
  const description =
    (locale === "ar" ? vehicle.descriptionAr : vehicle.descriptionEn).trim() ||
    t("metaDescription", {
      year: vehicle.year,
      make: vehicle.make,
      model: vehicle.model,
      price: formatOmr(vehicle.priceOmr, locale),
      stock: vehicle.stockCode,
    });
  return {
    title,
    description: description.slice(0, 180),
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

  return (
    <>
      {vehicle ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdScript(vehicleJsonLd(vehicle, locale)) }}
        />
      ) : null}
      <VehicleDetail slug={slug} />
    </>
  );
}
