import type { StatusTone } from "@/components/status-badge";
import type { WeeklySummaryStatus } from "@/types/domain";

/**
 * `dayOfWeek` sigue la convención de `Date#getUTCDay()`: **0 = domingo, 1 =
 * lunes … 6 = sábado**. NO es ISO-8601 (donde 1 es lunes). Si el selector se
 * arma con un mapeo ISO, todos los envíos salen corridos un día.
 */
export const DAYS_OF_WEEK: Array<{ value: number; label: string }> = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
];

export function dayOfWeekLabel(value: number): string {
  return DAYS_OF_WEEK.find((d) => d.value === value)?.label ?? String(value);
}

export const DEFAULT_TIMEZONE = "America/Santiago";
export const DEFAULT_TIME_OF_DAY = "09:00";

/** Fallback cuando el runtime no expone `Intl.supportedValuesOf`. */
const FALLBACK_TIMEZONES = [
  "America/Santiago",
  "America/Punta_Arenas",
  "Pacific/Easter",
  "America/Argentina/Buenos_Aires",
  "America/Bogota",
  "America/Lima",
  "America/Mexico_City",
  "America/Sao_Paulo",
  "America/New_York",
  "Europe/Madrid",
  "Europe/London",
  "Asia/Shanghai",
  "Asia/Singapore",
  "UTC",
];

export function supportedTimezones(): string[] {
  const supportedValuesOf = (
    Intl as unknown as {
      supportedValuesOf?: (key: string) => string[];
    }
  ).supportedValuesOf;
  if (typeof supportedValuesOf === "function") {
    try {
      const zones = supportedValuesOf("timeZone");
      if (Array.isArray(zones) && zones.length > 0) return zones;
    } catch {
      // cae al fallback
    }
  }
  return FALLBACK_TIMEZONES;
}

/**
 * "Miércoles 09:00 (America/Santiago)". `timeOfDay` es hora de pared: se
 * muestra tal cual, nunca convertida.
 */
export function scheduleSlotLabel(schedule: {
  dayOfWeek: number;
  timeOfDay: string;
  timezone: string;
}): string {
  return `${dayOfWeekLabel(schedule.dayOfWeek)} ${schedule.timeOfDay} (${schedule.timezone})`;
}

const STATUS_LABELS: Record<WeeklySummaryStatus, string> = {
  SENT: "Enviado",
  SKIPPED: "Omitido",
  FAILED: "Falló",
  WOULD_SEND: "Se enviaría",
};

const STATUS_TONES: Record<WeeklySummaryStatus, StatusTone> = {
  SENT: "success",
  SKIPPED: "neutral",
  FAILED: "danger",
  WOULD_SEND: "pending",
};

export function weeklySummaryStatusLabel(value: WeeklySummaryStatus): string {
  return STATUS_LABELS[value] ?? value;
}

export function weeklySummaryStatusTone(value: WeeklySummaryStatus): StatusTone {
  return STATUS_TONES[value] ?? "neutral";
}

/**
 * `lastResult` es texto libre con la forma `SENT`, `SKIPPED: motivo` o
 * `FAILED: motivo`. Devuelve el estado para colorear el badge, o `null` si el
 * texto no empieza con un estado conocido.
 */
export function parseLastResult(
  value: string | null
): { status: WeeklySummaryStatus; reason: string | null } | null {
  if (!value) return null;
  const [head, ...rest] = value.split(":");
  const status = head.trim().toUpperCase();
  if (!(status in STATUS_LABELS)) return null;
  const reason = rest.join(":").trim();
  return { status: status as WeeklySummaryStatus, reason: reason || null };
}

const EMAIL_SEPARATORS = /[,;]/;

/** Separa la lista de `recipientEmails` (separada por `,` o `;`). */
export function splitRecipientEmails(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(EMAIL_SEPARATORS)
    .map((e) => e.trim())
    .filter(Boolean);
}
