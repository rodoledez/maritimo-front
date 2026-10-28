"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  getImportShipment,
  integrateImportShipmentWithShipsgo,
  listImportShipmentMilestones,
  listImportShipmentSubStates,
  listImportShipments,
  type ImportShipmentsQuery,
} from "@/lib/api/import-shipments";
import { refreshShipmentTracking } from "@/lib/api/shipments-tracking";

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

export function useImportShipmentMilestones(
  id: number | undefined,
  { enabled = true }: { enabled?: boolean } = {}
) {
  return useQuery({
    queryKey: [...KEY, "milestones", id] as const,
    queryFn: () => listImportShipmentMilestones(id as number),
    enabled: enabled && id !== undefined,
  });
}

export function useIntegrateImportShipmentWithShipsgo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => integrateImportShipmentWithShipsgo(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ["shipments-tracking"] });
      qc.invalidateQueries({ queryKey: ["notification-logs"] });
    },
  });
}

/** Refresca el seguimiento desde ShipsGo; el status cambia también en la lista. */
export function useRefreshImportShipmentTracking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (shipmentTrackingId: number) =>
      refreshShipmentTracking(shipmentTrackingId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ["shipments-tracking"] });
    },
  });
}
