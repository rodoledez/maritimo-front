import {
  apiGet,
  apiPost,
  apiPut,
} from "@/lib/api/client";
import { unwrapList, unwrapOne } from "@/lib/api/_shared";
import type { Booking, StackingDaySchedule } from "@/types/domain";

export type BookingPayload = Partial<Booking> & {
  itinerary_id?: number | string;
  client_id?: number | string;
};

/**
 * La UI maneja `stackingMode` en MAYÚSCULAS (`CONTINUOUS` / `DAILY`), pero el
 * backend valida/persiste en minúsculas (`continuous` / `daily`). Normalizamos
 * en la frontera de la API: minúsculas al enviar, MAYÚSCULAS al recibir.
 */
function toWireStackingMode(
  mode: "CONTINUOUS" | "DAILY" | null | undefined
): "continuous" | "daily" | undefined {
  if (mode === "CONTINUOUS") return "continuous";
  if (mode === "DAILY") return "daily";
  return undefined;
}

function fromWireStackingMode(mode: unknown): "CONTINUOUS" | "DAILY" | null {
  const m = typeof mode === "string" ? mode.toUpperCase() : mode;
  if (m === "CONTINUOUS") return "CONTINUOUS";
  if (m === "DAILY") return "DAILY";
  return null;
}

function normalizeBooking(booking: Booking): Booking {
  if (booking?.stackingMode == null) return booking;
  return { ...booking, stackingMode: fromWireStackingMode(booking.stackingMode) };
}

export type BookingConfirmPayload = {
  booking?: string;
  blNo?: string;
  depotId?: number;
  terminalId?: number;
  stackingMode?: "CONTINUOUS" | "DAILY";
  stackingStart?: string;
  stackingEnd?: string;
  stackingSchedule?: StackingDaySchedule[];
  cutOff?: string;
  lateArrival?: string;
  demurrageDays?: number;
  detentionDays?: number;
  reeferPlugInDays?: number;
  statusNotes?: string;
};

/**
 * Payload de `PUT /bookings/:id/update-confirmation`. A diferencia de
 * `confirm`, permite reeditar TODOS los datos de una reserva ya confirmada
 * (carga + logística + stacking) manteniendo el estado "Confirmado".
 */
export type BookingUpdateConfirmationPayload = BookingConfirmPayload & {
  specie?: string | null;
  typeContainer?: string | null;
  typeFreight?: string;
  qtyContainers?: number;
  temperature?: number | null;
  ventilation?: string | null;
  bl?: string;
  isATM?: boolean;
  isColdTreatment?: boolean;
  vgm?: string;
  humidity?: number | null;
  description?: string | null;
};

export type BookingCancelPayload = {
  statusNotes: string;
};

/**
 * Borrador devuelto por `GET /bookings/:id/copy`. Contiene únicamente la
 * información comercial/operacional copiable (carga + itinerario), lista para
 * crear una nueva reserva. Los campos dinámicos (booking, BL, stacking, corte
 * documental, depósito, etc.) NO vienen incluidos.
 */
export type BookingCopyDraft = BookingPayload;

export async function listBookings(): Promise<Booking[]> {
  return unwrapList(
    await apiGet<Booking[] | { data: Booking[] }>("/bookings")
  ).map(normalizeBooking);
}

export async function listBookingsByClient(
  clientId: number | string
): Promise<Booking[]> {
  const raw = await apiGet<
    Booking[] | { Bookings?: Booking[]; data?: Booking[] }
  >(`/clients/${clientId}/bookings`);
  if (Array.isArray(raw)) return raw.map(normalizeBooking);
  if (raw && "Bookings" in raw && Array.isArray(raw.Bookings))
    return raw.Bookings.map(normalizeBooking);
  return unwrapList(raw as { data: Booking[] }).map(normalizeBooking);
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

export async function copyBooking(
  id: Booking["id"]
): Promise<BookingCopyDraft> {
  return unwrapOne(
    await apiGet<BookingCopyDraft | { data: BookingCopyDraft }>(
      `/bookings/${id}/copy`
    )
  );
}

export function confirmBooking(
  id: Booking["id"],
  payload: BookingConfirmPayload
): Promise<unknown> {
  return apiPut<unknown>(`/bookings/${id}/confirm`, {
    id,
    ...payload,
    stackingMode: toWireStackingMode(payload.stackingMode),
  });
}

export function updateConfirmation(
  id: Booking["id"],
  payload: BookingUpdateConfirmationPayload
): Promise<unknown> {
  return apiPut<unknown>(`/bookings/${id}/update-confirmation`, {
    id,
    ...payload,
    stackingMode: toWireStackingMode(payload.stackingMode),
  });
}

export function cancelBooking(
  id: Booking["id"],
  payload: BookingCancelPayload
): Promise<unknown> {
  return apiPut<unknown>(`/bookings/${id}/cancel`, payload);
}
