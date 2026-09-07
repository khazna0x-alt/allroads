"use client";

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
    <section className="admin-card admin-reveal p-3.5 sm:p-4">
      <p className="admin-kicker">{hint}</p>
      <h2 className="font-display mt-0.5 text-lg">{title}</h2>
      <div className="mt-3 flex h-20 items-end gap-1">
        {points.map((point) => {
          const height = Math.max(6, Math.round((point.count / max) * 100));
          const label = new Date(`${point.day}T00:00:00Z`).toLocaleDateString(
            locale === "ar" ? "ar-OM" : "en-GB",
            { day: "numeric", month: "short" },
          );
          return (
            <div key={point.day} className="flex min-w-0 flex-1 flex-col items-center gap-1">
              <span className="text-[9px] tabular-nums text-[var(--sand-bright)]">{point.count}</span>
              <span
                className="w-full bg-[var(--sand)]"
                style={{ height: `${height}%` }}
                title={`${label}: ${point.count}`}
              />
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
    <section className="admin-card admin-reveal p-3.5 sm:p-4">
      <p className="admin-kicker">{hint}</p>
      <h2 className="font-display mt-0.5 text-lg">{title}</h2>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-[var(--ivory-dim)]">—</p>
      ) : (
        <ul className="mt-3 space-y-1.5">
          {rows.map((row) => (
            <li key={row.key} className="grid grid-cols-[minmax(0,6.5rem)_minmax(0,1fr)_1.75rem] items-center gap-2">
              <span className="truncate text-xs text-[var(--ivory-dim)]">{row.label}</span>
              <span className="admin-ledger-track" aria-hidden="true">
                <span
                  className="admin-ledger-fill block h-full"
                  style={{ width: `${Math.max(8, Math.round((row.count / max) * 100))}%` }}
                />
              </span>
              <span className="text-end font-display text-sm tabular-nums text-[var(--sand-bright)]">
                {row.count}
              </span>
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
    <section className="admin-card admin-reveal p-3.5 sm:p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-lg">{title}</h2>
        <p className="text-xs text-[var(--ivory-dim)]">{hint}</p>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {steps.map((step) => (
          <div key={step.label} className="border border-[var(--line)] px-3 py-2">
            <p className="text-[10px] tracking-[0.14em] text-[var(--ivory-dim)] uppercase">{step.label}</p>
            <p className="font-display mt-1 text-2xl tabular-nums text-[var(--sand-bright)]">{step.value}</p>
            <span className="admin-ledger-track mt-2 block h-1">
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
