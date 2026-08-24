/**
 * Returns a display string for a value that may be a plain string OR a
 * joined association row of shape { name }. Used for Itinerary.portDeparture,
 * portDestination, countryDestination — whose API shape can vary.
 */
export function assocLabel(
  value: string | { name?: string | null } | null | undefined
): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  return value.name ?? "";
}

export function formatDate(value?: string | Date | null): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  const dd = String(date.getUTCDate()).padStart(2, "0");
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const yyyy = date.getUTCFullYear();
  return `${dd}-${mm}-${yyyy}`;
}

export function formatDateTime(value?: string | Date | null): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  const hh = String(date.getHours()).padStart(2, "0");
  const mins = String(date.getMinutes()).padStart(2, "0");
  return `${dd}-${mm}-${yyyy} ${hh}:${mins}`;
}

/**
 * Formatea un instante UTC en una zona IANA concreta, no en la del navegador.
 * Lo necesitan `nextSlotAt` / `lastSentAt` del resumen semanal: si se
 * formatean en la zona del equipo, la pantalla muestra una hora distinta de la
 * que el usuario acaba de escribir en `timeOfDay` y parece un bug del backend.
 */
export function formatDateTimeInZone(
  value: string | Date | null | undefined,
  timeZone: string
): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  try {
    return new Intl.DateTimeFormat("es-CL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone,
    })
      .format(date)
      .replace(",", "");
  } catch {
    // Zona inválida o no soportada por el runtime: mejor la del navegador que nada.
    return formatDateTime(date);
  }
}
