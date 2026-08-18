"use client";

import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import {
  forwardRef,
  useEffect,
  useRef,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";

export const staffInventoryStatuses = [
  "new",
  "under_review",
  "inspection_scheduled",
  "under_inspection",
  "awaiting_contract",
  "approved",
  "not_accepted",
  "approved_for_publishing",
  "published",
  "reserved",
  "booked",
  "sold",
  "withdrawn",
  "expired",
] as const;

export type StaffInventoryStatus = (typeof staffInventoryStatuses)[number];

export function parseStaffInventoryStatus(value: string | null): StaffInventoryStatus | undefined {
  return staffInventoryStatuses.find((status) => status === value);
}

export function staffInventoryPath(status?: string | null) {
  const valid = parseStaffInventoryStatus(status ?? null);
  return valid ? `/admin/inventory?status=${valid}` : "/admin/inventory";
}

export function staffVehiclePath(vehicleId: string, status?: string | null) {
  const valid = parseStaffInventoryStatus(status ?? null);
  return valid
    ? `/admin/inventory/${vehicleId}?status=${valid}`
    : `/admin/inventory/${vehicleId}`;
}

export function staffNewVehiclePath(status?: string | null) {
  const valid = parseStaffInventoryStatus(status ?? null);
  return valid ? `/admin/inventory/new?status=${valid}` : "/admin/inventory/new";
}

export function PageHeader({
  kicker,
  title,
  lead,
  actions,
  back,
}: {
  kicker?: string;
  title: string;
  lead?: string;
  actions?: ReactNode;
  back?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-5">
      {back ? <div>{back}</div> : null}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {kicker ? <p className="admin-kicker">{kicker}</p> : null}
          <h1 className="admin-title font-display mt-2 text-3xl text-pretty sm:text-4xl">{title}</h1>
          {lead ? <p className="mt-2 max-w-2xl text-sm text-[var(--ivory-dim)] text-pretty">{lead}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}

export function GoldRule({ className = "mt-6" }: { className?: string }) {
  return <div className={`gold-rule ${className}`} aria-hidden="true" />;
}

export function DeskCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={`admin-card p-5 sm:p-6 ${className}`}>{children}</section>;
}

export function DeskSection({
  kicker,
  title,
  action,
  children,
}: {
  kicker?: string;
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <DeskCard>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          {kicker ? <p className="admin-kicker">{kicker}</p> : null}
          <h2 className="font-display mt-1 text-xl text-pretty sm:text-2xl">{title}</h2>
        </div>
        {action}
      </div>
      <div className="mt-5">{children}</div>
    </DeskCard>
  );
}

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

const buttonVariants: Record<ButtonVariant, string> = {
  primary: "admin-btn admin-btn-primary",
  secondary: "admin-btn admin-btn-secondary",
  danger: "admin-btn admin-btn-danger",
  ghost: "admin-btn admin-btn-ghost",
};

export const AdminButton = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
    href?: string;
    children: ReactNode;
  }
>(function AdminButton(
  { variant = "secondary", href, className = "", children, ...props },
  ref,
) {
  const classes = `${buttonVariants[variant]} ${className}`;
  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }
  return (
    <button ref={ref} className={classes} {...props} type={props.type ?? "button"}>
      {children}
    </button>
  );
});
AdminButton.displayName = "AdminButton";

const vehicleStatusTone: Record<string, string> = {
  new: "border-[var(--crimson)]/60 bg-[var(--crimson)]/15 text-[#f2c4c6]",
  under_review: "border-[var(--crimson)]/60 bg-[var(--crimson)]/15 text-[#f2c4c6]",
  inspection_scheduled: "border-[var(--sand)]/50 bg-[var(--sand)]/12 text-[var(--sand-bright)]",
  under_inspection: "border-[var(--sand)]/50 bg-[var(--sand)]/12 text-[var(--sand-bright)]",
  awaiting_contract: "border-[var(--sand)]/50 bg-[var(--sand)]/12 text-[var(--sand-bright)]",
  approved: "border-[var(--line)] text-[var(--ivory-dim)]",
  not_accepted: "border-[var(--crimson)]/45 text-[#f2c4c6]",
  approved_for_publishing: "border-[var(--sand)]/50 bg-[var(--sand)]/12 text-[var(--sand-bright)]",
  published: "border-[var(--sand)]/50 bg-[var(--sand)]/12 text-[var(--sand-bright)]",
  reserved: "border-[var(--sand)]/35 text-[var(--sand)]",
  booked: "border-[var(--sand)]/35 text-[var(--sand)]",
  sold: "border-[var(--sand)]/35 text-[var(--sand)]",
  withdrawn: "border-[var(--line)] text-[var(--ivory-dim)]",
  expired: "border-[var(--line)] text-[var(--ivory-dim)]",
};

const inquiryStatusTone: Record<string, string> = {
  new: "border-[var(--crimson)]/60 bg-[var(--crimson)]/15 text-[#f2c4c6]",
  contacted: "border-[var(--sand)]/50 bg-[var(--sand)]/12 text-[var(--sand-bright)]",
  viewing_scheduled: "border-[var(--sand)]/50 bg-[var(--sand)]/12 text-[var(--sand-bright)]",
  negotiating: "border-[var(--sand)]/50 bg-[var(--sand)]/12 text-[var(--sand-bright)]",
  booked: "border-[var(--sand)]/35 text-[var(--sand)]",
  sold: "border-[var(--sand)]/35 text-[var(--sand)]",
  closed: "border-[var(--line)] text-[var(--ivory-dim)]",
  in_progress: "border-[var(--sand)]/50 bg-[var(--sand)]/12 text-[var(--sand-bright)]",
};

