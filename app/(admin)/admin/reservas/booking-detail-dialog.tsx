"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BookingStatusBadge } from "@/components/booking/status-badge";
import { useFacilities } from "@/lib/hooks/use-facilities";
import { assocLabel, formatDate } from "@/lib/utils/format";
import type { Booking, Facility } from "@/types/domain";

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
  return `${formatDate(value)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
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
  if (!booking) return null;
  const it = booking.Itinerary;
  const terminalLabel = facilityLabel(facilities, booking.terminalId, booking.terminal);
  const depotLabel = facilityLabel(facilities, booking.depotId, booking.depot);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
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
      </DialogContent>
    </Dialog>
  );
}
