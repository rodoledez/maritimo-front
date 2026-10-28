import type { OdooConsigneeContact } from "@/types/domain";

/** Emails distintos (sin vacíos) de los contactos de un consignatario. */
export function contactEmails(contacts: OdooConsigneeContact[]): string[] {
  const seen = new Set<string>();
  for (const c of contacts) {
    const email = c.email?.trim();
    if (email) seen.add(email.toLowerCase());
  }
  return [...seen];
}

/**
 * Etiqueta de Odoo que marca a los contactos que reciben los emails
 * automáticos de hitos de la importación.
 */
export const TRACKING_TAG = "tracking";

/** Igual que el backend: sin distinguir mayúsculas ni acentos. */
function normalizeTag(name: string): string {
  return name
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLowerCase();
}

export function receivesTracking(contact: OdooConsigneeContact): boolean {
  return contact.tags.some((tag) => normalizeTag(tag.name) === TRACKING_TAG);
}