const bookingStatusTone: Record<string, string> = {
  reserved: "border-[var(--sand)]/50 bg-[var(--sand)]/12 text-[var(--sand-bright)]",
  booked: "border-[var(--sand)]/35 text-[var(--sand)]",
  cancelled: "border-[var(--crimson)]/45 text-[#f2c4c6]",
  expired: "border-[var(--line)] text-[var(--ivory-dim)]",
};

const paymentStatusTone: Record<string, string> = {
  pending: "border-[var(--crimson)]/60 bg-[var(--crimson)]/15 text-[#f2c4c6]",
  paid: "border-[var(--sand)]/50 bg-[var(--sand)]/12 text-[var(--sand-bright)]",
  failed: "border-[var(--crimson)]/45 text-[#f2c4c6]",
  cancelled: "border-[var(--line)] text-[var(--ivory-dim)]",
  refunded: "border-[var(--line)] text-[var(--ivory-dim)]",
};

export function StatusBadge({
  value,
  kind = "vehicle",
}: {
  value: string;
  kind?: "vehicle" | "inquiry" | "booking" | "payment";
}) {
  const t = useTranslations("Admin");
  const label =
    kind === "inquiry"
      ? t(`inquiryStatus.${value}`)
      : kind === "booking"
        ? t(`bookingStatus.${value}`)
        : kind === "payment"
          ? t(`paymentStatus.${value}`)
          : t(`status.${value}`);
  const tone =
    kind === "inquiry"
      ? inquiryStatusTone[value]
      : kind === "booking"
        ? bookingStatusTone[value]
        : kind === "payment"
          ? paymentStatusTone[value]
          : vehicleStatusTone[value];
  return (
    <span
      className={`inline-flex min-h-7 items-center border px-2 text-[11px] tracking-[0.12em] uppercase ${tone ?? "border-[var(--line)]"}`}
    >
      {label}
    </span>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="admin-empty">
      <p className="font-display text-xl text-pretty">{title}</p>
      {body ? <p className="mx-auto mt-2 max-w-md text-sm text-[var(--ivory-dim)] text-pretty">{body}</p> : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function DeskTime({ value }: { value: number }) {
  const locale = useLocale();
  const formatted = new Intl.DateTimeFormat(locale === "ar" ? "ar-OM" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);

  return (
    <time dateTime={new Date(value).toISOString()} suppressHydrationWarning>
      {formatted}
    </time>
  );
}

export function formatOmr(value: number, locale: string) {
  return new Intl.NumberFormat(locale === "ar" ? "ar-OM" : "en-OM", {
    maximumFractionDigits: 0,
  }).format(value);
}

export function AdminField({
  name,
  label,
  type = "text",
  defaultValue,
  value,
  onChange,
  required,
  className = "",
  dir,
  autoComplete,
  spellCheck,
  inputMode,
  minLength,
  placeholder,
}: {
  name: string;
  label: string;
  type?: string;
  defaultValue?: string | number;
  value?: string;
  onChange?: (value: string) => void;
  required?: boolean;
  className?: string;
  dir?: "rtl" | "ltr";
  autoComplete?: string;
  spellCheck?: boolean;
  inputMode?: "email" | "tel" | "numeric" | "text";
  minLength?: number;
  placeholder?: string;
}) {
  return (
    <label className={`min-w-0 text-sm ${className}`}>
      <span className="mb-2 block text-[var(--ivory-dim)]">{label}</span>
      <input
        name={name}
        type={type}
        defaultValue={value === undefined ? defaultValue : undefined}
        value={value}
        onChange={onChange ? (event) => onChange(event.target.value) : undefined}
        required={required}
        dir={dir}
        autoComplete={autoComplete ?? "off"}
        spellCheck={spellCheck}
        inputMode={inputMode}
        minLength={minLength}
        placeholder={placeholder}
        className="admin-field"
      />
    </label>
  );
}

export function AdminTextarea({
  name,
  label,
  defaultValue,
  dir,
  className = "",
}: {
  name: string;
  label: string;
  defaultValue?: string;
  dir?: "rtl" | "ltr";
  className?: string;
}) {
  return (
    <label className={`min-w-0 text-sm md:col-span-2 ${className}`}>
      <span className="mb-2 block text-[var(--ivory-dim)]">{label}</span>
      <textarea name={name} defaultValue={defaultValue} dir={dir} rows={4} className="admin-field" autoComplete="off" />
    </label>
  );
}

export function AdminSelect({
  name,
  label,
  defaultValue,
  options,
  formatLabel,
  className = "",
  id,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  options: string[];
  formatLabel: (value: string) => string;
  className?: string;
  id?: string;
}) {
  return (
    <label className={`min-w-0 text-sm ${className}`}>
      <span className="mb-2 block text-[var(--ivory-dim)]">{label}</span>
      <select
        id={id}
        name={name}
        defaultValue={defaultValue}
        className="admin-field"
        autoComplete="off"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {formatLabel(option)}
          </option>
        ))}
      </select>
    </label>
  );
}

export function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`admin-btn shrink-0 px-3 py-2 ${
        active ? "admin-btn-primary" : "admin-btn-secondary"
      }`}
    >
      {children}
    </button>
  );
}

export function AdminCheckbox({
  checked,
  indeterminate = false,
  onChange,
  label,
  className = "",
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <label className={`inline-flex min-h-11 min-w-11 shrink-0 cursor-pointer items-center justify-center ${className}`}>
      <input
        ref={inputRef}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="admin-check"
        aria-label={label}
      />
    </label>
  );
}
