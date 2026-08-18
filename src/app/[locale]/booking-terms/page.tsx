import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function BookingTermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("BookingTerms");
  const nav = await getTranslations("Nav");

  return (
    <article className="mx-auto max-w-3xl px-4 py-10 sm:px-5 sm:py-16">
      <h1 className="font-display text-4xl sm:text-5xl">{t("title")}</h1>
      <div className="mt-10 space-y-8 text-lg leading-8 text-gray-400">
        <p>{t("intro")}</p>
        <div>
          <h2 className="font-display text-2xl text-white">{t("depositTitle")}</h2>
          <p className="mt-3">{t("depositBody")}</p>
        </div>
        <div>
          <h2 className="font-display text-2xl text-white">{t("refundTitle")}</h2>
          <p className="mt-3">{t("refundBody")}</p>
        </div>
        <div>
          <h2 className="font-display text-2xl text-white">{t("durationTitle")}</h2>
          <p className="mt-3">{t("durationBody")}</p>
        </div>
        <div>
          <h2 className="font-display text-2xl text-white">{t("paymentTitle")}</h2>
          <p className="mt-3">{t("paymentBody")}</p>
        </div>
        <p>
          <Link href="/terms" className="text-[var(--sand)] underline">
            {nav("terms")}
          </Link>
        </p>
      </div>
    </article>
  );
}
