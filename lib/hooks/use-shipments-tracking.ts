"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createShipmentTracking,
  deleteShipmentTracking,
  getShipmentTrackingByBooking,
  listShipmentsTracking,
  listTrackingCarriers,
  refreshShipmentTracking,
  syncShipmentsTracking,
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

export function useShipmentTracking(bookingId: number | string | undefined) {
  return useQuery({
    queryKey: [...KEY, "by-booking", bookingId] as const,
    queryFn: () =>
      getShipmentTrackingByBooking(bookingId as number | string),
    enabled: bookingId !== undefined && bookingId !== null,
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
    mutationFn: (bookingId: number | string) =>
      refreshShipmentTracking(bookingId),
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
    mutationFn: (id: ShipmentTracking["id"]) => deleteShipmentTracking(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
