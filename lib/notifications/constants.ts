import type {
  BookingNotificationEventType,
  MilestoneNotifyState,
  NotificationEventType,
  NotificationLogStatus,
  NotificationReferenceField,
  NotificationTriggerType,
} from "@/types/domain";
import type { StatusTone } from "@/components/status-badge";

/**
 * Los 7 hitos por reserva. Es la lista que deben ofrecer los selectores de
 * **reglas** y de **envío manual por reserva**: el backend rechaza
 * `WEEKLY_SUMMARY` en esos endpoints con 400.
 */
export const BOOKING_EVENT_TYPES: BookingNotificationEventType[] = [
  "GATE_OUT",
  "GATE_IN",
  "DEPARTURE",
  "TRANSSHIPMENT",
  "ARRIVAL",
  "POD_GATE_OUT",
  "EMPTY_RETURN",
];

/**
 * Enum completo (8 valores). Sirve para **plantillas**, **contactos** y el
 * **filtro del log**, que sí aceptan `WEEKLY_SUMMARY`. Para reglas y envío por
 * reserva usar `BOOKING_EVENT_TYPES`.
 */
export const NOTIFICATION_EVENT_TYPES: NotificationEventType[] = [
  ...BOOKING_EVENT_TYPES,
  "WEEKLY_SUMMARY",
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
  GATE_OUT: "Retiro de contenedor",
  GATE_IN: "Ingreso a puerto",
  DEPARTURE: "Zarpe",
  TRANSSHIPMENT: "Transbordo",
  ARRIVAL: "Arribo",
  POD_GATE_OUT: "Retiro en destino",
  EMPTY_RETURN: "Devolución de vacío",
  WEEKLY_SUMMARY: "Resumen semanal",
};

/**
 * El `eventType` de una regla ES el hito de ShipsGo: los 7 valores por reserva
 * mapean 1:1 contra los movimientos que devuelve la API de tracking
 * (ver MOVEMENT_EVENT_LABEL en app/(admin)/admin/shipments-tracking/_status.ts).
 * `WEEKLY_SUMMARY` queda fuera: no es un hito, es un resumen por cliente.
 */
const EVENT_SHIPSGO_MOVEMENTS: Record<
  BookingNotificationEventType,
  { code: string; description: string }
