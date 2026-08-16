import { getTranslations, setRequestLocale } from "next-intl/server";
import { ConsignmentPackage } from "@/components/consign/ConsignmentPackage";
import { ConsignmentForm } from "@/components/forms/ConsignmentForm";

export default async function ConsignPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Consign");

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-5 sm:py-16">
      <p className="font-bold tracking-[0.28em] uppercase text-[var(--sand)]">{t("eyebrow")}</p>
      <h1 className="font-display mt-3 text-4xl sm:text-5xl">{t("title")}</h1>
      <p className="mt-4 max-w-3xl text-base text-gray-400 sm:text-lg">{t("lead")}</p>
      <p className="mt-3 max-w-3xl text-sm text-[var(--ivory-dim)]">{t("leadNote")}</p>

      <div className="mt-10">
        <ConsignmentPackage />
      </div>

      <div className="mx-auto mt-12 max-w-3xl min-w-0 border border-[var(--line)] bg-[var(--ink-soft)] p-4 sm:p-6">
        <h2 className="font-display mb-6 text-2xl sm:text-3xl">{t("formTitle")}</h2>
        <ConsignmentForm />
      </div>
    </div>
  );
}
