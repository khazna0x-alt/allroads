"use client";

import { useMutation, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import * as XLSX from "xlsx";
import { AdminButton, AdminSelect, DeskCard, GoldRule, PageHeader } from "@/components/admin/ui";
import { api } from "@/lib/convex";
import {
  SHOWROOM_HEADERS,
  SHOWROOM_INSTRUCTIONS,
  SHOWROOM_TEMPLATE_ROWS,
  parseInventorySheet,
  toShowroomExportRow,
  type ImportVehicleRow,
} from "@/lib/inventoryImport";

export default function ImportPage() {
  const t = useTranslations("Admin.import");
  const rows = useQuery(api.importExport.exportVehicles);
  const importVehicles = useMutation(api.importExport.importVehicles);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  function exportWorkbook() {
    const sheet = XLSX.utils.json_to_sheet(rows ?? []);
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, "inventory");
    XLSX.writeFile(book, "all-roads-inventory.xlsx");
  }

  function exportShowroomWorkbook() {
    const sheetRows = (rows ?? []).map((vehicle) => toShowroomExportRow(vehicle));
    const sheet = XLSX.utils.json_to_sheet(sheetRows, { header: [...SHOWROOM_HEADERS] });
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, "Showroom");
    XLSX.writeFile(book, "all-roads-showroom.xlsx");
  }

  function downloadTemplate() {
    const showroom = XLSX.utils.json_to_sheet(SHOWROOM_TEMPLATE_ROWS, {
      header: [...SHOWROOM_HEADERS],
    });
    const instructions = XLSX.utils.json_to_sheet(SHOWROOM_INSTRUCTIONS);
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, showroom, "Showroom");
    XLSX.utils.book_append_sheet(book, instructions, "Instructions");
    XLSX.writeFile(book, "all-roads-inventory-template.xlsx");
  }

  async function onFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    setBusy(true);
    setMessage("");
    setErrors([]);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { raw: true });
      const first = workbook.SheetNames.find((name) => name.toLowerCase() !== "instructions");
      if (!first) {
        setMessage(t("noRows"));
        return;
      }
      const sheet = workbook.Sheets[first];
      if (!sheet) {
        setMessage(t("noRows"));
        return;
      }
      const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
        defval: "",
        raw: true,
      });
      const parsed = parseInventorySheet(json);
      if (parsed.rows.length === 0) {
        setErrors(parsed.errors);
        setMessage(t("noRows"));
        return;
      }

      const strategy = (document.getElementById("missing") as HTMLSelectElement | null)?.value;
      const result = await importVehicles({
        rows: parsed.rows.map(toMutationRow),
        missingStrategy: strategy === "sold" || strategy === "hidden" ? strategy : "keep",
      });
      setErrors(parsed.errors);
      setMessage(
        t("result", {
          upserted: result.upserted,
          marked: result.marked,
          skipped: parsed.skippedEmpty,
          format: parsed.format === "showroom" ? t("showroomFormat") : t("fullFormat"),
        }),
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t("failed"));
    } finally {
      setBusy(false);
      event.target.value = "";
    }
  }

  return (
    <div>
      <PageHeader kicker={t("kicker")} title={t("title")} lead={t("lead")} />
      <GoldRule />
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <DeskCard>
          <h2 className="font-display text-xl">{t("export")}</h2>
          <p className="mt-2 text-sm text-[var(--ivory-dim)]">{t("exportHint")}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <AdminButton type="button" variant="primary" onClick={exportWorkbook}>
              {t("export")}
            </AdminButton>
            <AdminButton type="button" onClick={exportShowroomWorkbook}>
              {t("exportShowroom")}
            </AdminButton>
          </div>
        </DeskCard>
        <DeskCard>
          <h2 className="font-display text-xl">{t("importFile")}</h2>
          <p className="mt-2 text-sm text-[var(--ivory-dim)]">{t("importHint")}</p>
          <AdminSelect
            id="missing"
            name="missing"
            label={t("missingLabel")}
            defaultValue="keep"
            className="mt-5 block"
            options={["keep", "hidden", "sold"]}
            formatLabel={(value) => t(value)}
          />
          <div className="mt-4 flex flex-wrap gap-3">
            <AdminButton type="button" onClick={downloadTemplate}>
              {t("downloadTemplate")}
            </AdminButton>
            <label className="admin-btn admin-btn-secondary cursor-pointer">
              {busy ? t("importing") : t("importFile")}
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                className="sr-only"
                disabled={busy}
                onChange={(event) => void onFile(event)}
              />
            </label>
          </div>
        </DeskCard>
      </div>
      {message ? (
        <p className="mt-6 border border-[var(--sand)] bg-[var(--sand)]/8 px-4 py-3 text-sm" aria-live="polite">
          {message}
        </p>
      ) : null}
      {errors.length > 0 ? (
        <ul className="mt-4 space-y-1 border border-[var(--omani-red)]/30 bg-[var(--omani-red)]/8 px-4 py-3 text-sm">
          {errors.slice(0, 12).map((error) => (
            <li key={error}>{error}</li>
          ))}
          {errors.length > 12 ? <li>{t("moreErrors", { count: errors.length - 12 })}</li> : null}
        </ul>
      ) : null}
    </div>
  );
}

function toMutationRow(row: ImportVehicleRow) {
  const payload: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    if (value !== undefined) {
      payload[key] = value;
    }
  }
  return payload as ImportVehicleRow;
}
