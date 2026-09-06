"use client";

import { useAction, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { AdminButton, DeskCard } from "@/components/admin/ui";
import { api, type Id } from "@/lib/convex";
import { convexErrorMessage } from "@/lib/convexError";

export function VehicleQrCard({ vehicleId, stockCode }: { vehicleId: Id<"vehicles">; stockCode: string }) {
  const t = useTranslations("Admin.qr");
  const qr = useQuery(api.elkqr.forVehicle, { vehicleId });
  const refresh = useAction(api.elkqr.refreshVehicleQr);
  const downloadPng = useAction(api.elkqr.downloadPng);
  const [busy, setBusy] = useState<"refresh" | "download" | "share" | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const autoCreateTried = useRef(false);

  useEffect(() => {
    autoCreateTried.current = false;
  }, [vehicleId]);

  useEffect(() => {
    if (!qr?.listed || qr.imageUrl || autoCreateTried.current || busy !== null) {
      return;
    }
    autoCreateTried.current = true;
    setBusy("refresh");
    setError("");
    void refresh({ vehicleId })
      .catch((err) => {
        setError(convexErrorMessage(err, t("failed")));
        autoCreateTried.current = false;
      })
      .finally(() => {
        setBusy(null);
      });
  }, [busy, qr, refresh, t, vehicleId]);

  async function onRefresh() {
    setBusy("refresh");
    setError("");
    try {
      await refresh({ vehicleId });
    } catch (err) {
      setError(convexErrorMessage(err, t("failed")));
    } finally {
      setBusy(null);
    }
  }

  async function onDownload() {
    setBusy("download");
    setError("");
    try {
      const file = await downloadPng({ vehicleId });
      const bytes = Uint8Array.from(atob(file.base64), (char) => char.charCodeAt(0));
      const blob = new Blob([bytes], { type: file.contentType });
      const href = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = href;
      link.download = file.fileName;
      link.click();
      URL.revokeObjectURL(href);
    } catch (err) {
      setError(convexErrorMessage(err, t("failed")));
    } finally {
      setBusy(null);
    }
  }

  async function onShare() {
    const url = qr?.scanUrl;
    if (!url) {
      return;
    }
    setBusy("share");
    setError("");
    try {
      if (navigator.share) {
        await navigator.share({ title: stockCode, url, text: t("shareText", { stock: stockCode }) });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return;
      }
      setError(convexErrorMessage(err, t("failed")));
    } finally {
      setBusy(null);
    }
  }

  return (
    <DeskCard>
      <p className="admin-kicker">{t("kicker")}</p>
      <h2 className="font-display mt-1 text-xl">{t("title")}</h2>
      <p className="mt-2 text-sm text-[var(--ivory-dim)]">{t("lead")}</p>
      {qr === undefined ? (
        <p className="mt-4 text-sm text-[var(--ivory-dim)]">{t("loading")}</p>
      ) : !qr.listed ? (
        <p className="mt-4 text-sm text-[var(--ivory-dim)]">{t("delisted")}</p>
      ) : (
        <div className="mt-5 grid gap-5 sm:grid-cols-[8.5rem_minmax(0,1fr)] sm:items-start">
          <div className="border border-[var(--line)] bg-white p-2">
            {qr.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qr.imageUrl} alt={t("imageAlt", { stock: stockCode })} className="h-auto w-full" />
            ) : (
              <div className="flex aspect-square items-center justify-center text-center text-xs text-[var(--ink)]">
                {t("pending")}
              </div>
            )}
          </div>
          <div className="flex min-w-0 flex-col gap-2">
            {qr.scanUrl ? (
              <p className="truncate text-xs text-[var(--ivory-dim)]" dir="ltr">
                {qr.scanUrl}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <AdminButton onClick={() => void onDownload()} disabled={busy !== null || !qr.elkqrId}>
                {busy === "download" ? t("downloading") : t("download")}
              </AdminButton>
              <AdminButton onClick={() => void onShare()} disabled={busy !== null || !qr.scanUrl}>
                {copied ? t("copied") : t("share")}
              </AdminButton>
              <AdminButton variant="ghost" onClick={() => void onRefresh()} disabled={busy !== null}>
                {busy === "refresh" ? t("refreshing") : t("refresh")}
              </AdminButton>
            </div>
          </div>
        </div>
      )}
      {error ? <p className="mt-3 text-sm text-[#f2c4c6]">{error}</p> : null}
    </DeskCard>
  );
}
