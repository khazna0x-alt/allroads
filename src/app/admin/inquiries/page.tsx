"use client";

import { useMutation, useQuery } from "convex/react";
import { useLocale, useTranslations } from "next-intl";
import {
  AdminButton,
  DeskTime,
  EmptyState,
  GoldRule,
  PageHeader,
  StatusBadge,
} from "@/components/admin/ui";
import { useConfirmDialog } from "@/components/admin/ConfirmDialog";
import { api, type Id } from "@/lib/convex";

const INQUIRY_STATUSES = [
  "new",
  "contacted",
  "viewing_scheduled",
  "negotiating",
  "booked",
  "sold",
  "closed",
  "in_progress",
] as const;

type StaffInquiry = {
  _id: Id<"inquiries">;
  name: string;
  phone: string;
  email?: string;
  subject: string;
  message: string;
  locale: "ar" | "en";
  source: "web_form" | "consignment" | "waagents" | "whatsapp";
  status: (typeof INQUIRY_STATUSES)[number];
  preferredContact?: "phone" | "whatsapp" | "email";
  viewingRequested: boolean;
  handoffReason?: string;
  createdAt: number;
  vehicleTitleEn?: string;
  vehicleTitleAr?: string;
  vehicleStockCode?: string;
};

export default function InquiriesPage() {
  const t = useTranslations("Admin");
  const locale = useLocale();
  const confirm = useConfirmDialog();
  const open = useQuery(api.inquiries.listStaff, {});
  const closed = useQuery(api.inquiries.listStaff, { status: "closed" });
  const setStatus = useMutation(api.inquiries.setStatus);
  const remove = useMutation(api.inquiries.remove);

  async function deleteInquiry(inquiry: StaffInquiry) {
    const result = await confirm({
      title: t("confirm.deleteInquiryTitle"),
      message: t("confirm.deleteInquiry", { name: inquiry.name }),
      confirmLabel: t("inquiries.delete"),
      cancelLabel: t("confirm.cancel"),
      tone: "danger",
    });
    if (!result.confirmed) {
      return;
    }
    await remove({ inquiryId: inquiry._id });
  }

  return (
    <div>
      <PageHeader kicker={t("inquiries.kicker")} title={t("inquiries.title")} lead={t("inquiries.lead")} />
      <GoldRule />
      <p className="mt-6 max-w-3xl border border-[var(--line)] px-4 py-3 text-sm text-[var(--ivory-dim)] text-pretty">
        {t("inquiries.botNote")}
      </p>
      <div className="mt-8 space-y-4">
        {(open ?? []).map((inquiry) => (
          <InquiryCard
            key={inquiry._id}
            inquiry={inquiry}
            locale={locale}
            onStatus={(status) => void setStatus({ inquiryId: inquiry._id, status })}
            onDelete={() => void deleteInquiry(inquiry)}
          />
        ))}
        {open?.length === 0 ? (
          <EmptyState title={t("inquiries.empty")} body={t("inquiries.lead")} />
        ) : null}
      </div>

      {(closed?.length ?? 0) > 0 ? (
        <details className="mt-12">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 border-b border-[var(--line)] pb-3 [&::-webkit-details-marker]:hidden">
            <div>
              <p className="admin-kicker">{t("inquiries.closedKicker")}</p>
              <h2 className="font-display mt-1 text-2xl">
                {t("inquiries.closedTitle", { count: closed?.length ?? 0 })}
              </h2>
            </div>
          </summary>
          <div className="mt-6 space-y-4">
            {(closed ?? []).map((inquiry) => (
              <InquiryCard
                key={inquiry._id}
                inquiry={inquiry}
                locale={locale}
                onStatus={(status) => void setStatus({ inquiryId: inquiry._id, status })}
                onDelete={() => void deleteInquiry(inquiry)}
              />
            ))}
          </div>
        </details>
      ) : null}
    </div>
  );
}

function InquiryCard({
  inquiry,
  locale,
  onStatus,
  onDelete,
}: {
  inquiry: StaffInquiry;
  locale: string;
  onStatus: (status: StaffInquiry["status"]) => void;
  onDelete: () => void;
}) {
  const t = useTranslations("Admin");
  const vehicleTitle = locale === "ar" ? inquiry.vehicleTitleAr : inquiry.vehicleTitleEn;

  return (
    <article className="admin-card p-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:flex-wrap">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs tracking-[0.14em] text-[var(--sand)] uppercase">
              {t(`inquirySource.${inquiry.source}`)}
            </p>
            <StatusBadge kind="inquiry" value={inquiry.status} />
            {inquiry.viewingRequested ? (
              <span className="border border-[var(--sand)]/40 px-2 py-0.5 text-[11px] tracking-[0.12em] uppercase text-[var(--sand)]">
                {t("inquiries.viewing")}
              </span>
            ) : null}
            {inquiry.handoffReason ? (
              <span className="border border-[var(--crimson)]/40 px-2 py-0.5 text-[11px] tracking-[0.12em] uppercase text-[var(--crimson)]">
                {t("inquiries.handoff")}
              </span>
            ) : null}
          </div>
          <h2 className="font-display mt-2 text-2xl break-words">{inquiry.name}</h2>
          <p className="mt-1 break-words" dir="ltr">
            {inquiry.phone}
          </p>
          {inquiry.email ? (
            <p className="mt-1 break-words text-sm text-[var(--ivory-dim)]" dir="ltr">
              {inquiry.email}
            </p>
          ) : null}
          {inquiry.preferredContact ? (
            <p className="mt-1 text-sm text-[var(--ivory-dim)]">
              {t("inquiries.preferred")}: {t(`preferredContact.${inquiry.preferredContact}`)}
            </p>
          ) : null}
          <p className="mt-3 break-words font-medium">{inquiry.subject}</p>
          <p className="mt-2 break-words text-[var(--ivory-dim)] text-pretty">{inquiry.message}</p>
          {inquiry.handoffReason ? (
            <p className="mt-2 text-sm text-[var(--sand)]">
              {t("inquiries.handoff")}: {inquiry.handoffReason}
            </p>
          ) : null}
          <p className="mt-3 text-xs text-[var(--ivory-dim)]">
            <DeskTime value={inquiry.createdAt} />
            {inquiry.vehicleStockCode
              ? ` · ${t("inquiries.vehicle", { stock: inquiry.vehicleStockCode })}`
              : ""}
            {vehicleTitle ? ` · ${vehicleTitle}` : ""}
          </p>
        </div>
        <div className="flex min-w-44 flex-col gap-2">
          <label className="text-sm">
            <span className="mb-1 block text-[var(--ivory-dim)]">{t("inquiries.status")}</span>
            <select
              className="admin-field"
              value={inquiry.status}
              onChange={(event) => onStatus(event.target.value as StaffInquiry["status"])}
            >
              {INQUIRY_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {t(`inquiryStatus.${status}`)}
                </option>
              ))}
            </select>
          </label>
          <AdminButton variant="danger" onClick={onDelete}>
            {t("inquiries.delete")}
          </AdminButton>
        </div>
      </div>
    </article>
  );
}
