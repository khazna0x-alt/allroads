"use client";

import { useTranslations } from "next-intl";
import {
  WIZARD_STEPS,
  type VehicleDraft,
  type WizardStep,
  incompleteStepCount,
  stepComplete,
} from "@/lib/vehicleWizard";

export function VehicleWizardProgress({
  step,
  draft,
  photoCount,
  photosLocked,
  onSelect,
}: {
  step: WizardStep;
  draft: VehicleDraft;
  photoCount: number;
  photosLocked: boolean;
  onSelect: (next: WizardStep) => void;
}) {
  const t = useTranslations("Admin.inventory.wizard");
  const missing = incompleteStepCount(draft, photoCount);

  return (
    <div className="admin-wizard-wrap">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="admin-kicker">{t("progress")}</p>
          <p className="mt-1 text-sm text-[var(--ivory-dim)]">
            {t("stepOf", {
              current: WIZARD_STEPS.indexOf(step) + 1,
              total: WIZARD_STEPS.length,
            })}
          </p>
        </div>
        {missing > 0 ? (
          <p className="text-sm text-[#f2c4c6]">{t("missingCount", { count: missing })}</p>
        ) : (
          <p className="text-sm text-[var(--sand)]">{t("allComplete")}</p>
        )}
      </div>
      <ol className="admin-wizard" aria-label={t("progress")}>
        {WIZARD_STEPS.map((item, index) => {
          const complete = stepComplete(item, draft, photoCount);
          const current = item === step;
          const locked = item === "photos" && photosLocked;
          const statusLabel = complete ? t("complete") : t("incomplete");
          return (
            <li
              key={item}
              className={`admin-wizard-step ${current ? "is-current" : ""} ${
                complete ? "is-complete" : "is-incomplete"
              } ${locked ? "is-locked" : ""}`}
            >
              <button
                type="button"
                onClick={() => onSelect(item)}
                disabled={locked}
                aria-current={current ? "step" : undefined}
                aria-disabled={locked || undefined}
                title={locked ? t("photosLocked") : statusLabel}
                className="admin-wizard-button"
              >
                <span className="admin-wizard-marker" aria-hidden="true">
                  {complete ? <CheckIcon /> : index + 1}
                  {!complete ? <span className="admin-wizard-missing" /> : null}
                </span>
                <span className="admin-wizard-copy">
                  <span className="admin-wizard-label">{t(`steps.${item}`)}</span>
                  <span className="admin-wizard-status">{statusLabel}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M3.5 8.2 6.4 11l6.1-7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="square"
      />
    </svg>
  );
}