> = {
  GATE_OUT: { code: "EMSH", description: "Vacío retirado" },
  GATE_IN: { code: "GTIN", description: "Ingreso a puerto" },
  DEPARTURE: { code: "DEPA", description: "Zarpe" },
  TRANSSHIPMENT: {
    code: "ARRV / DEPA",
    description: "Arribos y zarpes intermedios",
  },
  ARRIVAL: { code: "ARRV", description: "Arribo final" },
  POD_GATE_OUT: { code: "GTOT", description: "Retiro en destino" },
  EMPTY_RETURN: { code: "EMRT", description: "Devolución de vacío" },
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
  LATE_ARRIVAL: "Listado Late arrival",
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

/**
 * Etiquetas del badge de aviso de un hito. `SUPPRESSED_BACKLOG` y `SKIPPED`
 * comparten copy: para el usuario ambos son "no avisado" (en `SKIPPED` el
 * motivo viaja en `notifyNote`).
 */
const MILESTONE_NOTIFY_LABELS: Record<MilestoneNotifyState, string> = {
  SENT: "Avisado",
  PENDING: "Por avisar",
  SUPPRESSED_BACKLOG: "No avisado",
  SKIPPED: "No avisado",
};

const MILESTONE_NOTIFY_TONES: Record<MilestoneNotifyState, StatusTone> = {
  SENT: "success",
  PENDING: "pending",
  SUPPRESSED_BACKLOG: "neutral",
  SKIPPED: "neutral",
};

export function eventTypeLabel(value: NotificationEventType): string {
  return EVENT_LABELS[value] ?? value;
}

export function eventShipsgoMovement(value: BookingNotificationEventType): {
  code: string;
  description: string;
} {
  return EVENT_SHIPSGO_MOVEMENTS[value] ?? { code: "—", description: "—" };
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

export function milestoneNotifyLabel(value: MilestoneNotifyState): string {
  return MILESTONE_NOTIFY_LABELS[value] ?? value;
}

export function milestoneNotifyTone(value: MilestoneNotifyState): StatusTone {
  return MILESTONE_NOTIFY_TONES[value] ?? "neutral";
}

/**
 * Resumen legible del disparo de una regla. Acepta tanto una `NotificationRule`
 * completa como el resumen embebido en `NotificationTemplate.rules`.
 */
export function triggerSummary(rule: {
  triggerType: NotificationTriggerType;
  referenceField?: NotificationReferenceField | null;
  offsetHours?: number | null;
  atTimeOfDay?: string | null;
  recurrenceHours?: number | null;
  maxRecurrences?: number | null;
}): string {
  switch (rule.triggerType) {
    case "BEFORE_REFERENCE":
      return `${rule.offsetHours ?? "?"}h antes de ${
        rule.referenceField ? referenceFieldLabel(rule.referenceField) : "—"
      }`;
    case "AFTER_REFERENCE":
      return `${rule.offsetHours ?? "?"}h después de ${
        rule.referenceField ? referenceFieldLabel(rule.referenceField) : "—"
      }`;
    case "AT_TIME_OF_DAY":
      return `Cada día a las ${rule.atTimeOfDay ?? "—"}`;
    case "PERIODIC": {
      const base = `Cada ${rule.recurrenceHours ?? "?"}h`;
      return rule.maxRecurrences ? `${base} (máx ${rule.maxRecurrences})` : base;
    }
    case "ON_EVENT":
      return "Al ocurrir el evento";
    default:
      return triggerTypeLabel(rule.triggerType);
  }
}

export type TemplateVariable = { name: string; description: string };

/** Variables del contexto de **una reserva** (los 7 hitos por reserva). */
export const TEMPLATE_VARIABLES: TemplateVariable[] = [
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

/**
 * Variables del contexto de **un cliente**, no de una reserva: `WEEKLY_SUMMARY`
 * recibe la lista completa de embarques en curso. Por eso el panel de variables
 * de la pantalla de plantillas cambia según el evento elegido.
 */
export const WEEKLY_SUMMARY_TEMPLATE_VARIABLES: TemplateVariable[] = [
  { name: "clientName", description: "Nombre del cliente" },
  { name: "slotLabel", description: "Etiqueta del envío (día y hora)" },
  { name: "timezone", description: "Zona horaria de la programación" },
  { name: "url", description: "Enlace al portal" },
  { name: "bookingCount", description: "Embarques incluidos en el correo" },
  { name: "totalCount", description: "Embarques en curso del cliente" },
  { name: "containerCount", description: "Contenedores en total" },
  { name: "hasBookings", description: "`true` si hay embarques que mostrar" },
  { name: "truncated", description: "`true` si se recortó la lista" },
  { name: "truncatedCount", description: "Embarques omitidos por el recorte" },
  { name: "counts.enTransito", description: "Embarques en tránsito" },
  { name: "counts.arribados", description: "Embarques arribados" },
  { name: "counts.atrasados", description: "Embarques atrasados" },
  { name: "counts.sinZarpar", description: "Embarques sin zarpar" },
  {
    name: "bookings",
    description:
      "Lista de embarques: opNumber, bookingNumber, blNumber, carrier, vessel, voyage, pol, pod, etd, eta, status, statusCode, transitPercentage, delayDays, isDelayed, alertLevel, lastMilestone, containerCount, hasContainers, containers[] { number, status, sizeType }",
  },
];

export function templateVariablesFor(
  eventType: NotificationEventType
): TemplateVariable[] {
  return eventType === "WEEKLY_SUMMARY"
    ? WEEKLY_SUMMARY_TEMPLATE_VARIABLES
    : TEMPLATE_VARIABLES;
}

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

const WEEKLY_SUMMARY_SAMPLE_DATA: Record<string, string> = {
  clientName: "Frutícola Ejemplo S.A.",
  slotLabel: "Miércoles 09:00",
  timezone: "America/Santiago",
  url: "https://portal.acostayaguayo.cl",
  bookingCount: "8",
  totalCount: "8",
  containerCount: "21",
  hasBookings: "true",
  truncated: "false",
  truncatedCount: "0",
  "counts.enTransito": "5",
  "counts.arribados": "2",
  "counts.atrasados": "1",
  "counts.sinZarpar": "0",
};

export function sampleDataFor(
  eventType: NotificationEventType
): Record<string, string> {
  return eventType === "WEEKLY_SUMMARY"
    ? WEEKLY_SUMMARY_SAMPLE_DATA
    : SAMPLE_DATA;
}

const HANDLEBARS_PLACEHOLDER = /\{\{\s*([\w.]+)\s*\}\}/g;

export function renderHandlebarsPreview(
  template: string,
  data: Record<string, string> = SAMPLE_DATA
): string {
  return template.replace(HANDLEBARS_PLACEHOLDER, (_match, key: string) => {
    return data[key] ?? `{{${key}}}`;
  });
}
