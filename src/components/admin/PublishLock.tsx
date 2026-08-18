"use client";

import { useTranslations } from "next-intl";

const BLOCKERS = [
  "public_hidden",
  "not_on_site",
  "price_required",
  "vin_required",
  "contract_expired",
  "contract_not_signed",
  "contract_file_missing",
  "inspection_not_accepted",
  "chassis_mismatch",
] as const;

type Blocker = (typeof BLOCKERS)[number];

function isBlocker(value: string): value is Blocker {
  return BLOCKERS.some((item) => item === value);
}

export function clientPublishLock(vehicle: {
  publishReady: boolean;
  publishBlockers: string[];
  contractEndsAt?: number;
  publishGrandfathered?: boolean;
}) {
  if (vehicle.publishGrandfathered) {
    return { ready: true, blockers: [] as string[] };
  }
  const expired =
    vehicle.contractEndsAt !== undefined && vehicle.contractEndsAt < Date.now();
  const blockers = [...vehicle.publishBlockers];
  if (expired && !blockers.includes("contract_expired")) {
    blockers.push("contract_expired");
  }
  return {
    ready: vehicle.publishReady && !expired,
    blockers,
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
