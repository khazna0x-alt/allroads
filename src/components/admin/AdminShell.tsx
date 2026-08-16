"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { AdminLocaleSwitcher } from "@/components/admin/AdminLocaleSwitcher";
import { Mark } from "@/components/brand/Mark";
import { api } from "@/lib/convex";

export function AdminShell({ children }: { children: ReactNode }) {
  const t = useTranslations("Admin");
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuthActions();
  const isLogin = pathname === "/admin/login";
  const me = useQuery(api.staff.me, isLogin ? "skip" : {});
  const [menuPath, setMenuPath] = useState<string | null>(null);
  const menuOpen = menuPath === pathname;

  const links = [
    { href: "/admin", label: t("nav.overview") },
    { href: "/admin/inventory", label: t("nav.inventory") },
    { href: "/admin/consignments", label: t("nav.consignments") },
    { href: "/admin/inquiries", label: t("nav.inquiries") },
    { href: "/admin/import", label: t("nav.excel") },
    { href: "/admin/staff", label: t("nav.staff") },
  ];

  useEffect(() => {
    if (!isLogin && me === null) {
      router.replace("/admin/login");
    }
  }, [isLogin, me, router]);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuPath(null);
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  if (isLogin) {
    return (
      <div className="admin-desk relative min-h-screen">
        <div className="absolute top-4 end-4 z-10">
          <AdminLocaleSwitcher />
        </div>
        {children}
      </div>
    );
  }

  if (me === undefined || me === null) {
    return (
      <div className="admin-desk flex min-h-svh items-center justify-center">
        <p className="admin-kicker">{t("opening")}</p>
      </div>
    );
  }

  const identifier = me.identifier;
  const account = {
    name: me.name ?? "",
    roleLabel: t(`roles.${me.role}`),
    identifier,
  };
  const handleSignOut = () => {
    void signOut().then(() => router.replace("/admin/login"));
  };

  return (
    <div className="admin-desk min-h-svh lg:grid lg:grid-cols-[16.5rem_minmax(0,1fr)]">
      <a
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-[80] focus:bg-[var(--sand)] focus:px-4 focus:py-2 focus:text-[var(--ink)]"
      >
        {t("skipToContent")}
      </a>
      <div className="sticky top-0 z-[60] flex items-center justify-between gap-3 border-b border-[var(--line)] bg-[rgba(11,9,6,0.92)] px-4 py-3 backdrop-blur lg:hidden">
        <button
          type="button"
          aria-expanded={menuOpen}
          aria-controls="admin-mobile-nav"
          onClick={() => setMenuPath(pathname)}
          className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center border border-[var(--line)] text-[var(--sand-bright)]"
        >
          <span className="sr-only">{t("openMenu")}</span>
          <MenuIcon />
        </button>
        <p className="font-display truncate text-xl text-[var(--sand)]">{t("brand")}</p>
        <AdminLocaleSwitcher />
      </div>

      {menuOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-[65] bg-black/55 lg:hidden"
          aria-label={t("closeMenu")}
          onClick={() => setMenuPath(null)}
        />
      ) : null}

      {menuOpen ? (
        <aside
          id="admin-mobile-nav"
          className="admin-sidebar drawer-in fixed inset-y-0 start-0 z-[70] flex h-dvh w-[min(18rem,88vw)] flex-col overflow-y-auto border-e border-[var(--line)] overscroll-contain lg:hidden"
        >
          <SidebarNav
            links={links}
            pathname={pathname}
            name={account.name}
            roleLabel={account.roleLabel}
            identifier={account.identifier}
            onNavigate={() => setMenuPath(null)}
            onSignOut={handleSignOut}
            showClose
          />
        </aside>
      ) : null}

      <aside className="admin-sidebar sticky top-0 hidden h-svh min-h-0 flex-col border-e border-[var(--line)] lg:flex">
        <SidebarNav
          links={links}
          pathname={pathname}
          name={account.name}
          roleLabel={account.roleLabel}
          identifier={account.identifier}
          onNavigate={() => setMenuPath(null)}
          onSignOut={handleSignOut}
        />
      </aside>
      <div id="admin-main" className="min-w-0 scroll-mt-20 p-4 sm:p-6 lg:p-10">
        {children}
      </div>
    </div>
  );
}

function isActive(pathname: string, href: string) {
  if (href === "/admin") {
    return pathname === "/admin";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarNav({
  links,
  pathname,
  name,
  roleLabel,
  identifier,
  onNavigate,
  onSignOut,
  showClose = false,
}: {
  links: Array<{ href: string; label: string }>;
  pathname: string;
  name: string;
  roleLabel: string;
  identifier: string;
  onNavigate: () => void;
  onSignOut: () => void;
  showClose?: boolean;
}) {
  const t = useTranslations("Admin");

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-start justify-between gap-3 px-5 pt-5 pb-4">
        <div className="flex min-w-0 items-start gap-3">
          <Mark className="h-10 w-10 shrink-0" />
          <div className="min-w-0">
            <p className="font-display text-2xl text-[var(--sand)]">{t("brand")}</p>
            <p className="text-[11px] tracking-[0.2em] uppercase text-[var(--ivory-dim)]">{t("desk")}</p>
          </div>
        </div>
        {showClose ? (
          <button
            type="button"
            className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center border border-[var(--line)] text-[var(--sand-bright)]"
            onClick={onNavigate}
          >
            <span className="sr-only">{t("closeMenu")}</span>
            <CloseIcon />
          </button>
        ) : null}
      </div>
      <div className="gold-rule mx-5" aria-hidden="true" />
      <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-5 py-4 text-sm">
        {links.map((link) => {
          const active = isActive(pathname, link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={`admin-nav-link min-h-11 px-3 py-2 ${
                active
                  ? "bg-[var(--sand)] text-[var(--ink)]"
                  : "text-[var(--ivory)] hover:bg-[var(--ink-panel)] hover:text-[var(--sand-bright)]"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto shrink-0 border-t border-[var(--line)] px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 text-xs text-[var(--ivory-dim)]">
            {name ? <p className="truncate text-sm text-[var(--ivory)]">{name}</p> : null}
            <p className="truncate">{roleLabel}</p>
            {identifier ? (
              <p className="mt-0.5 truncate" dir="ltr">
                {identifier}
              </p>
            ) : null}
          </div>
          <AdminLocaleSwitcher />
        </div>
        <button
          type="button"
          onClick={onSignOut}
          className="admin-btn admin-btn-secondary mt-3 w-full"
        >
          {t("signOut")}
        </button>
      </div>
    </div>
  );
}

function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        d="M2 4.5h14M2 9h14M2 13.5h14"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="square"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        d="M4 4l10 10M14 4L4 14"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="square"
      />
    </svg>
  );
}
