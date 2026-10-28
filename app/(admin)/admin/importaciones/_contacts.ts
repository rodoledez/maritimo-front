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
