"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import {
  getImportShipment,
  listImportShipmentSubStates,
  listImportShipments,
  type ImportShipmentsQuery,
} from "@/lib/api/import-shipments";

const KEY = ["import-shipments"] as const;

export function useImportShipments(query: ImportShipmentsQuery) {
  return useQuery({
    queryKey: [...KEY, "page", query] as const,
    queryFn: () => listImportShipments(query),
    placeholderData: keepPreviousData,
  });
}

export function useImportShipmentSubStates() {
  return useQuery({
    queryKey: [...KEY, "sub-states"] as const,
    queryFn: listImportShipmentSubStates,
    staleTime: 5 * 60 * 1000,
  });
}

export function useImportShipment(
  id: number | undefined,
  { enabled = true }: { enabled?: boolean } = {}
) {
  return useQuery({
    queryKey: [...KEY, "detail", id] as const,
    queryFn: () => getImportShipment(id as number),
    enabled: enabled && id !== undefined,
  });
}
