import { apiDelete, apiGet, apiPost } from "@/lib/api/client";
import { unwrapList, unwrapOne } from "@/lib/api/_shared";
import type { ShipmentTracking, TrackingCarrier } from "@/types/domain";

export type TrackingPayload = {
  bookingId: number | string;
  followers?: string[];
  tags?: string[];
};

export type TrackingListQuery = {
  status?: string;
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

export async function getShipmentTrackingByBooking(
  bookingId: number | string
): Promise<ShipmentTracking> {
  return unwrapOne(
    await apiGet<ShipmentTracking | { data: ShipmentTracking }>(
      `/shipments-tracking/${bookingId}`
    )
  );
}

export async function refreshShipmentTracking(
  bookingId: number | string
): Promise<ShipmentTracking> {
  return unwrapOne(
    await apiGet<ShipmentTracking | { data: ShipmentTracking }>(
      `/shipments-tracking/${bookingId}/refresh`
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
  id: number | string
): Promise<void> {
  await apiDelete<void>(`/shipments-tracking/${id}`);
}

export async function syncShipmentsTracking(): Promise<unknown> {
  return apiPost("/shipments-tracking/sync");
}

export async function listTrackingCarriers(): Promise<TrackingCarrier[]> {
  return unwrapList(
    await apiGet<TrackingCarrier[] | { data: TrackingCarrier[] }>(
      "/shipments-tracking/carriers"
    )
  );
}
