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

type StaffInquiry = {
  _id: Id<"inquiries">;
  name: string;
  phone: string;
  subject: string;
  message: string;
  locale: "ar" | "en";
  source: "web_form" | "consignment" | "waagents";
  status: "new" | "in_progress" | "closed";
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

  async function closeInquiry(inquiryId: Id<"inquiries">) {
    await setStatus({ inquiryId, status: "closed" });
  }

  async function reopenInquiry(inquiryId: Id<"inquiries">) {
    await setStatus({ inquiryId, status: "new" });
  }

  async function deleteInquiry(inquiry: StaffInquiry) {
    const ok = await confirm({
      title: t("confirm.deleteInquiryTitle"),
      message: t("confirm.deleteInquiry", { name: inquiry.name }),
      confirmLabel: t("inquiries.delete"),
      cancelLabel: t("confirm.cancel"),
      tone: "danger",
    });
    if (!ok) {
      return;
    }
    await remove({ inquiryId: inquiry._id });
  }

  return (
    <div>
      <PageHeader kicker={t("inquiries.kicker")} title={t("inquiries.title")} lead={t("inquiries.lead")} />
      <GoldRule />
      <div className="mt-8 space-y-4">
        {(open ?? []).map((inquiry) => (
          <InquiryCard
            key={inquiry._id}
            inquiry={inquiry}
            locale={locale}
            onInProgress={() => void setStatus({ inquiryId: inquiry._id, status: "in_progress" })}
            onClose={() => void closeInquiry(inquiry._id)}
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
                closed
                onReopen={() => void reopenInquiry(inquiry._id)}
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
  closed = false,
  onInProgress,
  onClose,
  onReopen,
  onDelete,
}: {
  inquiry: StaffInquiry;
  locale: string;
  closed?: boolean;
  onInProgress?: () => void;
  onClose?: () => void;
  onReopen?: () => void;
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
          </div>
          <h2 className="font-display mt-2 text-2xl break-words">{inquiry.name}</h2>
          <p className="mt-1 break-words" dir="ltr">
            {inquiry.phone}
          </p>
          <p className="mt-3 break-words font-medium">{inquiry.subject}</p>
          <p className="mt-2 break-words text-[var(--ivory-dim)] text-pretty">{inquiry.message}</p>
          <p className="mt-3 text-xs text-[var(--ivory-dim)]">
            <DeskTime value={inquiry.createdAt} />
            {inquiry.vehicleStockCode
              ? ` · ${t("inquiries.vehicle", { stock: inquiry.vehicleStockCode })}`
              : ""}
            {vehicleTitle ? ` · ${vehicleTitle}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {closed ? (
            <AdminButton onClick={onReopen}>{t("inquiries.reopen")}</AdminButton>
          ) : (
            <>
              {inquiry.status !== "in_progress" ? (
                <AdminButton onClick={onInProgress}>{t("inquiries.inProgress")}</AdminButton>
              ) : null}
              <AdminButton onClick={onClose}>{t("inquiries.close")}</AdminButton>
            </>
          )}
          <AdminButton variant="danger" onClick={onDelete}>
            {t("inquiries.delete")}
          </AdminButton>
        </div>
      </div>
    </article>
  );
}
