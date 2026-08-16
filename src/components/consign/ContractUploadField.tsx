"use client";

import { useId, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { FieldLabel } from "@/components/forms/FieldLabel";

const ACCEPT =
  "application/pdf,image/jpeg,image/png,image/webp,image/heic,image/heif,.pdf,.jpg,.jpeg,.png,.webp,.heic,.heif";

export function ContractUploadField({
  file,
  onFileChange,
}: {
  file: File | null;
  onFileChange: (file: File | null) => void;
}) {
  const t = useTranslations("Consign");
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  function clearInput() {
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function applyFile(next: File | null) {
    onFileChange(next);
    if (!next) {
      clearInput();
    }
  }

  return (
    <div className="md:col-span-2 min-w-0 text-sm">
      <FieldLabel label={t("uploadLabel")} />
      <p className="mb-3 text-xs leading-6 text-gray-400">{t("uploadHint")}</p>
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragOver(false);
          const dropped = event.dataTransfer.files[0];
          if (dropped) {
            applyFile(dropped);
          }
        }}
        data-active={dragOver ? "true" : "false"}
        className="rounded-sm border-2 border-dashed border-[var(--sand)] bg-[var(--sand)]/10 p-4 transition-colors data-[active=true]:border-[var(--crimson)] data-[active=true]:bg-[var(--crimson)]/15 sm:p-5"
      >
        <input
          ref={inputRef}
          id={inputId}
          name="contract"
          type="file"
          accept={ACCEPT}
          className="sr-only"
          onChange={(event) => applyFile(event.target.files?.[0] ?? null)}
        />
        {file ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="min-w-0 text-sm break-all text-[var(--sand-bright)]">
              {t("selectedFile", { name: file.name })}
            </p>
            <div className="flex flex-wrap gap-2">
              <label
                htmlFor={inputId}
                className="inline-flex min-h-12 cursor-pointer items-center justify-center border border-[var(--sand)] px-4 py-2 text-sm font-bold text-[var(--sand-bright)]"
              >
                {t("replaceFile")}
              </label>
              <button
                type="button"
                onClick={() => applyFile(null)}
                className="inline-flex min-h-12 items-center justify-center border border-[var(--crimson)] px-4 py-2 text-sm font-bold text-white"
              >
                {t("removeFile")}
              </button>
            </div>
          </div>
        ) : (
          <label
            htmlFor={inputId}
            className="flex cursor-pointer flex-col items-center gap-3 py-4 text-center"
          >
            <span className="inline-flex min-h-12 items-center justify-center gap-2 bg-[var(--crimson)] px-6 py-3 font-bold text-white">
              <UploadIcon />
              {t("attachAction")}
            </span>
            <span className="text-xs leading-6 text-gray-400">{t("dropHint")}</span>
          </label>
        )}
      </div>
    </div>
  );
}

function UploadIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="size-5 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M12 16V4m0 0 4 4m-4-4-4 4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" strokeLinecap="round" />
    </svg>
  );
}
