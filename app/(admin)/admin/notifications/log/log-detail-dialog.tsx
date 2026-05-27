"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/status-badge";
import {
  eventTypeLabel,
  logStatusLabel,
  logStatusTone,
} from "@/lib/notifications/constants";
import { formatDateTime } from "@/lib/utils/format";
import type { NotificationLog } from "@/types/domain";

function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className={mono ? "font-mono text-xs" : "text-sm font-medium"}>
        {value ?? "—"}
      </p>
    </div>
  );
}

export function LogDetailDialog({
  open,
  onOpenChange,
  log,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  log: NotificationLog | null;
}) {
  if (!log) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            Notificación #{log.id}
            <StatusBadge tone={logStatusTone(log.status)} icon={null}>
              {logStatusLabel(log.status)}
            </StatusBadge>
          </DialogTitle>
          <DialogDescription>
            {eventTypeLabel(log.eventType)} ·{" "}
            {log.sentAt
              ? `Enviado ${formatDateTime(log.sentAt)}`
              : `Creado ${formatDateTime(log.createdAt)}`}
          </DialogDescription>
        </DialogHeader>

        <section className="grid gap-4 sm:grid-cols-2">
          <Field label="Destinatario" value={log.recipientEmail} />
          <Field label="CC" value={log.ccEmails || "—"} />
          <Field
            label="Booking"
            value={log.bookingId !== null ? `#${log.bookingId}` : "—"}
          />
          <Field
            label="Shipment tracking"
            value={
              log.shipmentTrackingId !== null
                ? `#${log.shipmentTrackingId}`
                : "—"
            }
          />
          <Field
            label="Template"
            value={log.templateId !== null ? `#${log.templateId}` : "—"}
          />
          <Field
            label="Regla"
            value={log.ruleId !== null ? `#${log.ruleId}` : "—"}
          />
          <Field label="Dedupe key" value={log.dedupeKey ?? "—"} mono />
          <Field label="Creado" value={formatDateTime(log.createdAt)} />
        </section>

        <Separator />

        <section className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Asunto
          </p>
          <p className="text-sm font-medium">{log.subject}</p>
        </section>

        {log.bodyPreview ? (
          <section className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Preview (primeros 500 caracteres)
            </p>
            <pre className="max-h-64 overflow-auto rounded-md border bg-muted/30 p-3 text-xs whitespace-pre-wrap">
              {log.bodyPreview}
            </pre>
          </section>
        ) : null}

        {log.errorMessage ? (
          <section className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Error
            </p>
            <pre className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs whitespace-pre-wrap text-destructive">
              {log.errorMessage}
            </pre>
          </section>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
