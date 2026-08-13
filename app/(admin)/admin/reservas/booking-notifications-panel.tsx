"use client";

import { useState } from "react";
import { BellOff, Loader2 } from "lucide-react";

import { StatusBadge } from "@/components/status-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  eventTypeLabel,
  logStatusLabel,
  logStatusTone,
} from "@/lib/notifications/constants";
import { errorMessage } from "@/lib/utils/errors";
import { formatDateTime } from "@/lib/utils/format";
import type { NotificationLog } from "@/types/domain";

import { LogDetailDialog } from "../notifications/log/log-detail-dialog";

export function BookingNotificationsPanel({
  logs,
  isLoading,
  isFetching,
  error,
  onRetry,
}: {
  logs: NotificationLog[];
  isLoading: boolean;
  isFetching: boolean;
  error: unknown;
  onRetry: () => void;
}) {
  const [selected, setSelected] = useState<NotificationLog | null>(null);

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>No se pudo cargar el log de notificaciones</AlertTitle>
        <AlertDescription className="flex items-center justify-between gap-3">
          <span>{errorMessage(error, "Error desconocido")}</span>
          <Button
            size="sm"
            variant="outline"
            onClick={onRetry}
            disabled={isFetching}
          >
            Reintentar
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full" />
        ))}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-md border border-dashed bg-muted/30 p-6 text-center text-muted-foreground">
        <BellOff className="h-6 w-6" />
        <p className="text-sm">
          No se han enviado notificaciones para esta reserva.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {isFetching ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Actualizando…
          </div>
        ) : null}
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-3">Enviado</TableHead>
                <TableHead className="px-3">Evento</TableHead>
                <TableHead className="px-3">Destinatario</TableHead>
                <TableHead className="px-3">Asunto</TableHead>
                <TableHead className="px-3">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow
                  key={log.id}
                  className="cursor-pointer hover:bg-muted/40"
                  onClick={() => setSelected(log)}
                >
                  <TableCell className="px-3 py-2 text-xs text-muted-foreground tabular-nums">
                    {formatDateTime(log.sentAt ?? log.createdAt)}
                  </TableCell>
                  <TableCell className="px-3 py-2 text-sm">
                    {eventTypeLabel(log.eventType)}
                  </TableCell>
                  <TableCell className="px-3 py-2 text-sm">
                    {log.recipientEmail}
                  </TableCell>
                  <TableCell className="px-3 py-2">
                    <span className="block max-w-[18rem] truncate text-sm">
                      {log.subject}
                    </span>
                  </TableCell>
                  <TableCell className="px-3 py-2">
                    <StatusBadge tone={logStatusTone(log.status)} icon={null}>
                      {logStatusLabel(log.status)}
                    </StatusBadge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <p className="text-xs text-muted-foreground">
          Haz clic en una fila para ver el detalle de la notificación.
        </p>
      </div>

      <LogDetailDialog
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(null)}
        log={selected}
      />
    </>
  );
}
