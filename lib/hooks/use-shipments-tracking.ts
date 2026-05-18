"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createShipmentTracking,
  deleteShipmentTracking,
  getDashboardKpis,
  getShipmentTracking,
  getShipmentTrackingDetail,
  listActiveShipments,
  listShipmentsTracking,
  listTrackingCarriers,
  refreshShipmentTracking,
  syncShipmentsTracking,
  type ActiveShipmentsQuery,
  type TrackingListQuery,
  type TrackingPayload,
} from "@/lib/api/shipments-tracking";
import type { ShipmentTracking } from "@/types/domain";

const KEY = ["shipments-tracking"] as const;

export function useShipmentsTracking(query: TrackingListQuery = {}) {
  return useQuery({
    queryKey: [...KEY, query] as const,
    queryFn: () => listShipmentsTracking(query),
  });
}

export function useShipmentTracking(shipmentId: number | string | undefined) {
  return useQuery({
    queryKey: [...KEY, "by-id", shipmentId] as const,
    queryFn: () => getShipmentTracking(shipmentId as number | string),
    enabled: shipmentId !== undefined && shipmentId !== null,
  });
}

export function useShipmentTrackingDetail(
  shipmentId: number | string | undefined,
  options: { refresh?: boolean; enabled?: boolean } = {}
) {
  const { refresh = false, enabled = true } = options;
  return useQuery({
    queryKey: [...KEY, "detail", shipmentId, refresh] as const,
    queryFn: () =>
      getShipmentTrackingDetail(shipmentId as number | string, refresh),
    enabled:
      enabled && shipmentId !== undefined && shipmentId !== null,
  });
}

export function useDashboardKpis() {
  return useQuery({
    queryKey: [...KEY, "dashboard", "kpis"] as const,
    queryFn: getDashboardKpis,
  });
}

export function useActiveShipments(query: ActiveShipmentsQuery = {}) {
  return useQuery({
    queryKey: [...KEY, "dashboard", "active", query] as const,
    queryFn: () => listActiveShipments(query),
  });
}

export function useTrackingCarriers() {
  return useQuery({
    queryKey: [...KEY, "carriers"] as const,
    queryFn: listTrackingCarriers,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateShipmentTracking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: TrackingPayload) => createShipmentTracking(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useRefreshShipmentTracking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (shipmentId: number | string) =>
      refreshShipmentTracking(shipmentId),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useSyncShipmentsTracking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => syncShipmentsTracking(),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteShipmentTracking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (shipmentId: ShipmentTracking["id"]) =>
      deleteShipmentTracking(shipmentId),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
