"use client";

import { useMutation, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { DeskCard, EmptyState } from "@/components/admin/ui";
import { api, type Id } from "@/lib/convex";
import {
  ImagePrepareException,
  prepareVehiclePhoto,
} from "@/lib/imageUpload";

const PHOTO_ANGLES = [
  "front",
  "rear",
  "side",
  "interior",
  "seats",
  "dash",
  "wheels",
  "engine",
  "trunk",
  "damage",
] as const;

type PhotoAngle = (typeof PHOTO_ANGLES)[number];

export function PhotoUploader({ vehicleId }: { vehicleId: Id<"vehicles"> }) {
  const t = useTranslations("Admin.inventory");
  const vehicle = useQuery(api.vehicles.getStaff, { vehicleId });
  const generateUploadUrl = useMutation(api.vehiclePhotos.generateUploadUrl);
  const attach = useMutation(api.vehiclePhotos.attach);
  const remove = useMutation(api.vehiclePhotos.remove);
  const reorder = useMutation(api.vehiclePhotos.reorder);
  const setMain = useMutation(api.vehiclePhotos.setMain);
  const replacePhoto = useMutation(api.vehiclePhotos.replace);
  const setAngle = useMutation(api.vehiclePhotos.setAngle);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const photos = vehicle?.photos ?? [];
  const [draft, setDraft] = useState<typeof photos | null>(null);
  const dragIndex = useRef<number | null>(null);
  const orderedRef = useRef(photos);
  const replaceInput = useRef<HTMLInputElement>(null);
  const replaceTarget = useRef<Id<"vehiclePhotos"> | null>(null);

  const ordered = draft ?? photos;

  async function uploadBlob(file: File): Promise<Id<"_storage">> {
    const prepared = await prepareVehiclePhoto(file);
    const postUrl = await generateUploadUrl();
    const result = await fetch(postUrl, {
      method: "POST",
      headers: { "Content-Type": prepared.type || "image/webp" },
      body: prepared,
    });
    if (!result.ok) {
      throw new Error(t("photoUploadFailed"));
    }
    const json = (await result.json()) as { storageId: Id<"_storage"> };
    return json.storageId;
  }

  function errorMessage(err: unknown) {
    if (err instanceof ImagePrepareException) {
      if (err.code === "too_large") {
        return t("photoTooLarge");
      }
      if (err.code === "not_image") {
        return t("photoNotImage");
      }
      return t("photoCompressFailed");
    }
    return err instanceof Error ? err.message : t("photoUploadFailed");
  }

  async function onChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) {
      return;
    }
    setBusy(true);
    setError("");
    try {
      const altEn = vehicle
        ? `${vehicle.year} ${vehicle.make} ${vehicle.model}`
        : "Vehicle photo";
      const altAr = vehicle
        ? `${vehicle.year} ${vehicle.make} ${vehicle.model}`
        : "صورة المركبة";
      for (const file of files) {
        const storageId = await uploadBlob(file);
        await attach({
          vehicleId,
          storageId,
          altAr,
          altEn,
        });
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      event.target.value = "";
      setBusy(false);
    }
  }

  async function onReplace(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    const photoId = replaceTarget.current;
    event.target.value = "";
    replaceTarget.current = null;
    if (!file || !photoId) {
      return;
    }
    setBusy(true);
    setError("");
    try {
      const storageId = await uploadBlob(file);
      await replacePhoto({ photoId, storageId });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  function onDragStart(index: number) {
    dragIndex.current = index;
    orderedRef.current = photos;
    setDraft(photos);
  }

  function onDragOver(event: React.DragEvent<HTMLDivElement>, index: number) {
    event.preventDefault();
    const from = dragIndex.current;
    if (from === null || from === index) {
      return;
    }
    const next = [...(draft ?? photos)];
    const [moved] = next.splice(from, 1);
    if (!moved) {
      return;
    }
    next.splice(index, 0, moved);
    dragIndex.current = index;
    setDraft(next);
    orderedRef.current = next;
  }

  async function onDragEnd() {
    dragIndex.current = null;
    await reorder({ photoIds: orderedRef.current.map((photo) => photo._id) });
    setDraft(null);
  }

  return (
    <DeskCard>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl">{t("sections.photos")}</h2>
          <p className="mt-1 text-sm text-[var(--ivory-dim)]">{t("photosLead")}</p>
        </div>
        <label className="admin-btn admin-btn-secondary cursor-pointer">
          {busy ? t("uploadingPhotos") : t("choosePhoto")}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif"
            multiple
            className="sr-only"
            disabled={busy}
            onChange={(event) => void onChange(event)}
          />
        </label>
      </div>
      {error ? <p className="mt-3 text-sm text-[var(--crimson)]">{error}</p> : null}
      <input
        ref={replaceInput}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="sr-only"
        onChange={(event) => void onReplace(event)}
      />
      {ordered.length === 0 ? (
        <div className="mt-5">
          <EmptyState title={t("emptyPhotos")} />
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          {ordered.map((photo, index) => (
            <div
              key={photo._id}
              className="min-w-0 border border-[var(--line)] p-2"
              draggable
              onDragStart={() => onDragStart(index)}
              onDragOver={(event) => onDragOver(event, index)}
              onDragEnd={() => void onDragEnd()}
            >
              {photo.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photo.url}
                  alt={photo.altEn}
                  width={320}
                  height={320}
                  className="aspect-square w-full object-cover"
                />
              ) : null}
              <p className="mt-2 text-[10px] tracking-[0.16em] uppercase text-[var(--ivory-dim)]">
                {index === 0 ? t("mainPhoto") : t("dragToReorder")}
              </p>
              <select
                value={photo.angle ?? ""}
                className="admin-field mt-2 text-xs"
                aria-label={t("photoAngle")}
                onChange={(event) => {
                  const value = event.target.value;
                  void setAngle({
                    photoId: photo._id,
                    angle: value === "" ? null : (value as PhotoAngle),
                  });
                }}
              >
                <option value="">{t("photoAngleNone")}</option>
                {PHOTO_ANGLES.map((angle) => (
                  <option key={angle} value={angle}>
                    {t(`photoAngles.${angle}`)}
                  </option>
                ))}
              </select>
              <div className="mt-2 grid gap-1">
                {index !== 0 ? (
                  <button
                    type="button"
                    onClick={() => void setMain({ photoId: photo._id })}
                    className="admin-btn admin-btn-ghost w-full text-xs"
                  >
                    {t("setMainPhoto")}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    replaceTarget.current = photo._id;
                    replaceInput.current?.click();
                  }}
                  className="admin-btn admin-btn-ghost w-full text-xs"
                  disabled={busy}
                >
                  {t("replacePhoto")}
                </button>
                <button
                  type="button"
                  onClick={() => void remove({ photoId: photo._id })}
                  className="admin-btn admin-btn-ghost w-full text-xs"
                  aria-label={t("removePhoto")}
                >
                  {t("removePhoto")}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </DeskCard>
  );
}
