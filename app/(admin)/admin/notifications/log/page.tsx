"use client";

import { useMemo, useState } from "react";
import { Inbox, Search } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useNotificationLogs } from "@/lib/hooks/use-notifications";
import {
  NOTIFICATION_EVENT_TYPES,
  NOTIFICATION_LOG_STATUSES,
  eventTypeLabel,
  logStatusLabel,
  logStatusTone,
} from "@/lib/notifications/constants";
import { errorMessage } from "@/lib/utils/errors";
import { formatDateTime } from "@/lib/utils/format";
import type {
  NotificationEventType,
  NotificationLog,
  NotificationLogStatus,
} from "@/types/domain";

import { LogDetailDialog } from "./log-detail-dialog";

const PAGE_SIZES = [10, 25, 50, 100] as const;

export default function NotificationLogPage() {
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState<number>(25);
  const [eventFilter, setEventFilter] = useState<NotificationEventType | "all">(
    "all"
  );
  const [statusFilter, setStatusFilter] = useState<
    NotificationLogStatus | "all"
  >("all");
  const [bookingIdRaw, setBookingIdRaw] = useState("");
  const [trackingIdRaw, setTrackingIdRaw] = useState("");
  const [selected, setSelected] = useState<NotificationLog | null>(null);

  const params = useMemo(() => {
    const bookingId =
      bookingIdRaw && !Number.isNaN(Number(bookingIdRaw))
        ? Number(bookingIdRaw)
        : undefined;
    const trackingId =
      trackingIdRaw && !Number.isNaN(Number(trackingIdRaw))
        ? Number(trackingIdRaw)
        : undefined;
    return {
      skip: pageIndex * pageSize,
      take: pageSize,
      eventType: eventFilter === "all" ? undefined : eventFilter,
      status: statusFilter === "all" ? undefined : statusFilter,
      bookingId,
      shipmentTrackingId: trackingId,
    };
  }, [
    pageIndex,
    pageSize,
    eventFilter,
    statusFilter,
    bookingIdRaw,
    trackingIdRaw,
  ]);

  const { data, isLoading, error, refetch, isFetching } =
    useNotificationLogs(params);

  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const rangeStart = total === 0 ? 0 : pageIndex * pageSize + 1;
  const rangeEnd = Math.min((pageIndex + 1) * pageSize, total);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Log de notificaciones"
        description="Historial de notificaciones enviadas. El dispatcher (Phase 2) llenará esta tabla."
      />

      <Card size="sm">
        <CardContent className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">
              Booking ID
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={bookingIdRaw}
                onChange={(e) => {
                  setBookingIdRaw(e.target.value);
                  setPageIndex(0);
                }}
                placeholder="Ej. 1234"
                className="w-40 pl-9"
                inputMode="numeric"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">
              Tracking ID
            </label>
            <Input
              value={trackingIdRaw}
              onChange={(e) => {
                setTrackingIdRaw(e.target.value);
                setPageIndex(0);
              }}
              placeholder="Ej. 567"
              className="w-32"
              inputMode="numeric"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">
              Evento
            </label>
            <Select
              value={eventFilter}
              onValueChange={(v) => {
                setEventFilter(v as NotificationEventType | "all");
                setPageIndex(0);
              }}
            >
              <SelectTrigger className="w-52">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {NOTIFICATION_EVENT_TYPES.map((e) => (
                  <SelectItem key={e} value={e}>
                    {eventTypeLabel(e)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">
              Estado
            </label>
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v as NotificationLogStatus | "all");
                setPageIndex(0);
              }}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {NOTIFICATION_LOG_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {logStatusLabel(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>No se pudo cargar el log</AlertTitle>
          <AlertDescription className="flex items-center justify-between gap-3">
            <span>{errorMessage(error, "Error desconocido")}</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              Reintentar
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardContent className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold text-secondary">
              Notificaciones enviadas
            </h2>
            <span className="text-xs text-muted-foreground tabular-nums">
              {total === 0
                ? "Sin resultados"
                : `${rangeStart}–${rangeEnd} de ${total}`}
            </span>
          </div>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-3 text-right">ID</TableHead>
                  <TableHead className="px-3">Enviado</TableHead>
                  <TableHead className="px-3">Evento</TableHead>
                  <TableHead className="px-3">Booking</TableHead>
                  <TableHead className="px-3">Destinatario</TableHead>
                  <TableHead className="px-3">Asunto</TableHead>
                  <TableHead className="px-3">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={`s-${i}`}>
                      {Array.from({ length: 7 }).map((__, j) => (
                        <TableCell key={j} className="px-3 py-2">
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Inbox className="h-8 w-8" />
                        <p className="text-sm">No hay notificaciones registradas.</p>
                        <p className="text-xs">
                          El dispatcher de Phase 2 poblará esta tabla.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => (
                    <TableRow
                      key={row.id}
                      className="cursor-pointer hover:bg-muted/40"
                      onClick={() => setSelected(row)}
                    >
                      <TableCell className="px-3 py-2 text-right font-mono text-xs tabular-nums">
                        {row.id}
                      </TableCell>
                      <TableCell className="px-3 py-2 text-xs text-muted-foreground tabular-nums">
                        {formatDateTime(row.sentAt ?? row.createdAt)}
                      </TableCell>
                      <TableCell className="px-3 py-2">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm">
                            {eventTypeLabel(row.eventType)}
                          </span>
                          <span className="font-mono text-xs text-muted-foreground">
                            {row.eventType}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="px-3 py-2 font-mono text-xs">
                        {row.bookingId !== null ? `#${row.bookingId}` : "—"}
                      </TableCell>
                      <TableCell className="px-3 py-2 text-sm">
                        {row.recipientEmail}
                      </TableCell>
                      <TableCell className="px-3 py-2">
                        <span className="block max-w-md truncate text-sm">
                          {row.subject}
                        </span>
                      </TableCell>
                      <TableCell className="px-3 py-2">
                        <StatusBadge
                          tone={logStatusTone(row.status)}
                          icon={null}
                        >
                          {logStatusLabel(row.status)}
                        </StatusBadge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <span>Filas por página</span>
              <Select
                value={String(pageSize)}
                onValueChange={(v) => {
                  setPageSize(Number(v));
                  setPageIndex(0);
                }}
              >
                <SelectTrigger className="h-8 w-[72px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZES.map((s) => (
                    <SelectItem key={s} value={String(s)}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <span className="tabular-nums">
                Página {pageIndex + 1} de {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pageIndex === 0 || isFetching}
                  onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
                >
                  Anterior
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pageIndex + 1 >= totalPages || isFetching}
                  onClick={() => setPageIndex((p) => p + 1)}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <LogDetailDialog
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(null)}
        log={selected}
      />
    </div>
  );
}
