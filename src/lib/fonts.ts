import { Almarai, Outfit } from "next/font/google";

export const englishFont = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700", "800"],
  variable: "--font-body",
  display: "swap",
});

export const arabicFont = Almarai({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "700", "800"],
  variable: "--font-arabic",
  display: "swap",
});
