"use client";

import { formatOmr } from "@/components/admin/ui";

export function SparkBars({
  title,
  hint,
  points,
  locale,
}: {
  title: string;
  hint: string;
  points: Array<{ day: string; count: number }>;
  locale: string;
}) {
  const max = Math.max(...points.map((point) => point.count), 1);
  return (
    <section className="admin-card admin-reveal p-5 sm:p-6">
      <p className="admin-kicker">{hint}</p>
      <h2 className="font-display mt-1 text-xl">{title}</h2>
      <div className="mt-6 flex h-36 items-end gap-1.5">
        {points.map((point) => {
          const height = Math.max(6, Math.round((point.count / max) * 100));
          const label = new Date(`${point.day}T00:00:00Z`).toLocaleDateString(
            locale === "ar" ? "ar-OM" : "en-GB",
            { day: "numeric", month: "short" },
          );
          return (
            <div key={point.day} className="flex min-w-0 flex-1 flex-col items-center gap-2">
              <span className="text-[10px] tabular-nums text-[var(--sand-bright)]">{point.count}</span>
              <span
                className="w-full bg-[var(--sand)]"
                style={{ height: `${height}%` }}
                title={`${label}: ${point.count}`}
              />
              <span className="hidden text-[9px] tracking-wide text-[var(--ivory-dim)] uppercase sm:block">
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function ShareBars({
  title,
  hint,
  rows,
}: {
  title: string;
  hint: string;
  rows: Array<{ key: string; label: string; count: number }>;
}) {
  const max = Math.max(...rows.map((row) => row.count), 1);
  return (
    <section className="admin-card admin-reveal p-5 sm:p-6">
      <p className="admin-kicker">{hint}</p>
      <h2 className="font-display mt-1 text-xl">{title}</h2>
      {rows.length === 0 ? (
        <p className="mt-6 text-sm text-[var(--ivory-dim)]">—</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {rows.map((row) => (
            <li key={row.key} className="grid grid-cols-[minmax(0,7rem)_minmax(0,1fr)_2rem] items-center gap-3">
              <span className="truncate text-sm text-[var(--ivory-dim)]">{row.label}</span>
              <span className="admin-ledger-track" aria-hidden="true">
                <span
                  className="admin-ledger-fill block h-full"
                  style={{ width: `${Math.max(8, Math.round((row.count / max) * 100))}%` }}
                />
              </span>
              <span className="text-end font-display tabular-nums text-[var(--sand-bright)]">{row.count}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function FunnelStrip({
  title,
  hint,
  steps,
}: {
  title: string;
  hint: string;
  steps: Array<{ label: string; value: number }>;
}) {
  const max = Math.max(...steps.map((step) => step.value), 1);
  return (
    <section className="admin-card admin-reveal p-5 sm:p-6">
      <p className="admin-kicker">{hint}</p>
      <h2 className="font-display mt-1 text-xl">{title}</h2>
      <div className="mt-6 grid gap-3 sm:grid-cols-4">
        {steps.map((step) => (
          <div key={step.label} className="border border-[var(--line)] px-4 py-3">
            <p className="text-[11px] tracking-[0.16em] text-[var(--ivory-dim)] uppercase">{step.label}</p>
            <p className="font-display mt-2 text-3xl tabular-nums text-[var(--sand-bright)]">{step.value}</p>
            <span className="admin-ledger-track mt-3 block h-1.5">
              <span
                className="admin-ledger-fill block h-full"
                style={{ width: `${Math.max(10, Math.round((step.value / max) * 100))}%` }}
              />
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function ValuePlate({
  label,
  hint,
  value,
  locale,
}: {
  label: string;
  hint: string;
  value: number;
  locale: string;
}) {
  return (
    <div className="admin-card admin-reveal admin-plate p-5">
      <p className="text-xs tracking-[0.16em] text-[var(--ivory-dim)] uppercase">{label}</p>
      <p className="font-display mt-3 text-4xl tabular-nums text-[var(--sand-bright)]">
        {formatOmr(value, locale)}
      </p>
      <p className="mt-2 text-sm text-[var(--ivory-dim)]">{hint}</p>
    </div>
  );
}
