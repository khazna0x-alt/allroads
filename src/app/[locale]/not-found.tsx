import { getLocale, getTranslations } from "next-intl/server";
import { NotFoundScreen } from "@/components/brand/NotFoundScreen";

export default async function LocaleNotFound() {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "NotFound" });
  return (
    <NotFoundScreen
      locale={locale}
      kicker={t("kicker")}
      title={t("title")}
      lead={t("lead")}
      home={t("home")}
      inventory={t("inventory")}
    />
  );
}
