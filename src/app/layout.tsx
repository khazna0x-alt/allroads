import type { ReactNode } from "react";
import { ConvexClientProvider } from "./ConvexClientProvider";
import "./globals.css";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className="min-h-full antialiased">
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}
