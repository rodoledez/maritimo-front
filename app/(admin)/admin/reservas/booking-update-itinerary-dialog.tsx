"use client";

import { useMemo, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Skeleton } from "@/components/ui/skeleton";
import { ItineraryFormDialog } from "@/app/(admin)/admin/itinerarios/itinerary-form-dialog";
import { useUpdateBooking } from "@/lib/hooks/use-bookings";
import { useItineraries } from "@/lib/hooks/use-itineraries";
import { errorMessage } from "@/lib/utils/errors";
import { assocLabel, formatDate } from "@/lib/utils/format";
import type { Booking, Itinerary } from "@/types/domain";

/** Etiqueta compacta de un itinerario para el selector. */
function itineraryLabel(it: Itinerary): string {
  const parts = [
    `Sem ${it.weekNo}`,
    it.carrier ?? undefined,
    it.containerShip ?? undefined,
    it.tripNo ? `Viaje ${it.tripNo}` : undefined,
  ].filter(Boolean);
  return parts.join(" · ");
}

/** Términos extra para la búsqueda difusa del selector. */
function itineraryKeywords(it: Itinerary): string {
  return [
    it.carrier,
    it.containerShip,
    it.tripNo,
    assocLabel(it.portDeparture),
    assocLabel(it.portDestination),
    assocLabel(it.countryDestination),
  ]
    .filter(Boolean)
    .join(" ");
}

function currentItineraryId(booking: Booking | null): string {
  const id =
    booking?.Itinerary?.id ?? booking?.itineraryId ?? booking?.itinerary_id;
  return id != null ? String(id) : "";
}

function PreviewField({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="text-sm font-medium">{value ?? "—"}</p>
    </div>
  );
}

function ItineraryPreview({ itinerary }: { itinerary: Itinerary }) {
  return (
    <div className="grid gap-3 rounded-lg border p-4 sm:grid-cols-3">
      <PreviewField label="Semana" value={itinerary.weekNo} />
      <PreviewField label="Naviera" value={itinerary.carrier} />
      <PreviewField label="M/N" value={itinerary.containerShip} />
      <PreviewField label="Viaje" value={itinerary.tripNo} />
      <PreviewField
        label="Pto. Zarpe"
        value={assocLabel(itinerary.portDeparture) || "—"}
      />
      <PreviewField
        label="Pto. Destino"
        value={assocLabel(itinerary.portDestination) || "—"}
      />
      <PreviewField label="ETD" value={formatDate(itinerary.etd)} />
      <PreviewField label="ETA" value={formatDate(itinerary.eta)} />
      <PreviewField
        label="Tránsito"
        value={
          typeof itinerary.transitTime === "number"
            ? `${itinerary.transitTime} días`
            : "—"
        }
      />
    </div>
  );
}

export function BookingUpdateItineraryDialog({
  open,
  onOpenChange,
  booking,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: Booking | null;
}) {
  const { data: itineraries = [], isLoading } = useItineraries({ vigent: "Y" });
  const mutation = useUpdateBooking();

  const [selectedId, setSelectedId] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  // Itinerarios creados desde este diálogo (aún no reflejados por el listado
  // vigente hasta que TanStack Query refresque). Se agregan para poder
  // seleccionarlos y previsualizarlos de inmediato.
  const [createdItineraries, setCreatedItineraries] = useState<Itinerary[]>([]);

  const originalId = currentItineraryId(booking);

  // Reinicializa la selección al abrir para una reserva distinta. Se ajusta el
  // estado durante el render (patrón recomendado de React) en lugar de un
  // efecto, para no disparar `react-hooks/set-state-in-effect`.
  const sessionKey = open && booking ? String(booking.id) : null;
  const [initializedFor, setInitializedFor] = useState<string | null>(null);
  if (sessionKey !== initializedFor) {
    setInitializedFor(sessionKey);
    setSelectedId(currentItineraryId(booking));
    setCreatedItineraries([]);
  }

  // Combina el listado vigente, el itinerario actual de la reserva (por si no
  // está vigente) y los creados en esta sesión. Deduplica por id.
  const options = useMemo(() => {
    const byId = new Map<string, Itinerary>();
    for (const it of itineraries) byId.set(String(it.id), it);
    if (booking?.Itinerary) {
      byId.set(String(booking.Itinerary.id), booking.Itinerary);
    }
    for (const it of createdItineraries) byId.set(String(it.id), it);
    return Array.from(byId.values()).sort(
      (a, b) => Number(a.weekNo) - Number(b.weekNo)
    );
  }, [itineraries, booking, createdItineraries]);

  const selected = useMemo(
    () => options.find((it) => String(it.id) === selectedId) ?? null,
    [options, selectedId]
  );

  const hasChange = selectedId !== "" && selectedId !== originalId;

  const onSubmit = async () => {
    if (!booking || !selected) return;
    try {
      await mutation.mutateAsync({
        id: booking.id,
        payload: {
          itinerary_id: selected.id,
          itineraryId: selected.id,
        },
      });
      toast.success("Itinerario de la reserva actualizado");
      onOpenChange(false);
    } catch (e) {
      toast.error(errorMessage(e, "No se pudo actualizar el itinerario"));
    }
  };

  const isSubmitting = mutation.isPending;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Actualizar itinerario · Reserva #{booking?.id}</DialogTitle>
            <DialogDescription>
              Selecciona un itinerario existente o crea uno nuevo para asignarlo
              a esta reserva.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-end gap-2">
              <div className="min-w-0 flex-1 space-y-1.5">
                <label
                  htmlFor="update-itinerary-select"
                  className="text-sm font-medium"
                >
                  Itinerario
                </label>
                {isLoading ? (
                  <Skeleton className="h-8 w-full" />
                ) : (
                  <SearchableSelect
                    id="update-itinerary-select"
                    value={selectedId}
                    onValueChange={setSelectedId}
                    placeholder="Selecciona un itinerario…"
                    searchPlaceholder="Buscar por naviera, M/N, puerto…"
                    options={options.map((it) => ({
                      value: String(it.id),
                      label: itineraryLabel(it),
                      keywords: itineraryKeywords(it),
                    }))}
                  />
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                className="shrink-0"
                onClick={() => setCreateOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Crear nuevo
              </Button>
            </div>

            {selected ? (
              <ItineraryPreview itinerary={selected} />
            ) : (
              <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                Selecciona un itinerario para ver el detalle.
              </div>
            )}

            {selected && selectedId === originalId ? (
              <p className="text-xs text-muted-foreground">
                Este es el itinerario actual de la reserva. Selecciona otro o
                crea uno nuevo para poder guardar.
              </p>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={onSubmit}
              disabled={!hasChange || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Guardando…
                </>
              ) : (
                "Guardar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ItineraryFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        editing={null}
        onSaved={(itinerary) => {
          setCreatedItineraries((prev) => [itinerary, ...prev]);
          setSelectedId(String(itinerary.id));
        }}
      />
    </>
  );
}
