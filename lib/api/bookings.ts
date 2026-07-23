import {
  apiGet,
  apiPost,
  apiPut,
} from "@/lib/api/client";
import { unwrapList, unwrapOne, unwrapPaginated } from "@/lib/api/_shared";
import type {
  Booking,
  PaginatedResponse,
  ShipmentTracking,
  StackingDaySchedule,
} from "@/types/domain";

export type BookingPayload = Partial<Booking> & {
  itinerary_id?: number | string;
  client_id?: number | string;
};

/** Parámetros de `GET /bookings` (paginado + búsqueda libre + filtro de estado). */
export type BookingListParams = {
  /** Página 1-based. */
  page?: number;
  /** Filas por página (default backend 25, máx 200). */
  pageSize?: number;
  /**
   * Búsqueda libre sobre booking, BL, especie, estado, cliente, itinerario y
   * depósito/terminal.
   */
  search?: string;
  /** Filtra por estado exacto. */
  status?: "Pendiente" | "Confirmado" | "Cancelado";
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

/**
 * El backend persiste cada día del stacking como `{ date, openTime, closeTime }`
 * (ver `toWireStackingSchedule`), pero internamente usamos
 * `{ day, startTime, endTime }`. Traducimos de vuelta al recibir para que los
 * diálogos (detalle / actualizar confirmación) lean los campos correctos.
 */
function fromWireStackingSchedule(
  schedule: Booking["stackingSchedule"]
): StackingDaySchedule[] | null | undefined {
  if (!Array.isArray(schedule)) return schedule;
  return schedule.map((row) => {
    const r = row as Partial<StackingDaySchedule> & {
      date?: string;
      openTime?: string;
      closeTime?: string;
    };
    return {
      day: r.day ?? r.date ?? "",
      startTime: r.startTime ?? r.openTime ?? "",
      endTime: r.endTime ?? r.closeTime ?? "",
    };
  });
}

function normalizeBooking(booking: Booking): Booking {
  if (booking == null) return booking;
  const next: Booking = { ...booking };
  if (booking.stackingMode != null) {
    next.stackingMode = fromWireStackingMode(booking.stackingMode);
  }
  if (booking.stackingSchedule != null) {
    next.stackingSchedule = fromWireStackingSchedule(booking.stackingSchedule);
  }
  return next;
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

/** Una página de reservas desde `GET /bookings` (paginado + búsqueda libre). */
export async function listBookingsPage(
  params: BookingListParams = {}
): Promise<PaginatedResponse<Booking>> {
  return unwrapPaginated<Booking>(
    await apiGet<unknown>("/bookings", { params }),
    params,
    normalizeBooking
  );
}

/**
 * Todas las reservas, recorriendo internamente las páginas. Se usa donde la UI
 * necesita el listado completo como lookup (selección de bookings confirmados,
 * cálculo de free-days, etc.) y no una tabla paginada.
 */
export async function listBookings(): Promise<Booking[]> {
  const pageSize = 200; // máximo documentado por el backend
  const all: Booking[] = [];
  for (let page = 1; page <= 50; page++) {
    const res = await listBookingsPage({ page, pageSize });
    all.push(...res.rows);
    if (res.rows.length < pageSize || all.length >= res.total) break;
  }
  return all;
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

/**
 * El backend espera cada día del stacking como `{ date, openTime, closeTime }`
 * (con `date` en formato ISO 8601), mientras que internamente usamos
 * `{ day, startTime, endTime }`. Traducimos en el borde de la API.
 */
function toWireStackingSchedule(
  schedule: StackingDaySchedule[] | undefined
): { date: string; openTime: string; closeTime: string }[] | undefined {
  if (!schedule) return undefined;
  return schedule.map((row) => ({
    date: row.day,
    openTime: row.startTime,
    closeTime: row.endTime,
  }));
}

export function confirmBooking(
  id: Booking["id"],
  payload: BookingConfirmPayload
): Promise<unknown> {
  return apiPut<unknown>(`/bookings/${id}/confirm`, {
    id,
    ...payload,
    stackingMode: toWireStackingMode(payload.stackingMode),
    stackingSchedule: toWireStackingSchedule(payload.stackingSchedule),
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
    stackingSchedule: toWireStackingSchedule(payload.stackingSchedule),
  });
}

export function cancelBooking(
  id: Booking["id"],
  payload: BookingCancelPayload
): Promise<unknown> {
  return apiPut<unknown>(`/bookings/${id}/cancel`, payload);
}

/**
 * Integra una reserva confirmada con ShipsGo (`POST /bookings/:id/shipsgo-integrate`),
 * creando el shipment de tracking asociado. El backend rechaza la doble
 * integración; el error se propaga para mostrarlo por toast.
 */
export async function integrateBookingWithShipsgo(
  id: Booking["id"]
): Promise<ShipmentTracking> {
  return unwrapOne(
    await apiPost<ShipmentTracking | { data: ShipmentTracking }>(
      `/bookings/${id}/shipsgo-integrate`
    )
  );
}
