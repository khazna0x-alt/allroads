"use client";

import { useQuery } from "convex/react";
import { useTranslations } from "next-intl";
import { api } from "@/lib/convex";
import { VehicleCard, VehicleCardGridSkeleton } from "./VehicleCard";

export function FeaturedCars() {
  const t = useTranslations("Inventory");
  const vehicles = useQuery(api.public.featuredPublished);

  if (vehicles === undefined) {
    return (
      <div aria-busy="true" aria-live="polite">
        <p className="sr-only">{t("loading")}</p>
        <VehicleCardGridSkeleton count={3} />
      </div>
    );
  }

  if (vehicles.length === 0) {
    return <p className="text-[var(--ivory-dim)]">{t("empty")}</p>;
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {vehicles.map((vehicle) => (
        <VehicleCard key={vehicle._id} vehicle={vehicle} />
      ))}
    </div>
  );
}
