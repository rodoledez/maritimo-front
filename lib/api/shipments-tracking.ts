import { apiDelete, apiGet, apiPost } from "@/lib/api/client";
import { unwrapList, unwrapOne } from "@/lib/api/_shared";
import type {
  ActiveShipmentsListResponse,
  AlertLevel,
  BookingMilestone,
  DashboardKpisResponse,
  ShipmentDetailResponse,
  ShipmentTracking,
  ShipmentTrackingStatus,
  SyncResult,
  TrackingCarrier,
} from "@/types/domain";

export type TrackingPayload = {
  bookingId: number;
  followers?: string[];
  tags?: string[];
};

export type TrackingListQuery = {
  search?: string;
  status?: ShipmentTrackingStatus | string;
  carrier?: string;
  skip?: number;
  take?: number;
};

export async function listShipmentsTracking(
  query: TrackingListQuery = {}
): Promise<ShipmentTracking[]> {
  return unwrapList(
    await apiGet<ShipmentTracking[] | { data: ShipmentTracking[] }>(
      "/shipments-tracking",
      { params: query }
    )
  );
}

export async function getShipmentTracking(
  shipmentId: number | string
): Promise<ShipmentTracking> {
  return unwrapOne(
    await apiGet<ShipmentTracking | { data: ShipmentTracking }>(
      `/shipments-tracking/${shipmentId}`
    )
  );
}

/**
 * Busca el shipment de tracking asociado a una reserva
 * (`GET /shipments-tracking/by-booking/:bookingId`). El backend responde 404
 * cuando la reserva aún no fue integrada con ShipsGo; el llamador lo trata como
 * "sin tracking".
 */
export async function getShipmentTrackingByBooking(
  bookingId: number | string
): Promise<ShipmentTracking> {
  return unwrapOne(
    await apiGet<ShipmentTracking | { data: ShipmentTracking }>(
      `/shipments-tracking/by-booking/${bookingId}`
    )
  );
}

/**
 * Timeline de hitos de una reserva
 * (`GET /shipments-tracking/by-booking/:bookingId/milestones`). Llega ordenado
 * del hito más antiguo al más reciente e incluye los hitos que no generaron
 * correo, así que se renderiza tal cual, sin filtrar por `notifyState`.
 */
export async function listBookingMilestones(
  bookingId: number | string
): Promise<BookingMilestone[]> {
  return unwrapList(
    await apiGet<BookingMilestone[] | { data: BookingMilestone[] }>(
      `/shipments-tracking/by-booking/${bookingId}/milestones`
    )
  );
}

export async function getShipmentTrackingDetail(
  shipmentId: number | string,
  refresh = false
): Promise<ShipmentDetailResponse> {
  return unwrapOne(
    await apiGet<ShipmentDetailResponse | { data: ShipmentDetailResponse }>(
      `/shipments-tracking/${shipmentId}/detail`,
      { params: { refresh: refresh ? "true" : "false" } }
    )
  );
}

export async function refreshShipmentTracking(
  shipmentId: number | string
): Promise<ShipmentTracking> {
  return unwrapOne(
    await apiGet<ShipmentTracking | { data: ShipmentTracking }>(
      `/shipments-tracking/${shipmentId}/refresh`
    )
  );
}

export async function createShipmentTracking(
  payload: TrackingPayload
): Promise<ShipmentTracking> {
  return unwrapOne(
    await apiPost<ShipmentTracking | { data: ShipmentTracking }>(
      "/shipments-tracking",
      payload
    )
  );
}

export async function deleteShipmentTracking(
  shipmentId: number | string
): Promise<void> {
  await apiDelete<void>(`/shipments-tracking/${shipmentId}`);
}

export async function syncShipmentsTracking(): Promise<SyncResult> {
  return unwrapOne(
    await apiPost<SyncResult | { data: SyncResult }>(
      "/shipments-tracking/sync"
    )
  );
}

export type ActiveShipmentsQuery = {
  skip?: number;
  take?: number;
  orderBy?: "updatedAt" | "eta" | "status";
  orderDir?: "ASC" | "DESC";
  search?: string;
  status?: string;
  clientId?: number;
  shippingCompanyId?: number;
  alertLevel?: AlertLevel;
  includeDiscarded?: boolean;
};

export async function getDashboardKpis(): Promise<DashboardKpisResponse> {
  return unwrapOne(
    await apiGet<DashboardKpisResponse | { data: DashboardKpisResponse }>(
      "/shipments-tracking/dashboard/kpis"
    )
  );
}

export async function listActiveShipments(
  query: ActiveShipmentsQuery = {}
): Promise<ActiveShipmentsListResponse> {
  return unwrapOne(
    await apiGet<
      ActiveShipmentsListResponse | { data: ActiveShipmentsListResponse }
    >("/shipments-tracking/dashboard/active", { params: query })
  );
}

export async function listTrackingCarriers(): Promise<TrackingCarrier[]> {
  return unwrapList(
    await apiGet<TrackingCarrier[] | { data: TrackingCarrier[] }>(
      "/shipments-tracking/carriers"
    )
  );
}
