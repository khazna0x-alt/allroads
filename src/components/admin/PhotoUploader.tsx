"use client";

import { useMutation, useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { DeskCard, EmptyState } from "@/components/admin/ui";
import { api, type Id } from "@/lib/convex";

export function PhotoUploader({ vehicleId }: { vehicleId: Id<"vehicles"> }) {
  const t = useTranslations("Admin.inventory");
  const vehicle = useQuery(api.vehicles.getStaff, { vehicleId });
  const generateUploadUrl = useMutation(api.vehiclePhotos.generateUploadUrl);
  const attach = useMutation(api.vehiclePhotos.attach);
  const remove = useMutation(api.vehiclePhotos.remove);
  const [busy, setBusy] = useState(false);

  async function onChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    setBusy(true);
    try {
      const postUrl = await generateUploadUrl();
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const json = (await result.json()) as { storageId: Id<"_storage"> };
      await attach({
        vehicleId,
        storageId: json.storageId,
        altAr: file.name,
        altEn: file.name,
      });
    } finally {
      event.target.value = "";
      setBusy(false);
    }
  }

  const photos = vehicle?.photos ?? [];

  return (
    <DeskCard>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl">{t("sections.photos")}</h2>
        <label className="admin-btn admin-btn-secondary cursor-pointer">
          {t("choosePhoto")}
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={busy}
            onChange={(event) => void onChange(event)}
          />
        </label>
      </div>
      {photos.length === 0 ? (
        <div className="mt-5">
          <EmptyState title={t("emptyPhotos")} />
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          {photos.map((photo) => (
            <div key={photo._id} className="min-w-0">
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
              <button
                type="button"
                onClick={() => void remove({ photoId: photo._id })}
                className="admin-btn admin-btn-ghost mt-2 w-full text-xs"
                aria-label={t("removePhoto")}
              >
                {t("removePhoto")}
              </button>
            </div>
          ))}
        </div>
      )}
    </DeskCard>
  );
}
