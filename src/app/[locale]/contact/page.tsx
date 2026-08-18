import { getTranslations, setRequestLocale } from "next-intl/server";
import { WhatsAppButton } from "@/components/brand/WhatsAppButton";
import { InquiryForm } from "@/components/forms/InquiryForm";
import { Link } from "@/i18n/navigation";
import { brand } from "@/lib/brand";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Contact" });
  return {
    title: t("title"),
    description: t("directionsBody"),
  };
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Contact");
  const isAr = locale === "ar";
  const address = isAr ? brand.addressAr : brand.addressEn;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-5 sm:py-16">
      <p className="font-bold tracking-[0.28em] uppercase text-[var(--sand)]">
        {t("eyebrow")}
      </p>
      <h1 className="font-display mt-3 text-4xl sm:text-5xl">{t("title")}</h1>

      <div className="mt-10 grid gap-12 lg:grid-cols-2">
        <div className="min-w-0 space-y-8 text-[var(--ivory-dim)]">
          <div>
            <p className="text-[var(--sand)]">{t("phone")}</p>
            <a href={`tel:${brand.phoneE164}`} className="mt-2 block text-xl text-white sm:text-2xl" dir="ltr">
              {brand.phoneDisplay}
            </a>
          </div>
          <div>
            <p className="text-[var(--sand)]">{t("whatsapp")}</p>
            <div className="mt-2">
              <WhatsAppButton href={brand.whatsapp} ariaLabel={t("whatsapp")} />
            </div>
          </div>
          <div>
            <p className="text-[var(--sand)]">{t("emailLabel")}</p>
            <a href={`mailto:${brand.email}`} className="mt-2 block text-xl text-white hover:text-[var(--sand)] sm:text-2xl" dir="ltr">
              {brand.email}
            </a>
          </div>
          <div>
            <p className="text-[var(--sand)]">{t("address")}</p>
            <p className="mt-2 text-lg leading-8 text-white">{address}</p>
          </div>
          <div>
            <p className="text-[var(--sand)]">{t("hours")}</p>
            <p className="mt-2">{isAr ? brand.hoursWeekdayAr : brand.hoursWeekdayEn}</p>
            <p>{brand.hoursMorning}</p>
            <p>{t("break")}</p>
            <p>{brand.hoursEvening}</p>
            <p className="mt-2">{isAr ? brand.fridayAr : brand.fridayEn}</p>
          </div>
          <div>
            <p className="text-[var(--sand)]">{t("directions")}</p>
            <p className="mt-2 max-w-xl leading-7">{t("directionsBody")}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a
              href={brand.maps}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary px-5"
            >
              {t("maps")}
            </a>
            <a
              href={brand.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary px-5"
            >
              {t("instagram")}
            </a>
          </div>
          <div className="border border-[var(--sand)]/30 bg-[var(--ink)] p-5">
            <p className="text-[var(--sand)]">{t("consignCtaTitle")}</p>
            <p className="mt-2 text-sm leading-7">{t("consignCtaBody")}</p>
            <div className="mt-4">
              <Link href="/consign" className="btn-primary px-5">
                {t("consignCta")}
              </Link>
            </div>
          </div>
        </div>
        <div className="min-w-0 border border-[var(--line)] bg-[var(--ink-soft)] p-4 sm:p-6">
          <h2 className="font-display mb-6 text-2xl sm:text-3xl">{t("formTitle")}</h2>
          <InquiryForm />
        </div>
      </div>

      <div className="mt-12 overflow-hidden border border-[var(--line)] bg-[var(--ink-soft)]">
        <iframe
          title={t("mapTitle")}
          src={brand.mapsEmbed}
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          className="h-[18rem] w-full sm:h-[24rem]"
        />
      </div>
    </div>
  );
}
