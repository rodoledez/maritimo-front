"use client";

import { Bell, Loader2, Ship } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { BookingStatusBadge } from "@/components/booking/status-badge";
import { StatusBadge } from "@/components/status-badge";
import { useIntegrateBookingWithShipsgo } from "@/lib/hooks/use-bookings";
import { useFacilities } from "@/lib/hooks/use-facilities";
import { useNotificationLogs } from "@/lib/hooks/use-notifications";
import {
  useShipmentTrackingByBooking,
  useShipmentTrackingDetail,
} from "@/lib/hooks/use-shipments-tracking";
import { eventTypeLabel } from "@/lib/notifications/constants";
import { errorMessage } from "@/lib/utils/errors";
import { assocLabel, formatDate, formatDateTime as formatSyncDateTime } from "@/lib/utils/format";
import type { Booking, Facility } from "@/types/domain";
import {
  shipmentStatusLabel,
  shipmentStatusTone,
} from "../shipments-tracking/_status";
import { ShipsgoTrackingPanel } from "../shipments-tracking/shipsgo-tracking-panel";
import { BookingNotificationsPanel } from "./booking-notifications-panel";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="text-sm font-medium">{value ?? "—"}</p>
    </div>
  );
}

function YesNo({ value }: { value?: boolean }) {
  return (
    <Badge variant="outline" className="font-normal">
      {value ? "Sí" : "No"}
    </Badge>
  );
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  const pad = (n: number) => String(n).padStart(2, "0");
  // Use UTC getters (matching formatDate) so the stored wall-clock digits are
  // shown verbatim, without shifting by the browser's timezone.
  return `${formatDate(value)} ${pad(d.getUTCHours())}:${pad(
    d.getUTCMinutes()
  )}`;
}

function facilityLabel(
  facilities: Facility[],
  id: number | string | null | undefined,
  joined: Booking["depot"] | Booking["terminal"] | null | undefined
): string {
  if (joined && typeof joined === "object" && "name" in joined && joined.name) {
    return joined.name;
  }
  if (typeof joined === "string" && joined) return joined;
  if (id !== null && id !== undefined) {
    const match = facilities.find((f) => String(f.id) === String(id));
    if (match) return match.active ? match.name : `${match.name} (inactivo)`;
    return `#${id}`;
  }
  return "—";
}

function formatStacking(booking: Booking): string | null {
  const mode = booking.stackingMode;
  if (!mode) return null;
  if (mode === "CONTINUOUS") {
    if (!booking.stackingStart || !booking.stackingEnd) return null;
    return `Continuo: ${formatDateTime(booking.stackingStart)} → ${formatDateTime(
      booking.stackingEnd
    )}`;
  }
  if (mode === "DAILY") {
    const schedule = booking.stackingSchedule ?? [];
    if (schedule.length === 0) return null;
    const hhmm = (t: string | null | undefined) => (t ? t.slice(0, 5) : "");
    const days = schedule
      .filter((s) => s.day)
      .map(
        (s) => `${formatDate(s.day)} ${hhmm(s.startTime)} a ${hhmm(s.endTime)}`
      );
    if (days.length === 0) return null;
    return `Diario: ${days.join(" · ")}`;
  }
  return null;
}

