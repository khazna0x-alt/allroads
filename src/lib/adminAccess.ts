export const ADMIN_ONLY_PATHS = ["/admin/staff", "/admin/import", "/admin/settings"];

export function isAdminOnlyPath(pathname: string): boolean {
  return ADMIN_ONLY_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export function staffNavLinks<T extends { href: string }>(
  links: T[],
  role: "admin" | "editor",
): T[] {
  if (role === "admin") {
    return links;
  }
  return links.filter((link) => !isAdminOnlyPath(link.href));
}
