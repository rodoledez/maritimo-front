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
import { formatDate } from "@/lib/utils/format";
import type { Booking } from "@/types/domain";

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

export function BookingDetailDialog({
  open,
  onOpenChange,
  booking,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: Booking | null;
}) {
  if (!booking) return null;
  const it = booking.Itinerary;
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
            <Field label="Pto. Zarpe" value={it?.portDeparture} />
            <Field label="Pto. Destino" value={it?.portDestination} />
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
            <Field label="Stacking" value={booking.stacking ?? it?.stacking} />
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
                  <Field label="Depot" value={booking.depot} />
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
