import { getTranslations, setRequestLocale } from "next-intl/server";
import { HowItWorks } from "@/components/brand/HowItWorks";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "HowItWorks" });
  return {
    title: t("title"),
    description: t("lead"),
  };
}

export default async function HowItWorksPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("HowItWorks");

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-5 sm:py-16">
      <p className="font-bold text-[var(--sand)]">{t("eyebrow")}</p>
      <h1 className="font-display mt-3 text-4xl sm:text-5xl">{t("title")}</h1>
      <p className="mt-4 max-w-3xl text-base text-gray-400 sm:text-lg">{t("lead")}</p>
      <HowItWorks />
    </div>
  );
}
