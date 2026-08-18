"use client";

import { useMutation, useQuery } from "convex/react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import {
  AdminButton,
  DeskTime,
  EmptyState,
  FilterChip,
  GoldRule,
  PageHeader,
  StatusBadge,
} from "@/components/admin/ui";
import { useConfirmDialog } from "@/components/admin/ConfirmDialog";
import {
  contentTypeForFile,
  isAllowedContractFile,
  MAX_CONTRACT_BYTES,
} from "@/lib/contractFile";
import { api, type Id } from "@/lib/convex";
import { formatOmr } from "@/lib/format";

const BOOKING_FILTERS = ["all", "reserved", "booked", "cancelled", "expired"] as const;
const EXTEND_DAYS = [3, 7, 14] as const;

export default function BookingsPage() {
  const t = useTranslations("Admin");
  const locale = useLocale();
  const confirm = useConfirmDialog();
  const [filter, setFilter] = useState<(typeof BOOKING_FILTERS)[number]>("all");
  const rows = useQuery(api.bookings.listStaff, filter === "all" ? {} : { status: filter });
  const approve = useMutation(api.bookings.approve);
  const cancel = useMutation(api.bookings.cancel);
  const extend = useMutation(api.bookings.extend);
  const setPaymentStatus = useMutation(api.bookings.setPaymentStatus);
  const generateUploadUrl = useMutation(api.bookings.generateReceiptUploadUrl);
  const attachReceiptStaff = useMutation(api.bookings.attachReceiptStaff);

  async function onCancel(bookingId: Id<"bookings">, number: string) {
    const result = await confirm({
      title: t("bookings.cancelTitle"),
      message: t("bookings.cancelConfirm", { number }),
      confirmLabel: t("bookings.cancel"),
      cancelLabel: t("confirm.cancel"),
      tone: "danger",
      reasonLabel: t("confirm.reasonLabel"),
    });
    if (!result.confirmed) {
      return;
    }
    await cancel({ bookingId, reason: result.reason || undefined });
  }

  async function onRefund(bookingId: Id<"bookings">, number: string) {
    const result = await confirm({
      title: t("bookings.refundTitle"),
      message: t("bookings.refundConfirm", { number }),
      confirmLabel: t("bookings.refund"),
      cancelLabel: t("confirm.cancel"),
      reasonLabel: t("bookings.refundNotes"),
      reasonRequired: true,
    });
    if (!result.confirmed) {
      return;
    }
    await setPaymentStatus({
      bookingId,
      status: "refunded",
      notes: result.reason,
    });
  }

  async function onReceipt(bookingId: Id<"bookings">, file: File) {
    if (file.size > MAX_CONTRACT_BYTES || !isAllowedContractFile(file)) {
      return;
    }
    const postUrl = await generateUploadUrl();
    const uploaded = await fetch(postUrl, {
      method: "POST",
      headers: { "Content-Type": contentTypeForFile(file) },
      body: file,
    });
    if (!uploaded.ok) {
      return;
    }
    const json = (await uploaded.json()) as { storageId: Id<"_storage"> };
    await attachReceiptStaff({
      bookingId,
      storageId: json.storageId,
      fileName: file.name,
    });
  }

  return (
    <div>
      <PageHeader kicker={t("bookings.kicker")} title={t("bookings.title")} lead={t("bookings.lead")} />
      <GoldRule />
      <div className="mt-6 flex flex-wrap gap-2">
        {BOOKING_FILTERS.map((value) => (
          <FilterChip key={value} active={filter === value} onClick={() => setFilter(value)}>
            {value === "all" ? t("bookings.all") : t(`bookingStatus.${value}`)}
          </FilterChip>
        ))}
      </div>
      <div className="mt-8 space-y-4">
        {(rows ?? []).map((booking) => (
          <article key={booking._id} className="admin-card p-5">
            <div className="flex flex-col justify-between gap-4 lg:flex-row">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-xs tracking-[0.14em] text-[var(--sand)] uppercase" dir="ltr">
                    {booking.bookingNumber}
                  </p>
                  <StatusBadge kind="booking" value={booking.status} />
                  {booking.payment ? (
                    <StatusBadge kind="payment" value={booking.payment.status} />
                  ) : null}
                </div>
                <h2 className="font-display mt-2 text-2xl break-words">{booking.customerName}</h2>
                <p className="mt-1" dir="ltr">
                  {booking.customerPhone}
                </p>
                {booking.customerEmail ? (
                  <p className="mt-1 text-sm text-[var(--ivory-dim)]" dir="ltr">
                    {booking.customerEmail}
                  </p>
                ) : null}
                <p className="mt-3 text-sm">
                  {t("bookings.vehicle", { stock: booking.vehicleStockCode })} ·{" "}
                  {locale === "ar" ? booking.vehicleTitleAr : booking.vehicleTitleEn}
                </p>
                <p className="mt-1 text-sm text-[var(--ivory-dim)]">
                  {t("bookings.deposit")}: {formatOmr(booking.depositOmr, locale)} ·{" "}
                  {t("bookings.durationDays", { days: booking.durationDays })} ·{" "}
                  {t("bookings.method")}: {t(`paymentMethod.${booking.paymentMethod}`)}
                </p>
                <p className="mt-1 text-xs text-[var(--ivory-dim)]">
                  <DeskTime value={booking.startsAt} /> → <DeskTime value={booking.endsAt} />
                </p>
                {booking.notes ? (
                  <p className="mt-2 break-words text-sm text-[var(--ivory-dim)]">{booking.notes}</p>
                ) : null}
                {booking.payment?.refundNotes ? (
                  <p className="mt-2 text-sm text-[#f2c4c6]">
                    {t("bookings.refundLog")}: {booking.payment.refundNotes}
                  </p>
                ) : null}
                {booking.payment?.receiptUrl ? (
                  <a
                    href={booking.payment.receiptUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex text-sm text-[var(--sand)] underline"
                  >
                    {booking.payment.receiptFileName ?? t("bookings.receipt")}
                  </a>
                ) : null}
              </div>
              <div className="flex min-w-52 flex-col gap-2">
                {booking.status === "reserved" ? (
                  <AdminButton variant="primary" onClick={() => void approve({ bookingId: booking._id })}>
                    {t("bookings.approve")}
                  </AdminButton>
                ) : null}
                {booking.status === "reserved" || booking.status === "booked" ? (
                  <>
                    <label className="text-sm">
                      <span className="mb-1 block text-[var(--ivory-dim)]">{t("bookings.extend")}</span>
                      <select
                        className="admin-field"
                        defaultValue=""
                        onChange={(event) => {
                          const extraDays = Number(event.target.value) as 3 | 7 | 14;
                          if (!extraDays) {
                            return;
                          }
                          void extend({ bookingId: booking._id, extraDays });
                          event.target.value = "";
                        }}
                      >
                        <option value="">{t("bookings.extendChoose")}</option>
                        {EXTEND_DAYS.map((days) => (
                          <option key={days} value={days}>
                            {t("bookings.durationDays", { days })}
                          </option>
                        ))}
                      </select>
                    </label>
                    <AdminButton
                      variant="danger"
                      onClick={() => void onCancel(booking._id, booking.bookingNumber)}
                    >
                      {t("bookings.cancel")}
                    </AdminButton>
                  </>
                ) : null}
                {booking.payment && booking.payment.status === "pending" ? (
                  <AdminButton
                    onClick={() =>
                      void setPaymentStatus({ bookingId: booking._id, status: "paid" })
                    }
                  >
                    {t("bookings.markPaid")}
                  </AdminButton>
                ) : null}
                {booking.payment &&
                (booking.payment.status === "paid" || booking.payment.status === "pending") ? (
                  <AdminButton onClick={() => void onRefund(booking._id, booking.bookingNumber)}>
                    {t("bookings.refund")}
                  </AdminButton>
                ) : null}
                <label className="text-sm">
                  <span className="mb-1 block text-[var(--ivory-dim)]">{t("bookings.receipt")}</span>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="admin-field"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) {
                        void onReceipt(booking._id, file);
                      }
                      event.target.value = "";
                    }}
                  />
                </label>
              </div>
            </div>
          </article>
        ))}
        {rows?.length === 0 ? (
          <EmptyState title={t("bookings.empty")} body={t("bookings.lead")} />
        ) : null}
      </div>
    </div>
  );
}
