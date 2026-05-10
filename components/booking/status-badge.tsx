import { StatusBadge, type StatusTone } from "@/components/status-badge";
import type { BookingStatus } from "@/types/domain";

const TONE: Record<BookingStatus, StatusTone> = {
  Confirmado: "success",
  Cancelado: "danger",
  Pendiente: "pending",
};

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  return <StatusBadge tone={TONE[status] ?? "pending"}>{status}</StatusBadge>;
}
