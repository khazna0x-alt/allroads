import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { Footer } from "@/components/brand/Footer";
import { Header } from "@/components/brand/Header";
import { LocaleDir } from "@/components/brand/LocaleDir";
import { WaAgentsSlot } from "@/components/brand/WaAgentsSlot";
import { arabicFont, englishFont } from "@/lib/fonts";
import { routing } from "@/i18n/routing";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Meta" });
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <LocaleDir locale={locale} />
      <div
        className={`${englishFont.variable} ${arabicFont.variable} ${locale === "ar" ? arabicFont.className : englishFont.className} relative min-h-screen`}
      >
        <Header />
        <main className="min-w-0 pt-[var(--header-h)]">{children}</main>
        <Footer />
        <WaAgentsSlot />
      </div>
    </NextIntlClientProvider>
  );
}
