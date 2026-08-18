"use client";

import { usePaginatedQuery, useQuery } from "convex/react";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/convex";
import { formatOmr } from "@/lib/format";
import { RangeSlider } from "./RangeSlider";
import { VehicleCard, VehicleCardGridSkeleton, VehicleCardSkeleton } from "./VehicleCard";

const FALLBACK_BOUNDS = {
  minPrice: 0,
  maxPrice: 25000,
  minYear: 2010,
  maxYear: 2026,
  maxMileage: 200000,
  makes: [] as string[],
  models: [] as Array<{ make: string; model: string }>,
  colors: [] as string[],
};

const EMPTY_DRAFT = {
  keyword: "",
  make: "",
  model: "",
  maxMileage: "",
  color: "",
  status: "",
  fuel: "",
  transmission: "",
  spec: "",
  bodyType: "",
  condition: "",
  feature: "",
};

const BODY_TYPES = [
  "suv",
  "sedan",
  "coupe",
  "convertible",
  "hatchback",
  "wagon",
  "pickup",
  "van",
] as const;

type SortKey = "newest" | "price_asc" | "price_desc" | "mileage_asc";
type DraftFilters = typeof EMPTY_DRAFT;

export function InventoryBrowser() {
  const t = useTranslations("Inventory");
  const locale = useLocale();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sort, setSort] = useState<SortKey>("newest");
  const [draft, setDraft] = useState<DraftFilters>(EMPTY_DRAFT);
  const [applied, setApplied] = useState<DraftFilters>(EMPTY_DRAFT);
  const [priceRange, setPriceRange] = useState<[number, number] | null>(null);
  const [yearRange, setYearRange] = useState<[number, number] | null>(null);
  const [appliedRange, setAppliedRange] = useState({
    minPrice: undefined as number | undefined,
    maxPrice: undefined as number | undefined,
    minYear: undefined as number | undefined,
    maxYear: undefined as number | undefined,
  });
  const bounds = useQuery(api.public.filterBounds) ?? FALLBACK_BOUNDS;
  const price = clampRange(priceRange ?? [bounds.minPrice, bounds.maxPrice], bounds.minPrice, bounds.maxPrice);
  const year = clampRange(yearRange ?? [bounds.minYear, bounds.maxYear], bounds.minYear, bounds.maxYear);
  const models = bounds.models
    .filter((entry) => (draft.make ? entry.make === draft.make : true))
    .map((entry) => entry.model);
  const uniqueModels = [...new Set(models)];

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

  const resetFilters = useCallback(() => {
    setDraft({ ...EMPTY_DRAFT });
    setApplied({ ...EMPTY_DRAFT });
    setPriceRange(null);
    setYearRange(null);
    setAppliedRange({
      minPrice: undefined,
      maxPrice: undefined,
      minYear: undefined,
      maxYear: undefined,
    });
    setSort("newest");
    setFiltersOpen(false);
  }, []);

  const filtersActive = isFiltersActive({
    draft,
    applied,
    sort,
    price,
    year,
    bounds,
  });

  const filters = useMemo(
    () => ({
      keyword: draft.keyword.trim() || undefined,
      make: draft.make || undefined,
      model: draft.model || undefined,
      minPrice: appliedRange.minPrice,
      maxPrice: appliedRange.maxPrice,
      minYear: appliedRange.minYear,
      maxYear: appliedRange.maxYear,
      maxMileage: applied.maxMileage ? Number(applied.maxMileage) : undefined,
      color: applied.color || undefined,
      status: (applied.status || undefined) as "published" | "reserved" | "booked" | undefined,
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
      bodyType: (applied.bodyType || undefined) as (typeof BODY_TYPES)[number] | undefined,
      condition: (applied.condition || undefined) as "new" | "used" | undefined,
      feature: applied.feature || undefined,
      sort,
    }),
    [applied, appliedRange, draft.keyword, draft.make, draft.model, sort],
  );

  const { results, status, loadMore } = usePaginatedQuery(
    api.public.listPublished,
    filters,
    { initialNumItems: 9 },
  );

  const [cachedResults, setCachedResults] = useState(results);
  const keepPrevious = status === "LoadingFirstPage" && results.length === 0;
  if (!keepPrevious && cachedResults !== results) {
    setCachedResults(results);
  }

  const isFirstLoad = keepPrevious && cachedResults.length === 0;
  const isRefreshing = keepPrevious && cachedResults.length > 0;
  const visible = keepPrevious ? cachedResults : results;
  const displayed = useMemo(
    () => visible.filter((vehicle) => matchesNameSearch(vehicle, draft.keyword)),
    [draft.keyword, visible],
  );

  return (
    <div>
      <form
        className="mb-10 border border-[var(--line)] bg-[var(--ink-soft)] p-4 sm:p-5"
        onSubmit={(event) => {
          event.preventDefault();
          setApplied(draft);
        }}
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-stretch gap-3">
            <input
              value={draft.keyword}
              onChange={(event) => setDraft({ ...draft, keyword: event.target.value })}
              placeholder={t("keyword")}
              aria-label={t("keyword")}
              type="search"
              enterKeyHint="search"
              className="field-input min-w-0 flex-1 basis-56"
            />
            <button
              type="button"
              aria-expanded={filtersOpen}
              aria-controls="inventory-filter-panel"
              onClick={() => setFiltersOpen((value) => !value)}
              className={`inline-flex min-h-11 shrink-0 items-center justify-center gap-2 border px-5 text-sm font-semibold tracking-wide text-[var(--sand)] transition-colors hover:bg-[var(--sand)]/10 ${
                filtersOpen
                  ? "border-[var(--sand)] bg-[var(--sand)]/15"
                  : "border-[var(--sand)]/70 bg-transparent"
              }`}
            >
              <FilterIcon />
              {t("filter")}
            </button>
          </div>
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
          {filtersOpen ? null : (
            <button type="submit" className="sr-only">
              {t("search")}
            </button>
          )}
        </div>
        {filtersOpen ? (
          <div
            id="inventory-filter-panel"
            className="mt-4 grid gap-4 border-t border-[var(--line)] pt-4 md:grid-cols-2"
          >
            <select
              value={draft.make}
              onChange={(event) =>
                setDraft({ ...draft, make: event.target.value, model: "" })
              }
              className="field-input"
            >
              <option value="">{t("make")}</option>
              {bounds.makes.map((make) => (
                <option key={make} value={make}>
                  {make}
                </option>
              ))}
            </select>
            <select
              value={draft.model}
              onChange={(event) => setDraft({ ...draft, model: event.target.value })}
              className="field-input"
            >
              <option value="">{t("model")}</option>
              {uniqueModels.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as SortKey)}
              className="field-input"
              aria-label={t("sort")}
            >
              <option value="newest">{t("sortNewest")}</option>
              <option value="price_asc">{t("sortPriceAsc")}</option>
              <option value="price_desc">{t("sortPriceDesc")}</option>
              <option value="mileage_asc">{t("sortMileage")}</option>
            </select>
            <input
              value={draft.maxMileage}
              onChange={(event) => setDraft({ ...draft, maxMileage: event.target.value })}
              placeholder={t("maxMileage")}
              aria-label={t("maxMileage")}
              className="field-input"
              inputMode="numeric"
            />
            <select
              value={draft.color}
              onChange={(event) => setDraft({ ...draft, color: event.target.value })}
              className="field-input"
            >
              <option value="">{t("color")}</option>
              {bounds.colors.map((color) => (
                <option key={color} value={color}>
                  {color}
                </option>
              ))}
            </select>
            <Select
              value={draft.spec}
              onChange={(spec) => setDraft({ ...draft, spec })}
              label={t("spec")}
              options={["gcc", "american", "other"]}
              t={t}
            />
            <select
              value={draft.status}
              onChange={(event) => setDraft({ ...draft, status: event.target.value })}
              className="field-input"
            >
              <option value="">{t("status")}</option>
              <option value="published">{t("statusAvailable")}</option>
              <option value="reserved">{t("statusReserved")}</option>
              <option value="booked">{t("statusBooked")}</option>
            </select>
            <select
              value={draft.bodyType}
              onChange={(event) => setDraft({ ...draft, bodyType: event.target.value })}
              className="field-input"
            >
              <option value="">{t("body")}</option>
              {BODY_TYPES.map((bodyType) => (
                <option key={bodyType} value={bodyType}>
                  {t(`bodyTypes.${bodyType}`)}
                </option>
              ))}
            </select>
            <input
              value={draft.feature}
              onChange={(event) => setDraft({ ...draft, feature: event.target.value })}
              placeholder={t("feature")}
              aria-label={t("feature")}
              className="field-input"
            />
            <Select
              value={draft.fuel}
              onChange={(fuel) => setDraft({ ...draft, fuel })}
              label={t("fuel")}
              options={["petrol", "diesel", "hybrid", "plugin_hybrid", "electric"]}
              t={t}
            />
            <Select
              value={draft.transmission}
              onChange={(transmission) => setDraft({ ...draft, transmission })}
              label={t("transmission")}
              options={["automatic", "manual"]}
              t={t}
            />
            <Select
              value={draft.condition}
              onChange={(condition) => setDraft({ ...draft, condition })}
              label={t("condition")}
              options={["new", "used"]}
              t={t}
            />
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-stretch md:col-span-2">
              <button type="submit" className="btn-primary sm:w-auto">
                {t("search")}
              </button>
              {filtersActive ? (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex min-h-11 shrink-0 items-center justify-center border border-[var(--sand)]/45 px-5 text-sm font-semibold tracking-wide text-[var(--sand)] transition-colors hover:border-[var(--sand)] hover:bg-[var(--sand)]/10 sm:w-auto"
                >
                  {t("resetFilters")}
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
      </form>

      {isFirstLoad || (displayed.length === 0 && (isRefreshing || status === "LoadingFirstPage")) ? (
        <div aria-busy="true" aria-live="polite">
          <p className="sr-only">{t("loading")}</p>
          <VehicleCardGridSkeleton count={9} />
        </div>
      ) : displayed.length === 0 ? (
        <p className="text-[var(--ivory-dim)]">{t("empty")}</p>
      ) : (
        <div
          className={`grid gap-6 md:grid-cols-2 xl:grid-cols-3 ${isRefreshing ? "opacity-55" : ""}`}
          aria-busy={isRefreshing || status === "LoadingMore"}
        >
          {displayed.map((vehicle) => (
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

function matchesNameSearch(
  vehicle: {
    make: string;
    model: string;
    titleEn: string;
    titleAr: string;
    stockCode: string;
  },
  keyword: string,
): boolean {
  const needle = keyword.trim().toLowerCase();
  if (!needle) {
    return true;
  }
  return [vehicle.make, vehicle.model, vehicle.titleEn, vehicle.titleAr, vehicle.stockCode]
    .join(" ")
    .toLowerCase()
    .includes(needle);
}

function isDraftDirty(draft: DraftFilters): boolean {
  return Object.values(draft).some((value) => value !== "");
}

function isFiltersActive({
  draft,
  applied,
  sort,
  price,
  year,
  bounds,
}: {
  draft: DraftFilters;
  applied: DraftFilters;
  sort: SortKey;
  price: [number, number];
  year: [number, number];
  bounds: typeof FALLBACK_BOUNDS;
}): boolean {
  return (
    isDraftDirty(draft) ||
    isDraftDirty(applied) ||
    sort !== "newest" ||
    price[0] > bounds.minPrice ||
    price[1] < bounds.maxPrice ||
    year[0] > bounds.minYear ||
    year[1] < bounds.maxYear
  );
}

function clampRange(value: [number, number], min: number, max: number): [number, number] {
  const nextMin = Math.min(max, Math.max(min, value[0]));
  const nextMax = Math.min(max, Math.max(nextMin, value[1]));
  return [nextMin, nextMax];
}

function FilterIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className="size-3.5 shrink-0 fill-current"
    >
      <path d="M1.5 2.25h13l-4.75 5.6v4.4L6.25 14V7.85z" />
    </svg>
  );
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
