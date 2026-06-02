"use client";

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api/client";

export type KpiStatus =
  | "PENDIENTE"
  | "CONFIRMADO"
  | "CANCELADO"
  | (string & {});

export type KpiBucket = {
  dateFrom: string;
  dateTo: string;
  data: Array<{ status: string; count: number }>;
};

export type KpiResponse = {
  dataMonth: KpiBucket;
  dataWeek: KpiBucket;
  dataToday: KpiBucket;
};

export type KpiPeriod = "month" | "week" | "today";

export function useKpis() {
  return useQuery({
    queryKey: ["kpis"],
    queryFn: () => apiGet<KpiResponse>("/kpis"),
    staleTime: 60_000,
  });
}

export function pickBucket(
  data: KpiResponse | undefined,
  period: KpiPeriod
): KpiBucket | null {
  if (!data) return null;
  if (period === "month") return data.dataMonth ?? null;
  if (period === "week") return data.dataWeek ?? null;
  return data.dataToday ?? null;
}

export function countByStatus(
  bucket: KpiBucket | null,
  status: KpiStatus
): number {
  if (!bucket?.data) return 0;
  const target = status.toUpperCase();
  return bucket.data
    .filter((row) => row.status?.toUpperCase() === target)
    .reduce((sum, row) => sum + (row.count ?? 0), 0);
}

export function totalCount(bucket: KpiBucket | null): number {
  if (!bucket?.data) return 0;
  return bucket.data.reduce((sum, row) => sum + (row.count ?? 0), 0);
}
