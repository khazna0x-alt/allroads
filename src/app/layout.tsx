import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import type { ReactNode } from "react";
import { ConvexClientProvider } from "./ConvexClientProvider";
import "./globals.css";

export default async function RootLayout({ children }: { children: ReactNode }) {
  return (
    <ConvexAuthNextjsServerProvider>
      <html lang="ar" dir="rtl" suppressHydrationWarning>
        <body className="min-h-full antialiased">
          <ConvexClientProvider>{children}</ConvexClientProvider>
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  );
}
