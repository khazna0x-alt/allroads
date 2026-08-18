import { getTranslations, setRequestLocale } from "next-intl/server";

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Privacy");

  return (
    <article className="mx-auto max-w-3xl px-4 py-10 sm:px-5 sm:py-16">
      <h1 className="font-display text-4xl sm:text-5xl">{t("title")}</h1>
      <div className="mt-10 space-y-8 text-lg leading-8 text-gray-400">
        <p>{t("intro")}</p>
        <div>
          <h2 className="font-display text-2xl text-white">{t("collectTitle")}</h2>
          <p className="mt-3">{t("collectBody")}</p>
        </div>
        <div>
          <h2 className="font-display text-2xl text-white">{t("usageTitle")}</h2>
          <p className="mt-3">{t("usageBody")}</p>
        </div>
        <div>
          <h2 className="font-display text-2xl text-white">{t("metaTitle")}</h2>
          <p className="mt-3">{t("metaBody")}</p>
        </div>
        <div>
          <h2 className="font-display text-2xl text-white">{t("toolsTitle")}</h2>
          <p className="mt-3">{t("toolsBody")}</p>
        </div>
      </div>
    </article>
  );
}
