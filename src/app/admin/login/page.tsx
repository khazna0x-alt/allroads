"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminButton, AdminField, GoldRule } from "@/components/admin/ui";
import { Mark } from "@/components/brand/Mark";
import { api } from "@/lib/convex";
import { clearConvexAuthStorage } from "@/lib/convexAuthStorage";

export default function AdminLoginPage() {
  const t = useTranslations("Admin.login");
  const tAccess = useTranslations("Admin");
  const { signIn, signOut } = useAuthActions();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const me = useQuery(api.staff.me, isLoading || !isAuthenticated ? "skip" : {});
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!me) {
      return;
    }
    router.replace("/admin");
  }, [me, router]);

  const entering = pending && me !== null;

  return (
    <div className="admin-login-stage flex min-h-svh items-center justify-center px-4 py-20 sm:px-5">
      <form
        className="admin-card w-full max-w-md min-w-0 p-5 sm:p-8"
        onSubmit={(event) => {
          event.preventDefault();
          if (pending) {
            return;
          }
          const formData = new FormData(event.currentTarget);
          formData.set("flow", "signIn");
          setPending(true);
          setError("");
          void signOut()
            .catch(() => undefined)
            .then(() => {
              clearConvexAuthStorage();
              return signIn("password", formData);
            })
            .then((result) => {
              if (result.signingIn) {
                return;
              }
              setError(t("invalid"));
              setPending(false);
            })
            .catch(() => {
              clearConvexAuthStorage();
              setError(t("invalid"));
              setPending(false);
            });
        }}
      >
        <Mark className="h-14 w-14" />
        <p className="admin-kicker mt-5">{t("kicker")}</p>
        <h1 className="admin-title font-display mt-2 text-3xl sm:text-4xl">{t("title")}</h1>
        <p className="mt-3 text-sm text-[var(--ivory-dim)] text-pretty">{t("lead")}</p>
        <GoldRule className="mt-6" />
        <AdminField
          name="email"
          label={t("identifier")}
          required
          autoComplete="username"
          spellCheck={false}
          className="mt-6 block"
        />
        <AdminField
          name="password"
          label={t("password")}
          type="password"
          required
          autoComplete="current-password"
          className="mt-4 block"
        />
        {error ? (
          <p className="mt-3 text-sm text-[#f2c4c6]" role="alert">
            {error}
          </p>
        ) : null}
        {isAuthenticated && me === null ? (
          <p className="mt-3 text-sm text-[#f2c4c6]" role="alert">
            {tAccess("noDeskAccess")}
          </p>
        ) : null}
        <AdminButton type="submit" variant="primary" className="mt-6 w-full" disabled={entering}>
          {entering ? t("entering") : t("enter")}
        </AdminButton>
      </form>
    </div>
  );
}
