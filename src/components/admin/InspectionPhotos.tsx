"use client";

import { useMutation, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { useId, useRef, useState } from "react";
import { DeskCard, EmptyState } from "@/components/admin/ui";
import { api, type Id } from "@/lib/convex";

export function InspectionPhotos({ vehicleId }: { vehicleId: Id<"vehicles"> }) {
  const t = useTranslations("Admin.inspection");
  const inspection = useQuery(api.inspections.getForVehicle, { vehicleId });
  const generateUploadUrl = useMutation(api.inspections.generatePhotoUploadUrl);
  const attach = useMutation(api.inspections.attachPhoto);
  const remove = useMutation(api.inspections.removePhoto);
  const captionId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    const note = caption.trim();
    setError("");
    if (files.length === 0) {
      return;
    }
    if (note.length < 3) {
      setError(t("captionRequired"));
      event.target.value = "";
      return;
    }
    setBusy(true);
    try {
      for (const file of files) {
        const postUrl = await generateUploadUrl();
        const result = await fetch(postUrl, {
          method: "POST",
          headers: { "Content-Type": file.type || "image/jpeg" },
          body: file,
        });
        if (!result.ok) {
          throw new Error(t("uploadFailed"));
        }
        const json = (await result.json()) as { storageId: Id<"_storage"> };
        await attach({
          vehicleId,
          storageId: json.storageId,
          caption: note,
        });
      }
      setCaption("");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("uploadFailed"));
    } finally {
      event.target.value = "";
      setBusy(false);
    }
  }

  const photos = inspection?.photos ?? [];

  return (
    <DeskCard className="print:hidden">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-lg">{t("photos")}</h3>
          <p className="mt-1 text-sm text-[var(--ivory-dim)]">{t("photosLead")}</p>
        </div>
      </div>
      <label className="mt-4 block text-sm" htmlFor={captionId}>
        <span className="mb-2 block text-[var(--ivory-dim)]">{t("caption")}</span>
        <input
          id={captionId}
          value={caption}
          onChange={(event) => setCaption(event.target.value)}
          className="admin-field"
          placeholder={t("captionPlaceholder")}
          autoComplete="off"
        />
      </label>
      <div className="mt-3">
        <label className="admin-btn admin-btn-secondary cursor-pointer">
          {busy ? t("uploading") : t("addPhoto")}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            disabled={busy}
            onChange={(event) => void onChange(event)}
          />
        </label>
      </div>
      {error ? (
        <p className="mt-3 text-sm text-[#f2c4c6]" role="alert">
          {error}
        </p>
      ) : null}
      {photos.length === 0 ? (
        <div className="mt-5">
          <EmptyState title={t("emptyPhotos")} body={t("photosLead")} />
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          {photos.map((photo) => (
            <figure key={photo._id} className="min-w-0">
              {photo.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photo.url}
                  alt={photo.caption}
                  width={320}
                  height={320}
                  className="aspect-square w-full object-cover"
                />
              ) : null}
              <figcaption className="mt-2 text-xs text-[var(--ivory-dim)]">{photo.caption}</figcaption>
              <button
                type="button"
                onClick={() => void remove({ photoId: photo._id })}
                className="admin-btn admin-btn-ghost mt-2 w-full text-xs"
              >
                {t("removePhoto")}
              </button>
            </figure>
          ))}
        </div>
      )}
    </DeskCard>
  );
}
