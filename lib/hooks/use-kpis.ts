"use client";

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api/client";

export type KpiBuckets = {
  Today?: Record<string, number>;
  Total?: Record<string, number>;
  [key: string]: Record<string, number> | undefined;
};

export function useKpis() {
  return useQuery({
    queryKey: ["kpis"],
    queryFn: () => apiGet<KpiBuckets>("/kpis"),
    staleTime: 60_000,
  });
}

export function pickKpi(
  data: KpiBuckets | undefined,
  bucket: "Today" | "Total",
  status: "Pendiente" | "Confirmado" | "Cancelado"
): number | null {
  if (!data) return null;
  const value = data[bucket]?.[status];
  return typeof value === "number" ? value : null;
}
