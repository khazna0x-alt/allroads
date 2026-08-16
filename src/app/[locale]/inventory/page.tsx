import { getTranslations, setRequestLocale } from "next-intl/server";
import { InventoryBrowser } from "@/components/inventory/InventoryBrowser";

export default async function InventoryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Inventory");

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-5 sm:py-16">
      <h1 className="font-display text-4xl sm:text-5xl">{t("title")}</h1>
      <p className="mt-4 max-w-2xl text-base text-[var(--ivory-dim)] sm:text-lg">{t("lead")}</p>
      <div className="mt-10">
        <InventoryBrowser />
      </div>
    </div>
  );
}
