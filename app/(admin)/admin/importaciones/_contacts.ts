import type {
  ImportShipment,
  OdooConsigneeContact,
  OdooTrackingContact,
} from "@/types/domain";

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

export function hasTrackingTag(contact: OdooConsigneeContact): boolean {
  return contact.tags.some((tag) => normalizeTag(tag.name) === TRACKING_TAG);
}

/** Igual que el backend: emails separados por coma o punto y coma. */
function splitEmails(value: string | null): string[] {
  return (value ?? "")
    .split(/[,;]/)
    .map((e) => e.trim())
    .filter(Boolean);
}

function activeList(shipment: ImportShipment): OdooTrackingContact[] {
  return (shipment.trackingContacts ?? []).filter((c) => c.active);
}

/**
 * ¿Recibe los hitos? Por la lista de tracking del cliente en Odoo o por la
 * etiqueta «tracking» en el contacto.
 */
export function receivesTracking(
  contact: OdooConsigneeContact,
  shipment: ImportShipment
): boolean {
  return (
    hasTrackingTag(contact) ||
    activeList(shipment).some((c) => c.partnerOdooId === contact.odooId)
  );
}

/**
 * Destinatarios de los emails de hitos, en el mismo orden que el backend:
 * primero la lista de tracking del cliente, luego los contactos activos del
 * consignatario con la etiqueta. Sin repetidos.
 */
export function trackingRecipientEmails(shipment: ImportShipment): string[] {
  const tagged = (shipment.contacts ?? []).filter(
    (c) => c.active && hasTrackingTag(c)
  );
  const seen = new Set<string>();
  const emails: string[] = [];
  for (const c of [...activeList(shipment), ...tagged]) {
    for (const email of splitEmails(c.email)) {
      const key = email.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        emails.push(email);
      }
    }
  }
  return emails;
}
