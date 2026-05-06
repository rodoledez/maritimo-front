"use client";

import { useQuery } from "@tanstack/react-query";

import { listReservas } from "@/lib/api/reservas";
import type { Booking } from "@/types/domain";

const RESERVAS_KEY = ["reservas"] as const;

export function useReservas() {
  return useQuery({
    queryKey: RESERVAS_KEY,
    queryFn: listReservas,
  });
}

export function useRecentReservas(limit = 10) {
  return useQuery({
    queryKey: [...RESERVAS_KEY, "recent", limit] as const,
    queryFn: listReservas,
    select: (data: Booking[]) =>
      [...data]
        .sort((a, b) => Number(b.id) - Number(a.id))
        .slice(0, limit),
  });
}
