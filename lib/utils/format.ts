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
