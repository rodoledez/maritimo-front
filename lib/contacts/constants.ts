import type { ContactCategory } from "@/types/domain";
import type { StatusTone } from "@/components/status-badge";

export const CONTACT_CATEGORIES: ContactCategory[] = ["BOOKING", "TRACKING"];

const CATEGORY_LABELS: Record<ContactCategory, string> = {
  BOOKING: "Contacto Booking",
  TRACKING: "Contacto Tracking",
};

const CATEGORY_DESCRIPTIONS: Record<ContactCategory, string> = {
  BOOKING: "Recibe confirmaciones de reserva.",
  TRACKING: "Recibe eventos de seguimiento.",
};

const CATEGORY_TONES: Record<ContactCategory, StatusTone> = {
  BOOKING: "pending",
  TRACKING: "success",
};

export function contactCategoryLabel(value: ContactCategory): string {
  return CATEGORY_LABELS[value] ?? value;
}

export function contactCategoryDescription(value: ContactCategory): string {
  return CATEGORY_DESCRIPTIONS[value] ?? "";
}

export function contactCategoryTone(value: ContactCategory): StatusTone {
  return CATEGORY_TONES[value] ?? "neutral";
}
