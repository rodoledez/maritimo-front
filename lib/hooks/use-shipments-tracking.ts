"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";

import {
  createManualMovement,
  createManualTracking,
  createShipmentTracking,
  deleteManualContainer,
  deleteManualMovement,
  deleteShipmentTracking,
  getDashboardKpis,
  getShipmentTracking,
  getShipmentTrackingByBooking,
  getShipmentTrackingDetail,
  listActiveShipments,
  listBookingMilestones,
  listShipmentsTracking,
  listTrackingCarriers,
  refreshShipmentTracking,
  syncShipmentsTracking,
  updateManualContainer,
  updateManualMovement,
  updateManualTracking,
  type ActiveShipmentsQuery,
  type TrackingListQuery,
  type TrackingPayload,
} from "@/lib/api/shipments-tracking";
import { isApiError } from "@/types/api";
import type {
  CreateManualTrackingPayload,
  ManualContainerUpdatePayload,
  ManualMovementPayload,
  ManualMovementUpdatePayload,
  ShipmentDetailResponse,
  ShipmentTracking,
  UpdateManualTrackingPayload,
} from "@/types/domain";

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

/**
 * Encuentra el shipment de tracking asociado a una reserva vía
 * `GET /shipments-tracking/by-booking/:bookingId`. El backend responde 404
 * cuando la reserva aún no fue integrada con ShipsGo: lo traducimos a `null`
 * (sin tracking) en vez de propagar el error.
 */
export function useShipmentTrackingByBooking(
  bookingId: number | string | null | undefined,
  options: { enabled?: boolean } = {}
) {
  const { enabled = true } = options;
  return useQuery({
    queryKey: [...KEY, "by-booking", bookingId] as const,
    queryFn: async () => {
      try {
        return await getShipmentTrackingByBooking(
          bookingId as number | string
        );
      } catch (error) {
        if (isApiError(error) && error.status === 404) return null;
        throw error;
      }
    },
    enabled: enabled && bookingId !== undefined && bookingId !== null,
  });
}

/**
 * Hitos de tracking de una reserva. Igual que `by-booking`, el backend responde
 * 404 cuando la reserva no tiene tracking: lo traducimos a lista vacía para que
 * la ficha muestre "Sin hitos informados aún" en vez de un error.
 */
export function useBookingMilestones(
  bookingId: number | string | null | undefined,
  options: { enabled?: boolean } = {}
) {
  const { enabled = true } = options;
  return useQuery({
    queryKey: [...KEY, "milestones", bookingId] as const,
    queryFn: async () => {
      try {
        return await listBookingMilestones(bookingId as number | string);
      } catch (error) {
        if (isApiError(error) && error.status === 404) return [];
        throw error;
      }
    },
    enabled: enabled && bookingId !== undefined && bookingId !== null,
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

// ─── Seguimiento manual ──────────────────────────────────────────────────────

/**
 * Tras cada escritura manual: la respuesta ya es el detalle actualizado, así
 * que va directo a la caché; el resto (tracking por reserva, hitos, dashboard,
 * lista) se invalida. También las reservas, porque su `shipsgoStatus` cambia.
 */
function applyManualDetail(qc: QueryClient, detail: ShipmentDetailResponse) {
  const detailKey = [...KEY, "detail", detail.tracking.id, false] as const;
  qc.setQueryData(detailKey, detail);
  qc.invalidateQueries({
    queryKey: KEY,
    predicate: (q) =>
      !(
        q.queryKey[1] === "detail" &&
        String(q.queryKey[2]) === String(detail.tracking.id) &&
        q.queryKey[3] === false
      ),
  });
  qc.invalidateQueries({ queryKey: ["bookings"] });
}

export function useCreateManualTracking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateManualTrackingPayload) =>
      createManualTracking(payload),
    onSuccess: (detail) => applyManualDetail(qc, detail),
  });
}

export function useUpdateManualTracking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      shipmentId,
      payload,
    }: {
      shipmentId: ShipmentTracking["id"];
      payload: UpdateManualTrackingPayload;
    }) => updateManualTracking(shipmentId, payload),
    onSuccess: (detail) => applyManualDetail(qc, detail),
  });
}

export function useUpdateManualContainer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      shipmentId,
      containerNumber,
      payload,
    }: {
      shipmentId: ShipmentTracking["id"];
      containerNumber: string;
      payload: ManualContainerUpdatePayload;
    }) => updateManualContainer(shipmentId, containerNumber, payload),
    onSuccess: (detail) => applyManualDetail(qc, detail),
  });
}

export function useDeleteManualContainer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      shipmentId,
      containerNumber,
    }: {
      shipmentId: ShipmentTracking["id"];
      containerNumber: string;
    }) => deleteManualContainer(shipmentId, containerNumber),
    onSuccess: (detail) => applyManualDetail(qc, detail),
  });
}

export function useCreateManualMovement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      shipmentId,
      payload,
    }: {
      shipmentId: ShipmentTracking["id"];
      payload: ManualMovementPayload;
    }) => createManualMovement(shipmentId, payload),
    onSuccess: (detail) => applyManualDetail(qc, detail),
  });
}

export function useUpdateManualMovement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      shipmentId,
      movementId,
      payload,
    }: {
      shipmentId: ShipmentTracking["id"];
      movementId: string;
      payload: ManualMovementUpdatePayload;
    }) => updateManualMovement(shipmentId, movementId, payload),
    onSuccess: (detail) => applyManualDetail(qc, detail),
  });
}

export function useDeleteManualMovement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      shipmentId,
      movementId,
    }: {
      shipmentId: ShipmentTracking["id"];
      movementId: string;
    }) => deleteManualMovement(shipmentId, movementId),
    onSuccess: (detail) => applyManualDetail(qc, detail),
  });
}
