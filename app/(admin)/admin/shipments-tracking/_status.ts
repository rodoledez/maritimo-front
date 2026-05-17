import type { StatusTone } from "@/components/status-badge";
import type {
  ShipmentTrackingStatus,
  ShipsgoContainerStatus,
  ShipsgoMovementEvent,
} from "@/types/domain";

export const SHIPMENT_STATUS_LABEL: Record<ShipmentTrackingStatus, string> = {
  NEW: "Nuevo",
  INPROGRESS: "En proceso",
  BOOKED: "Reservado",
  LOADED: "Cargado",
  SAILING: "Navegando",
  ARRIVED: "Llegado",
  DISCHARGED: "Descargado",
  UNTRACKED: "Sin tracking",
};

export const SHIPMENT_STATUS_TONE: Record<ShipmentTrackingStatus, StatusTone> = {
  NEW: "pending",
  INPROGRESS: "warning",
  BOOKED: "pending",
  LOADED: "warning",
  SAILING: "warning",
  ARRIVED: "success",
  DISCHARGED: "success",
  UNTRACKED: "danger",
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

export function shipmentStatusLabel(status: ShipmentTrackingStatus | null | undefined): string {
  if (!status) return "—";
  return SHIPMENT_STATUS_LABEL[status] ?? status;
}

export function shipmentStatusTone(
  status: ShipmentTrackingStatus | null | undefined
): StatusTone {
  if (!status) return "neutral";
  return SHIPMENT_STATUS_TONE[status] ?? "neutral";
}
