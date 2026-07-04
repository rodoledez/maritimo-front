import {
  apiGet,
  apiPost,
  apiPut,
} from "@/lib/api/client";
import { unwrapList, unwrapOne } from "@/lib/api/_shared";
import type {
  Booking,
  PaginatedResponse,
  StackingDaySchedule,
} from "@/types/domain";

export type BookingPayload = Partial<Booking> & {
  itinerary_id?: number | string;
  client_id?: number | string;
};

/** Parámetros de `GET /bookings` (paginado + búsqueda libre). */
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

function toNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    if (!Number.isNaN(n)) return n;
  }
  return undefined;
}

function buildQuery(params: Record<string, unknown>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.append(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

/**
 * El backend documenta la respuesta como un array plano, pero en runtime este
 * endpoint pagina. Aceptamos ambas formas (envoltorio `{ rows, total }` /
 * `{ data, total }` / `{ items }` o array plano) y normalizamos al contrato
 * `PaginatedResponse` que ya usa el resto de la app.
 */
function unwrapPaginatedBookings(
  value: unknown,
  params: BookingListParams
): PaginatedResponse<Booking> {
  const pageSize = params.pageSize ?? 25;
  const pageNo = params.page ?? 1;
  const fallbackPage = { skip: (pageNo - 1) * pageSize, take: pageSize };

  if (value && typeof value === "object" && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    const rowsRaw =
      (Array.isArray(obj.rows) && obj.rows) ||
      (Array.isArray(obj.data) && obj.data) ||
      (Array.isArray(obj.items) && obj.items) ||
      null;
    if (rowsRaw) {
      const rows = (rowsRaw as Booking[]).map(normalizeBooking);
      const total =
        toNumber(obj.total) ??
        toNumber(obj.totalItems) ??
        toNumber(obj.count) ??
        rows.length;
      const page =
        obj.page && typeof obj.page === "object"
          ? (obj.page as { skip: number; take: number })
          : fallbackPage;
      return { rows, total, page };
    }
  }

  const rows = unwrapList(value as Booking[] | { data: Booking[] }).map(
    normalizeBooking
  );
  return { rows, total: rows.length, page: fallbackPage };
}

/** Una página de reservas desde `GET /bookings` (paginado + búsqueda libre). */
export async function listBookingsPage(
  params: BookingListParams = {}
): Promise<PaginatedResponse<Booking>> {
  return unwrapPaginatedBookings(
    await apiGet<unknown>(`/bookings${buildQuery(params)}`),
    params
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
