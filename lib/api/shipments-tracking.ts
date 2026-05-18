import { apiDelete, apiGet, apiPost } from "@/lib/api/client";
import { unwrapList, unwrapOne } from "@/lib/api/_shared";
import type {
  ActiveShipmentsListResponse,
  AlertLevel,
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
