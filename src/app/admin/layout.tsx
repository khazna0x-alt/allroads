import { Cinzel, Source_Sans_3 } from "next/font/google";
import { cookies } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";
import { AdminDir } from "@/components/admin/AdminDir";
import { AdminShell } from "@/components/admin/AdminShell";
import { ConfirmProvider } from "@/components/admin/ConfirmDialog";
import { ADMIN_LOCALE_COOKIE, parseAdminLocale } from "@/i18n/admin-locale";
import { arabicFont } from "@/lib/fonts";

const deskDisplay = Cinzel({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-desk-display",
});
const deskBody = Source_Sans_3({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-desk-body",
});

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const locale = parseAdminLocale(cookieStore.get(ADMIN_LOCALE_COOKIE)?.value);
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){var m=document.cookie.match(/(?:^|; )${ADMIN_LOCALE_COOKIE}=([^;]*)/);var l=m&&decodeURIComponent(m[1])==='en'?'en':'ar';document.documentElement.lang=l;document.documentElement.dir=l==='ar'?'rtl':'ltr';})();`,
        }}
      />
      <AdminDir locale={locale} />
      <div
        className={`${deskDisplay.variable} ${deskBody.variable} ${arabicFont.variable} ${locale === "ar" ? arabicFont.className : deskBody.className} min-h-screen min-w-0 bg-[var(--ink)] text-[var(--ivory)]`}
      >
        <ConfirmProvider>
          <AdminShell>{children}</AdminShell>
        </ConfirmProvider>
      </div>
    </NextIntlClientProvider>
  );
}
