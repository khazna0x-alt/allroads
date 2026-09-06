"use client";

import { useTranslations } from "next-intl";

const BLOCKERS = ["public_hidden", "photos_required"] as const;

type Blocker = (typeof BLOCKERS)[number];

function isBlocker(value: string): value is Blocker {
  return BLOCKERS.some((item) => item === value);
}

export function clientPublishLock(vehicle: {
  publishReady: boolean;
  publishBlockers: string[];
  publishGrandfathered?: boolean;
}) {
  return {
    ready: vehicle.publishReady,
    blockers: [...vehicle.publishBlockers],
  };
}

export function PublishLockNote({
  ready,
  blockers,
}: {
  ready: boolean;
  blockers: string[];
}) {
  const t = useTranslations("Admin");
  if (ready || blockers.length === 0) {
    return null;
  }
  return (
    <p className="mt-3 text-sm text-[var(--ivory-dim)]">
      {t("inventory.publishLocked")}:{" "}
      {blockers.map((blocker) => (isBlocker(blocker) ? t(`publishBlockers.${blocker}`) : blocker)).join(" · ")}
    </p>
  );
}

export function publishLockTitle(blockers: string[], label: (key: Blocker) => string) {
  return blockers.map((blocker) => (isBlocker(blocker) ? label(blocker) : blocker)).join(", ");
}
