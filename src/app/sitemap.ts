import { fetchQuery } from "convex/nextjs";
import type { MetadataRoute } from "next";
import { api } from "@/lib/convex";
import { localePath, siteOrigin } from "@/lib/site";

const LOCALES = ["ar", "en"] as const;
const STATIC_PATHS = [
  "/",
  "/inventory",
  "/consign",
  "/how-it-works",
  "/contact",
  "/privacy",
  "/terms",
  "/booking-terms",
] as const;

function pageEntry(path: string, lastModified?: Date): MetadataRoute.Sitemap[number] {
  const languages: Record<string, string> = {};
  for (const locale of LOCALES) {
    languages[locale] = `${siteOrigin()}${localePath(locale, path)}`;
  }
  languages["x-default"] = languages.ar ?? languages.en ?? siteOrigin();
  return {
    url: `${siteOrigin()}${localePath("ar", path)}`,
    lastModified,
    alternates: { languages },
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries = STATIC_PATHS.map((path) => pageEntry(path));

  try {
    const vehicles = await fetchQuery(api.public.listPublishedFeed, {});
    for (const vehicle of vehicles) {
      entries.push(
        pageEntry(
          `/inventory/${vehicle.slug}`,
          new Date(vehicle.updatedAt),
        ),
      );
    }
  } catch {
    // Static routes still publish if Convex is unreachable at build time.
  }

  return entries;
}
