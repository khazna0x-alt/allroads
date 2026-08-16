"use client";

import { useMutation } from "convex/react";
import { useTranslations } from "next-intl";
import { useId, useRef, useState } from "react";
import { api, type Id } from "@/lib/convex";
import {
  contentTypeForFile,
  isAllowedContractFile,
  MAX_CONTRACT_BYTES,
} from "@/lib/contractFile";

const ACCEPT =
  "application/pdf,image/jpeg,image/png,image/webp,image/heic,image/heif,.pdf,.jpg,.jpeg,.png,.webp,.heic,.heif";

export function ContractUploader({
  vehicleId,
  contractUrl,
  contractFileName,
}: {
  vehicleId: Id<"vehicles">;
  contractUrl?: string | null;
  contractFileName?: string;
}) {
  const t = useTranslations("Admin.consignments");
  const generateUploadUrl = useMutation(api.vehicles.generateContractUploadUrl);
  const attach = useMutation(api.vehicles.attachContract);
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function upload(file: File) {
    setError("");
    if (file.size > MAX_CONTRACT_BYTES) {
      setError(t("fileTooLarge"));
      return;
    }
    if (!isAllowedContractFile(file)) {
      setError(t("fileType"));
      return;
    }
    setBusy(true);
    try {
      const postUrl = await generateUploadUrl();
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": contentTypeForFile(file) },
        body: file,
      });
      if (!result.ok) {
        throw new Error(t("uploadFailed"));
      }
      const json = (await result.json()) as { storageId: Id<"_storage"> };
      await attach({
        vehicleId,
        storageId: json.storageId,
        fileName: file.name,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("uploadFailed"));
    } finally {
      if (inputRef.current) {
        inputRef.current.value = "";
      }
      setBusy(false);
    }
  }

  return (
    <div className="mt-4 space-y-3">
      {contractUrl ? (
        <a
          href={contractUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="admin-btn admin-btn-ghost"
        >
          {t("downloadContract")}
          {contractFileName ? ` · ${contractFileName}` : ""}
        </a>
      ) : (
        <p className="text-xs text-[var(--ivory-dim)]">{t("noContract")}</p>
      )}
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        disabled={busy}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            void upload(file);
          }
        }}
      />
      <label htmlFor={inputId} className="admin-btn admin-btn-secondary inline-flex cursor-pointer">
        {busy ? t("uploading") : contractUrl ? t("replaceContract") : t("uploadContract")}
      </label>
      {error ? (
        <p className="text-sm text-[#f2c4c6]" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function BlankConsignmentFormLink() {
  const t = useTranslations("Admin.consignments");
  return (
    <a
      href="/Vehicle Deposit Contract - AllRoads Cars.pdf"
      download="vehicle-deposit-contract.pdf"
      className="admin-btn admin-btn-secondary"
    >
      {t("blankForm")}
    </a>
  );
}
