import { AlertCircle, Check, X } from "lucide-react";

import type { BookingStatus } from "@/types/domain";

const CONFIG: Record<
  BookingStatus,
  { label: string; className: string; Icon: typeof Check }
> = {
  Confirmado: {
    label: "Confirmado",
    className: "bg-brand-success/15 text-brand-success",
    Icon: Check,
  },
  Cancelado: {
    label: "Cancelado",
    className: "bg-brand-danger/15 text-brand-danger",
    Icon: X,
  },
  Pendiente: {
    label: "Pendiente",
    className: "bg-brand-warning/15 text-brand-warning",
    Icon: AlertCircle,
  },
};

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const cfg = CONFIG[status] ?? CONFIG.Pendiente;
  const { Icon, className, label } = cfg;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ${className}`}
    >
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}
