import type { StatusTone } from "@/components/status-badge";
import type {
  BookingShipsgoStatus,
  ShipsgoContainerStatus,
  ShipsgoMovementEvent,
  TrackingSource,
} from "@/types/domain";

/**
 * `NAVIERA_NO_INTEGRADA` no es un estado de ShipsGo: significa que la naviera
 * del itinerario no se integra, así que la reserva nunca va a tener tracking.
 * Se muestra en gris (neutral) para no leerse ni como error ni como tránsito,
 * y para distinguirse de `null`, que se muestra como "—" ("todavía no").
 */
export const NO_SHIPSGO_INTEGRATION = "NAVIERA_NO_INTEGRADA" as const;

export const SHIPMENT_STATUS_LABEL: Record<BookingShipsgoStatus, string> = {
  NEW: "Nuevo",
  INPROGRESS: "En proceso",
  BOOKED: "Reservado",
  LOADED: "Cargado",
  SAILING: "Navegando",
  ARRIVED: "Llegado",
  DISCHARGED: "Descargado",
  UNTRACKED: "Sin tracking",
  NAVIERA_NO_INTEGRADA: "Naviera no integrada",
};

export const SHIPMENT_STATUS_TONE: Record<BookingShipsgoStatus, StatusTone> = {
  NEW: "pending",
  INPROGRESS: "warning",
  BOOKED: "pending",
  LOADED: "warning",
  SAILING: "warning",
  ARRIVED: "success",
  DISCHARGED: "success",
  UNTRACKED: "danger",
  NAVIERA_NO_INTEGRADA: "neutral",
};

export const CONTAINER_STATUS_LABEL: Record<ShipsgoContainerStatus, string> = {
  EMPTY_SHIPPER: "Vacío en shipper",
  GATE_IN: "Gate-in",
  LOADED: "Cargado",
  SAILING: "Navegando",
  ARRIVED: "Llegado",
  DISCHARGED: "Descargado",
  GATE_OUT: "Gate-out",
  EMPTY_RETURN: "Vacío retornado",
  UNKNOWN: "Desconocido",
};

export const CONTAINER_STATUS_TONE: Record<ShipsgoContainerStatus, StatusTone> = {
  EMPTY_SHIPPER: "neutral",
  GATE_IN: "pending",
  LOADED: "warning",
  SAILING: "warning",
  ARRIVED: "success",
  DISCHARGED: "success",
  GATE_OUT: "success",
  EMPTY_RETURN: "neutral",
  UNKNOWN: "neutral",
};

export const MOVEMENT_EVENT_LABEL: Record<ShipsgoMovementEvent, string> = {
  EMSH: "Vacío a shipper",
  GTIN: "Gate-in",
  LOAD: "Cargado a bordo",
  DEPA: "Zarpe",
  ARRV: "Arribo",
  DISC: "Descarga",
  GTOT: "Gate-out",
  EMRT: "Vacío retornado",
};

export function shipmentStatusLabel(
  status: BookingShipsgoStatus | null | undefined
): string {
  if (!status) return "—";
  return SHIPMENT_STATUS_LABEL[status] ?? status;
}

export function shipmentStatusTone(
  status: BookingShipsgoStatus | null | undefined
): StatusTone {
  if (!status) return "neutral";
  return SHIPMENT_STATUS_TONE[status] ?? "neutral";
}

/** La naviera del itinerario no se integra: nunca va a haber tracking. */
export function isNoShipsgoIntegration(
  status: BookingShipsgoStatus | null | undefined
): boolean {
  return status === NO_SHIPSGO_INTEGRATION;
}

/** Tracking cargado a mano por un operador (naviera sin integración ShipsGo). */
export function isManualTracking(
  tracking: { trackingSource?: TrackingSource | null } | null | undefined
): boolean {
  return tracking?.trackingSource === "MANUAL";
}

/** Número que usa el backend para el contenedor aún sin número real. */
export const NOT_ASSIGNED_CONTAINER = "NOT_ASSIGNED";

export function containerNumberLabel(number: string): string {
  return number === NOT_ASSIGNED_CONTAINER ? "Sin asignar" : number;
}

/** Mayúsculas y sin espacios, igual que normaliza el backend. */
export function normalizeContainerNumber(value: string): string {
  return value.replace(/\s+/g, "").toUpperCase();
}

/** UN/LOCODE: país (2 letras) + ubicación (3 alfanuméricos), p.ej. `CLSAI`. */
export const UNLOCODE_RE = /^[A-Z]{2}[A-Z0-9]{3}$/;

/** Orden lógico del viaje, para el selector de eventos. */
export const MOVEMENT_EVENTS: ShipsgoMovementEvent[] = [
  "EMSH",
  "GTIN",
  "LOAD",
  "DEPA",
  "ARRV",
  "DISC",
  "GTOT",
  "EMRT",
];

/**
 * Eventos cuyo UN/LOCODE es obligatorio: el backend lo compara con POL/POD
 * para distinguir zarpe de origen, transbordo y arribo a destino.
 */
export const EVENTS_REQUIRING_LOCODE: ShipsgoMovementEvent[] = [
  "DEPA",
  "ARRV",
  "DISC",
];
