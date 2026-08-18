import { getTranslations } from "next-intl/server";

const careKeys = ["dust", "polish", "engine", "parking"] as const;
const marketingKeys = ["session", "social", "campaigns", "display"] as const;
const salesKeys = ["calls", "screening", "testdrive", "negotiate", "finance"] as const;
const clearanceKeys = ["transfer", "insurance", "payout"] as const;
const compareRows = ["cleaning", "marketing", "clearance", "parking"] as const;

export async function ConsignmentPackage() {
  const t = await getTranslations("Consign");

  return (
    <div className="space-y-10">
      <section className="grid gap-4 md:grid-cols-2">
        <Pillar title={t("care.title")} items={careKeys.map((key) => t(`care.${key}`))} />
        <Pillar
          title={t("marketing.title")}
          items={marketingKeys.map((key) => t(`marketing.${key}`))}
        />
        <Pillar title={t("sales.title")} items={salesKeys.map((key) => t(`sales.${key}`))} />
        <Pillar
          title={t("clearance.title")}
          items={clearanceKeys.map((key) => t(`clearance.${key}`))}
        />
      </section>

      <section className="border border-[var(--line)] bg-[var(--ink-soft)] p-5 sm:p-7">
        <h2 className="font-display text-2xl sm:text-3xl">{t("compare.title")}</h2>
        <p className="mt-2 text-sm text-[var(--ivory-dim)]">{t("compare.lead")}</p>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[36rem] border-collapse text-start text-sm">
            <thead>
              <tr className="border-b border-[var(--sand)]/40 text-[var(--sand)]">
                <th className="px-3 py-3 font-semibold">{t("compare.service")}</th>
                <th className="px-3 py-3 font-semibold">{t("compare.market")}</th>
                <th className="px-3 py-3 font-semibold">{t("compare.package")}</th>
              </tr>
            </thead>
            <tbody>
              {compareRows.map((row) => (
                <tr key={row} className="border-b border-[var(--line)]">
                  <td className="px-3 py-3 text-gray-200">{t(`compare.${row}`)}</td>
                  <td className="px-3 py-3 text-gray-400">{t(`compare.${row}Market`)}</td>
                  <td className="px-3 py-3 text-[var(--sand-bright)]">{t(`compare.${row}Package`)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="border border-[var(--line)] p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500">{t("compare.totalLabel")}</p>
            <p className="mt-2 text-lg text-gray-300">{t("compare.totalMarket")}</p>
          </div>
          <div className="border border-[var(--sand)] bg-[var(--sand)]/10 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--sand)]">{t("compare.packagePriceLabel")}</p>
            <p className="mt-2 font-display text-2xl text-[var(--sand-bright)]">{t("compare.packagePrice")}</p>
          </div>
        </div>
      </section>
    </div>
  );
}

function Pillar({ title, items }: { title: string; items: string[] }) {
  return (
    <article className="service-card border border-[var(--line)] bg-[var(--ink)] p-5 sm:p-6">
      <h3 className="font-display text-xl text-[var(--sand)] sm:text-2xl">{title}</h3>
      <ul className="mt-4 space-y-2 text-sm leading-7 text-gray-300">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[var(--sand)]" aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}