export function BookingDetailDialog({
  open,
  onOpenChange,
  booking,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: Booking | null;
}) {
  const { data: facilities = [] } = useFacilities();
  const { data: tracking, isLoading: trackingLoading } =
    useShipmentTrackingByBooking(booking?.id, {
      enabled: open && !!booking,
    });
  const { data: trackingDetail, isFetching: trackingFetching } =
    useShipmentTrackingDetail(tracking?.id ?? undefined, {
      enabled: open && !!tracking,
    });
  const {
    data: logsPage,
    isLoading: logsLoading,
    isFetching: logsFetching,
    error: logsError,
    refetch: refetchLogs,
  } = useNotificationLogs(
    { bookingId: booking ? Number(booking.id) : undefined, take: 100 },
    { enabled: open && !!booking }
  );
  const integrateMutation = useIntegrateBookingWithShipsgo();

  const onIntegrate = async () => {
    if (!booking) return;
    try {
      await integrateMutation.mutateAsync(booking.id);
      toast.success(`Reserva #${booking.id} integrada con ShipsGo`);
    } catch (e) {
      toast.error(errorMessage(e, "No se pudo integrar con ShipsGo"));
    }
  };

  if (!booking) return null;
  const logs = logsPage?.rows ?? [];
  const shipsgo = trackingDetail?.tracking ?? tracking ?? null;
  // La integración con ShipsGo requiere una reserva confirmada.
  const canIntegrate = booking.status === "Confirmado";
  const it = booking.Itinerary;
  const terminalLabel = facilityLabel(facilities, booking.terminalId, booking.terminal);
  const depotLabel = facilityLabel(facilities, booking.depotId, booking.depot);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            Reserva #{booking.id}
            <BookingStatusBadge status={booking.status} />
          </DialogTitle>
          <DialogDescription>
            Resumen de la solicitud de reserva
          </DialogDescription>
        </DialogHeader>

        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-secondary">Carga</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Especie" value={booking.specie} />
            <Field label="Cantidad contenedores" value={booking.qtyContainers} />
            <Field
              label="Tipo de contenedor"
              value={booking.typeContainer ?? booking.typeContainerEntity}
            />
            <Field label="Tipo de flete" value={booking.typeFreight} />
            <Field label="Temperatura (°C)" value={booking.temperature} />
            <Field label="Ventilación" value={booking.ventilation} />
            <Field label="Emisión BL" value={booking.bl} />
            <Field label="VGM" value={booking.vgm} />
          </div>
          <div className="grid gap-4 sm:grid-cols-4">
            <Field
              label="ATM controlada"
              value={<YesNo value={booking.isATM ?? booking.isAtm} />}
            />
            <Field
              label="Cold treatment"
              value={<YesNo value={booking.isColdTreatment} />}
            />
            <Field
              label="Humedad (%)"
              value={booking.humidity ?? "—"}
            />
            <Field label="Cliente" value={booking.Client?.name} />
          </div>
          {booking.description ? (
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Observaciones
              </p>
              <p className="mt-1 whitespace-pre-wrap rounded-md border bg-muted/30 p-3 text-sm">
                {booking.description}
              </p>
            </div>
          ) : null}
        </section>

        <Separator />

        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-secondary">Itinerario</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Semana" value={it?.weekNo} />
            <Field label="Naviera" value={it?.carrier} />
            <Field label="M/N" value={it?.containerShip} />
            <Field label="Viaje" value={it?.tripNo} />
            <Field label="Pto. Zarpe" value={assocLabel(it?.portDeparture)} />
            <Field
              label="Pto. Destino"
              value={assocLabel(it?.portDestination)}
            />
            <Field label="ETD" value={formatDate(it?.etd)} />
            <Field label="ETA" value={formatDate(it?.eta)} />
            <Field
              label="Transit time"
              value={
                typeof it?.transitTime === "number"
                  ? `${it.transitTime} días`
                  : "—"
              }
            />
            <Field
              label="Stacking"
              value={formatStacking(booking) ?? it?.stacking ?? "—"}
            />
            <Field
              label="Corte doc."
              value={booking.cutOff ?? it?.documentClosure}
            />
          </div>
        </section>

        {booking.status !== "Pendiente" ? (
          <>
            <Separator />
            <section className="space-y-4">
              <h3 className="text-sm font-semibold text-secondary">
                {booking.status === "Confirmado" ? "Confirmación" : "Cancelación"}
              </h3>
              {booking.status === "Confirmado" ? (
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="Booking" value={booking.booking} />
                  <Field label="BL Nº" value={booking.blNo} />
                  <Field label="Terminal" value={terminalLabel} />
                  <Field label="Depósito" value={depotLabel} />
                </div>
              ) : null}
              {booking.statusNotes ? (
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Notas
                  </p>
                  <p className="mt-1 whitespace-pre-wrap rounded-md border bg-muted/30 p-3 text-sm">
                    {booking.statusNotes}
                  </p>
                </div>
              ) : null}
            </section>
          </>
        ) : null}

        <Separator />

        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-secondary">Integraciones</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Odoo (x_embarques)"
              value={
                booking.odooEmbarqueId ? `#${booking.odooEmbarqueId}` : "—"
              }
            />
            <Field
              label="Estado ShipsGo"
              value={
                booking.shipsgoStatus ? (
                  <StatusBadge
                    tone={shipmentStatusTone(booking.shipsgoStatus)}
                    icon={null}
                  >
                    {shipmentStatusLabel(booking.shipsgoStatus)}
                  </StatusBadge>
                ) : (
                  "—"
                )
              }
            />
            <Field
              label="Última notificación"
              value={
                booking.lastNotificationEvent
                  ? eventTypeLabel(booking.lastNotificationEvent)
                  : "—"
              }
            />
            <Field
              label="Enviada el"
              value={
                booking.lastNotificationSentAt
                  ? formatSyncDateTime(booking.lastNotificationSentAt)
                  : "—"
              }
            />
          </div>
        </section>

        <Separator />

        <Tabs defaultValue="tracking">
          <TabsList>
            <TabsTrigger value="tracking">
              <Ship />
              Tracking ShipsGo
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell />
              Notificaciones{logs.length > 0 ? ` (${logs.length})` : ""}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tracking" className="mt-4">
            <section className="space-y-4">
              {shipsgo?.lastSyncedAt ? (
                <p className="text-xs text-muted-foreground">
                  Última sincronización:{" "}
                  <span className="text-foreground">
                    {formatSyncDateTime(shipsgo.lastSyncedAt)}
                  </span>
                </p>
              ) : null}

              {shipsgo ? (
                <ShipsgoTrackingPanel
                  tracking={shipsgo}
                  containers={trackingDetail?.containers ?? []}
                  followers={trackingDetail?.followers ?? []}
                  isFetching={trackingFetching}
                />
              ) : trackingLoading ? (
                <div className="flex items-center justify-center py-6 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="ml-2 text-sm">Buscando tracking…</span>
                </div>
              ) : (
                <div className="flex flex-col items-start gap-3 rounded-md border border-dashed bg-muted/30 p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Ship className="h-4 w-4" />
                    Esta reserva aún no está integrada con ShipsGo.
                  </div>
                  {canIntegrate ? (
                    <Button
                      type="button"
                      size="sm"
                      onClick={onIntegrate}
                      disabled={integrateMutation.isPending}
                    >
                      {integrateMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Integrando…
                        </>
                      ) : (
                        <>
                          <Ship className="h-4 w-4" />
                          Integrar con ShipsGo
                        </>
                      )}
                    </Button>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      La reserva debe estar confirmada para integrarla con
                      ShipsGo.
                    </p>
                  )}
                </div>
              )}
            </section>
          </TabsContent>

          <TabsContent value="notifications" className="mt-4">
            <BookingNotificationsPanel
              logs={logs}
              isLoading={logsLoading}
              isFetching={logsFetching}
              error={logsError}
              onRetry={() => refetchLogs()}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
