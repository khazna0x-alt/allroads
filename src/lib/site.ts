export function siteOrigin(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "https://allroads.om").replace(/\/$/, "");
}

export function localePath(locale: string, path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (locale === "en") {
    return normalized === "/" ? "/en" : `/en${normalized}`;
  }
  return normalized;
}

export function absoluteUrl(locale: string, path: string): string {
  return `${siteOrigin()}${localePath(locale, path)}`;
}
