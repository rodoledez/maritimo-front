"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Bell, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useTriggerBookingNotification } from "@/lib/hooks/use-notifications";
import { useBookingMilestones } from "@/lib/hooks/use-shipments-tracking";
import {
  BOOKING_EVENT_TYPES,
  eventTypeLabel,
  milestoneNotifyLabel,
} from "@/lib/notifications/constants";
import { errorMessage } from "@/lib/utils/errors";
import { formatDateTime } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import type {
  Booking,
  BookingMilestone,
  BookingNotificationEventType,
} from "@/types/domain";

/**
 * Envío manual de UN aviso de hito. Reemplaza al antiguo "Enviar notificación"
 * del menú, que mandaba los 7 hitos de una vez — incluidos "Arribo" y
 * "EMBARQUE FINALIZADO" a embarques que seguían navegando.
 *
 * Por defecto solo se pueden elegir hitos que ocurrieron (registrados en
 * `shipment_milestone`); enviar uno que no ocurrió exige marcarlo a propósito.
 */
export function BookingNotifyDialog({
  open,
  onOpenChange,
  booking,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: Booking | null;
}) {
  const {
    data: milestones = [],
    isLoading,
    error,
  } = useBookingMilestones(booking?.id, { enabled: open && !!booking });
  const mutation = useTriggerBookingNotification();

  // Último registro por evento (TRANSSHIPMENT se repite una vez por puerto).
  const occurred = useMemo(() => {
    const byEvent = new Map<BookingNotificationEventType, BookingMilestone>();
    for (const m of milestones) {
      byEvent.set(m.eventType, m);
    }
    return byEvent;
  }, [milestones]);

  const latestOccurred = useMemo(() => {
    return milestones[milestones.length - 1]?.eventType ?? null;
  }, [milestones]);

  // `choice` es lo que el usuario marcó; mientras no marque nada, se propone
  // el último hito ocurrido. Ambos estados se limpian al cerrar.
  const [choice, setChoice] = useState<BookingNotificationEventType | null>(
    null,
  );
  const [allowNotOccurred, setAllowNotOccurred] = useState(false);
  const selected = choice ?? latestOccurred;

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setChoice(null);
      setAllowNotOccurred(false);
    }
    onOpenChange(next);
  };

  const selectedOccurred = selected ? occurred.has(selected) : false;

  const onSend = async () => {
    if (!booking || !selected) return;
    try {
      const result = await mutation.mutateAsync({
        bookingId: booking.id,
        eventType: selected,
      });
      const row = result.results[0];
      if (row?.status === "SENT") {
        toast.success(
          `Reserva #${booking.id}: aviso de ${eventTypeLabel(selected)} enviado`,
        );
        handleOpenChange(false);
      } else if (row?.status === "FAILED") {
        toast.warning(
          `Reserva #${booking.id}: falló el envío${row.reason ? ` (${row.reason})` : ""}`,
        );
      } else {
        toast.info(
          `Reserva #${booking.id}: no se envió${row?.reason ? ` (${row.reason})` : ""}`,
        );
      }
    } catch (e) {
      toast.error(errorMessage(e, "No se pudo enviar la notificación"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Enviar notificación · reserva #{booking?.id}
          </DialogTitle>
          <DialogDescription>
            Elige el hito a notificar. Se envía un solo correo al cliente y al
            grupo de operaciones.
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <Alert variant="destructive">
            <AlertDescription>
              {errorMessage(error, "No se pudieron cargar los hitos")}
            </AlertDescription>
          </Alert>
        ) : isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-11 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            <div role="radiogroup" className="space-y-1.5">
              {BOOKING_EVENT_TYPES.map((evt) => {
                const m = occurred.get(evt);
                const disabled = !m && !allowNotOccurred;
                const isSelected = selected === evt;
                return (
                  <button
                    key={evt}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    disabled={disabled}
                    onClick={() => setChoice(evt)}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 rounded-md border px-3 py-2 text-left transition-colors",
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted/50",
                      disabled &&
                        "cursor-not-allowed opacity-50 hover:bg-transparent",
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <span
                        aria-hidden
                        className={cn(
                          "h-3.5 w-3.5 shrink-0 rounded-full border",
                          isSelected && "border-4 border-primary",
                        )}
                      />
                      <span className="text-sm font-medium">
                        {eventTypeLabel(evt)}
                      </span>
                    </span>
                    <span className="text-right text-xs text-muted-foreground">
                      {m ? (
                        <>
                          <span className="font-mono tabular-nums">
                            {formatDateTime(m.occurredAt)}
                          </span>
                          {" · "}
                          {milestoneNotifyLabel(m.notifyState)}
                        </>
                      ) : (
                        "No ha ocurrido"
                      )}
                    </span>
                  </button>
                );
              })}
            </div>

            {occurred.size === 0 ? (
              <p className="text-sm text-muted-foreground">
                Esta reserva no tiene hitos registrados todavía.
              </p>
            ) : null}

            <div className="flex items-center gap-2">
              <Checkbox
                id="allow-not-occurred"
                checked={allowNotOccurred}
                onCheckedChange={(v) => {
                  const on = v === true;
                  setAllowNotOccurred(on);
                  if (!on && selected && !occurred.has(selected)) {
                    setChoice(null);
                  }
                }}
              />
              <Label
                htmlFor="allow-not-occurred"
                className="text-sm font-normal"
              >
                Permitir enviar un hito que aún no ocurrió
              </Label>
            </div>

            {selected && !selectedOccurred ? (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {eventTypeLabel(selected)} no figura como ocurrido. El cliente
                  recibirá un aviso de un estado que su embarque todavía no
                  alcanza.
                </AlertDescription>
              </Alert>
            ) : null}
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
          >
            Cerrar
          </Button>
          <Button
            type="button"
            onClick={onSend}
            disabled={!selected || mutation.isPending || isLoading}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enviando…
              </>
            ) : (
              <>
                <Bell className="h-4 w-4" />
                {selected
                  ? `Enviar aviso de ${eventTypeLabel(selected)}`
                  : "Enviar aviso"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
