import { AlertCircle, Check, Clock, X, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type StatusTone = "success" | "warning" | "pending" | "danger" | "neutral";

const TONE_CLASS: Record<StatusTone, string> = {
  success: "bg-brand-success/10 text-brand-success",
  warning: "bg-brand-warning/10 text-brand-warning",
  pending: "bg-brand-pending/20 text-brand-warning",
  danger: "bg-brand-danger/10 text-brand-danger",
  neutral: "bg-muted text-muted-foreground",
};

const DEFAULT_ICON: Record<StatusTone, LucideIcon> = {
  success: Check,
  warning: AlertCircle,
  pending: Clock,
  danger: X,
  neutral: Clock,
};

export function StatusBadge({
  tone,
  icon,
  children,
  className,
}: {
  tone: StatusTone;
  icon?: LucideIcon | null;
  children: React.ReactNode;
  className?: string;
}) {
  const Icon = icon === null ? null : (icon ?? DEFAULT_ICON[tone]);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium",
        TONE_CLASS[tone],
        className,
      )}
    >
      {Icon ? <Icon className="h-3 w-3" /> : null}
      {children}
    </span>
  );
}
