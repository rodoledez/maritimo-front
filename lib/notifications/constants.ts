import type {
  NotificationEventType,
  NotificationLogStatus,
  NotificationReferenceField,
  NotificationTriggerType,
} from "@/types/domain";
import type { StatusTone } from "@/components/status-badge";

export const NOTIFICATION_EVENT_TYPES: NotificationEventType[] = [
  "GATE_OUT",
  "GATE_IN",
  "DEPARTURE",
  "TRANSSHIPMENT",
  "ARRIVAL",
  "POD_GATE_OUT",
  "EMPTY_RETURN",
];

export const NOTIFICATION_TRIGGER_TYPES: NotificationTriggerType[] = [
  "BEFORE_REFERENCE",
  "AFTER_REFERENCE",
  "AT_TIME_OF_DAY",
  "ON_EVENT",
  "PERIODIC",
];

export const NOTIFICATION_REFERENCE_FIELDS: NotificationReferenceField[] = [
  "CUTOFF",
  "LATE_ARRIVAL",
  "ETD",
  "ETA",
  "DEPARTURE_ACTUAL",
];

export const NOTIFICATION_LOG_STATUSES: NotificationLogStatus[] = [
  "SENT",
  "FAILED",
  "SKIPPED",
];

const EVENT_LABELS: Record<NotificationEventType, string> = {
  GATE_OUT: "Retiro contenedor (origen)",
  GATE_IN: "Ingreso a puerto",
  DEPARTURE: "Zarpe motonave",
  TRANSSHIPMENT: "Conexión / transbordo",
  ARRIVAL: "Arribo destino",
  POD_GATE_OUT: "Retiro contenedor (POD)",
  EMPTY_RETURN: "Devolución vacío",
};

const TRIGGER_LABELS: Record<NotificationTriggerType, string> = {
  BEFORE_REFERENCE: "Antes de fecha",
  AFTER_REFERENCE: "Después de fecha",
  AT_TIME_OF_DAY: "Hora del día",
  ON_EVENT: "Al ocurrir",
  PERIODIC: "Periódico",
};

const REFERENCE_LABELS: Record<NotificationReferenceField, string> = {
  CUTOFF: "Corte documental",
  LATE_ARRIVAL: "Late arrival",
  ETD: "ETD",
  ETA: "ETA",
  DEPARTURE_ACTUAL: "Zarpe real",
};

const LOG_STATUS_LABELS: Record<NotificationLogStatus, string> = {
  SENT: "Enviado",
  FAILED: "Falló",
  SKIPPED: "Omitido",
};

const LOG_STATUS_TONES: Record<NotificationLogStatus, StatusTone> = {
  SENT: "success",
  FAILED: "danger",
  SKIPPED: "neutral",
};

export function eventTypeLabel(value: NotificationEventType): string {
  return EVENT_LABELS[value] ?? value;
}

export function triggerTypeLabel(value: NotificationTriggerType): string {
  return TRIGGER_LABELS[value] ?? value;
}

export function referenceFieldLabel(value: NotificationReferenceField): string {
  return REFERENCE_LABELS[value] ?? value;
}

export function logStatusLabel(value: NotificationLogStatus): string {
  return LOG_STATUS_LABELS[value] ?? value;
}

export function logStatusTone(value: NotificationLogStatus): StatusTone {
  return LOG_STATUS_TONES[value] ?? "neutral";
}

export const TEMPLATE_VARIABLES: Array<{ name: string; description: string }> = [
  { name: "bookingNumber", description: "Número de booking del carrier" },
  { name: "opNumber", description: "Número de OP interno" },
  { name: "containerNumber", description: "Número de contenedor" },
  { name: "containerCount", description: "Cantidad de contenedores" },
  { name: "vessel", description: "Nombre de la motonave" },
  { name: "voyage", description: "Viaje" },
  { name: "carrier", description: "Naviera" },
  { name: "portOfLoading", description: "Puerto de carga (POL)" },
  { name: "portOfDischarge", description: "Puerto de descarga (POD)" },
  { name: "etd", description: "Fecha estimada de zarpe" },
  { name: "eta", description: "Fecha estimada de arribo" },
  { name: "clientName", description: "Nombre del cliente" },
  { name: "freeDaysRemaining", description: "Días libres restantes" },
];

const SAMPLE_DATA: Record<string, string> = {
  bookingNumber: "MEDU1234567",
  opNumber: "OP-2026-00123",
  containerNumber: "MSCU7654321",
  containerCount: "3",
  vessel: "MSC OSCAR",
  voyage: "FE2410W",
  carrier: "MSC",
  portOfLoading: "Valparaíso",
  portOfDischarge: "Shanghái",
  etd: "12-06-2026",
  eta: "14-07-2026",
  clientName: "Frutícola Ejemplo S.A.",
  freeDaysRemaining: "5",
};

const HANDLEBARS_PLACEHOLDER = /\{\{\s*([\w.]+)\s*\}\}/g;

export function renderHandlebarsPreview(
  template: string,
  data: Record<string, string> = SAMPLE_DATA
): string {
  return template.replace(HANDLEBARS_PLACEHOLDER, (_match, key: string) => {
    return data[key] ?? `{{${key}}}`;
  });
}
