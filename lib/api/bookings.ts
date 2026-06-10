import {
  apiGet,
  apiPost,
  apiPut,
} from "@/lib/api/client";
import { unwrapList, unwrapOne } from "@/lib/api/_shared";
import type { Booking } from "@/types/domain";

export type BookingPayload = Partial<Booking> & {
  itinerary_id?: number | string;
  client_id?: number | string;
};

export type BookingConfirmPayload = {
  booking?: string;
  blNo?: string;
  depotId?: number;
  terminalId?: number;
  stackingMode?: "CONTINUOUS" | "DAILY";
  stackingStart?: string;
  stackingEnd?: string;
  stackingOpenTime?: string;
  stackingCloseTime?: string;
  cutOff?: string;
  lateArrival?: string;
  demurrageDays?: number;
  detentionDays?: number;
  reeferPlugInDays?: number;
  statusNotes?: string;
};

export type BookingCancelPayload = {
  statusNotes: string;
};

export async function listBookings(): Promise<Booking[]> {
  return unwrapList(await apiGet<Booking[] | { data: Booking[] }>("/bookings"));
}

export async function listBookingsByClient(
  clientId: number | string
): Promise<Booking[]> {
  const raw = await apiGet<
    Booking[] | { Bookings?: Booking[]; data?: Booking[] }
  >(`/clients/${clientId}/bookings`);
  if (Array.isArray(raw)) return raw;
  if (raw && "Bookings" in raw && Array.isArray(raw.Bookings)) return raw.Bookings;
  return unwrapList(raw as { data: Booking[] });
}

export async function createBooking(payload: BookingPayload): Promise<Booking> {
  return unwrapOne(await apiPost<Booking | { data: Booking }>("/bookings", payload));
}

export async function updateBooking(
  id: Booking["id"],
  payload: BookingPayload
): Promise<Booking> {
  return unwrapOne(
    await apiPut<Booking | { data: Booking }>(`/bookings/${id}`, payload)
  );
}

export function confirmBooking(
  id: Booking["id"],
  payload: BookingConfirmPayload
): Promise<unknown> {
  return apiPut<unknown>(`/bookings/${id}/confirm`, { id, ...payload });
}

export function cancelBooking(
  id: Booking["id"],
  payload: BookingCancelPayload
): Promise<unknown> {
  return apiPut<unknown>(`/bookings/${id}/cancel`, payload);
}
