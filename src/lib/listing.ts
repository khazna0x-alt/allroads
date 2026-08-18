import { brand } from "./brand";
import { localePath, siteOrigin } from "./site";

export function vehiclePublicPath(slug: string, locale: string): string {
  return localePath(locale, `/inventory/${slug}`);
}

export function vehiclePublicUrl(slug: string, locale: string): string {
  const site = typeof window !== "undefined" ? window.location.origin : siteOrigin();
  return `${site}${vehiclePublicPath(slug, locale)}`;
}

export function whatsappHref(text: string): string {
  const url = new URL(brand.whatsapp);
  url.searchParams.set("text", text);
  return url.toString();
}
