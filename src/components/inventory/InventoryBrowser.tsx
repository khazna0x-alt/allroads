"use client";

import { usePaginatedQuery, useQuery } from "convex/react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/lib/convex";
import { formatOmr } from "@/lib/format";
import { RangeSlider } from "./RangeSlider";
import { VehicleCard, VehicleCardGridSkeleton, VehicleCardSkeleton } from "./VehicleCard";

const FALLBACK_BOUNDS = {
  minPrice: 0,
  maxPrice: 25000,
  minYear: 2010,
  maxYear: 2026,
};

export function InventoryBrowser() {
  const t = useTranslations("Inventory");
  const locale = useLocale();
  const [advanced, setAdvanced] = useState(false);
  const [draft, setDraft] = useState({
    keyword: "",
    make: "",
    maxMileage: "",
    fuel: "",
    transmission: "",
    spec: "",
    bodyType: "",
    condition: "",
    feature: "",
  });
  const [applied, setApplied] = useState(draft);
  const [priceRange, setPriceRange] = useState<[number, number] | null>(null);
  const [yearRange, setYearRange] = useState<[number, number] | null>(null);
  const [appliedRange, setAppliedRange] = useState({
    minPrice: undefined as number | undefined,
    maxPrice: undefined as number | undefined,
    minYear: undefined as number | undefined,
    maxYear: undefined as number | undefined,
  });
  const makes = useQuery(api.public.listMakes);
  const bounds = useQuery(api.public.filterBounds) ?? FALLBACK_BOUNDS;
  const price = clampRange(priceRange ?? [bounds.minPrice, bounds.maxPrice], bounds.minPrice, bounds.maxPrice);
  const year = clampRange(yearRange ?? [bounds.minYear, bounds.maxYear], bounds.minYear, bounds.maxYear);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setAppliedRange({
        minPrice: price[0] > bounds.minPrice ? price[0] : undefined,
        maxPrice: price[1] < bounds.maxPrice ? price[1] : undefined,
        minYear: year[0] > bounds.minYear ? year[0] : undefined,
        maxYear: year[1] < bounds.maxYear ? year[1] : undefined,
      });
    }, 280);
    return () => window.clearTimeout(timeout);
  }, [bounds.maxPrice, bounds.maxYear, bounds.minPrice, bounds.minYear, price, year]);

  const filters = useMemo(
    () => ({
      keyword: applied.keyword || undefined,
      make: applied.make || undefined,
      minPrice: appliedRange.minPrice,
      maxPrice: appliedRange.maxPrice,
      minYear: appliedRange.minYear,
      maxYear: appliedRange.maxYear,
      maxMileage: applied.maxMileage ? Number(applied.maxMileage) : undefined,
      fuel: (applied.fuel || undefined) as
        | "petrol"
        | "diesel"
        | "hybrid"
        | "plugin_hybrid"
        | "electric"
        | undefined,
      transmission: (applied.transmission || undefined) as
        | "automatic"
        | "manual"
        | undefined,
      spec: (applied.spec || undefined) as "gcc" | "american" | "other" | undefined,
      bodyType: (applied.bodyType || undefined) as
        | "suv"
        | "sedan"
        | "coupe"
        | "convertible"
        | "hatchback"
        | "wagon"
        | "pickup"
        | "van"
        | undefined,
      condition: (applied.condition || undefined) as "new" | "used" | undefined,
      feature: applied.feature || undefined,
    }),
    [applied, appliedRange],
  );

  const { results, status, loadMore } = usePaginatedQuery(
    api.public.listPublished,
    filters,
    { initialNumItems: 9 },
  );

  const cachedResults = useRef(results);
  if (status !== "LoadingFirstPage" || results.length > 0) {
    cachedResults.current = results;
  }

  const isFirstLoad = status === "LoadingFirstPage" && cachedResults.current.length === 0;
  const isRefreshing = status === "LoadingFirstPage" && cachedResults.current.length > 0;
  const visible = isFirstLoad ? [] : results.length > 0 ? results : cachedResults.current;

  return (
    <div>
      <form
        className="mb-10 grid gap-4 border border-[var(--line)] bg-[var(--ink-soft)] p-4 sm:p-5 md:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          setApplied(draft);
        }}
      >
        <input
          value={draft.keyword}
          onChange={(event) => setDraft({ ...draft, keyword: event.target.value })}
          placeholder={t("keyword")}
          className="field-input"
        />
        <select
          value={draft.make}
          onChange={(event) => setDraft({ ...draft, make: event.target.value })}
          className="field-input"
        >
          <option value="">{t("make")}</option>
          {(makes ?? []).map((make) => (
            <option key={make} value={make}>
              {make}
            </option>
          ))}
        </select>
        <RangeSlider
          label={t("price")}
          min={bounds.minPrice}
          max={bounds.maxPrice}
          step={100}
          value={price}
          formatValue={(value) => formatOmr(value, locale)}
          onChange={setPriceRange}
        />
        <RangeSlider
          label={t("year")}
          min={bounds.minYear}
          max={bounds.maxYear}
          step={1}
          value={year}
          formatValue={(value) => String(value)}
          onChange={setYearRange}
        />
        {advanced ? (
          <>
            <input
              value={draft.maxMileage}
              onChange={(event) => setDraft({ ...draft, maxMileage: event.target.value })}
              placeholder={t("maxMileage")}
              className="field-input"
              inputMode="numeric"
            />
            <input
              value={draft.feature}
              onChange={(event) => setDraft({ ...draft, feature: event.target.value })}
              placeholder={t("feature")}
              className="field-input"
            />
            <Select value={draft.fuel} onChange={(fuel) => setDraft({ ...draft, fuel })} label={t("fuel")} options={["petrol", "diesel", "hybrid", "plugin_hybrid", "electric"]} t={t} />
            <Select value={draft.transmission} onChange={(transmission) => setDraft({ ...draft, transmission })} label={t("transmission")} options={["automatic", "manual"]} t={t} />
            <Select value={draft.spec} onChange={(spec) => setDraft({ ...draft, spec })} label={t("spec")} options={["gcc", "american", "other"]} t={t} />
            <Select value={draft.condition} onChange={(condition) => setDraft({ ...draft, condition })} label={t("condition")} options={["new", "used"]} t={t} />
          </>
        ) : null}
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap md:col-span-2">
          <button type="submit" className="btn-primary sm:w-auto">
            {t("search")}
          </button>
          <button
            type="button"
            onClick={() => setAdvanced((value) => !value)}
            className="btn-secondary sm:w-auto"
          >
            {advanced ? t("hideAdvanced") : t("advanced")}
          </button>
        </div>
      </form>

      {isFirstLoad ? (
        <div aria-busy="true" aria-live="polite">
          <p className="sr-only">{t("loading")}</p>
          <VehicleCardGridSkeleton count={9} />
        </div>
      ) : visible.length === 0 && status !== "LoadingFirstPage" ? (
        <p className="text-[var(--ivory-dim)]">{t("empty")}</p>
      ) : (
        <div
          className={`grid gap-6 md:grid-cols-2 xl:grid-cols-3 ${isRefreshing ? "opacity-55" : ""}`}
          aria-busy={isRefreshing || status === "LoadingMore"}
        >
          {visible.map((vehicle) => (
            <VehicleCard key={vehicle._id} vehicle={vehicle} />
          ))}
          {status === "LoadingMore"
            ? [0, 1, 2].map((index) => <VehicleCardSkeleton key={`more-${index}`} />)
            : null}
        </div>
      )}

      {status === "CanLoadMore" ? (
        <button
          type="button"
          onClick={() => loadMore(9)}
          className="btn-secondary mt-10 w-full sm:w-auto"
        >
          {t("loadMore")}
        </button>
      ) : null}
      {status === "LoadingMore" ? (
        <p className="sr-only" aria-live="polite">
          {t("loading")}
        </p>
      ) : null}
    </div>
  );
}

function clampRange(value: [number, number], min: number, max: number): [number, number] {
  const nextMin = Math.min(max, Math.max(min, value[0]));
  const nextMax = Math.min(max, Math.max(nextMin, value[1]));
  return [nextMin, nextMax];
}

function Select({
  value,
  onChange,
  label,
  options,
  t,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  options: string[];
  t: (key: string) => string;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="field-input"
    >
      <option value="">{label}</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {t(option)}
        </option>
      ))}
    </select>
  );
}
