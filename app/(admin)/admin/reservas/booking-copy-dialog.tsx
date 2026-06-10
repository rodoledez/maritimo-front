"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Copy, Loader2 } from "lucide-react";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  useBookingCopyDraft,
  useCreateBooking,
} from "@/lib/hooks/use-bookings";
import { useClients } from "@/lib/hooks/use-clients";
import { useCommodities } from "@/lib/hooks/use-commodities";
import { useTypeContainers } from "@/lib/hooks/use-type-containers";
import { errorMessage } from "@/lib/utils/errors";
import { assocLabel, formatDate } from "@/lib/utils/format";
import type { Booking } from "@/types/domain";

const FREIGHT_OPTIONS = [
  "Collect",
  "Prepaid",
  "Prepaid as per agreement",
] as const;
const BL_OPTIONS = [
  "Emision Origen",
  "Emision Destino",
  "Sea WayBill",
  "Telex Release",
  "Express Release",
] as const;
const VGM_OPTIONS = ["En Planta", "En Puerto"] as const;

const schema = z.object({
  clientId: z.coerce.number().int().positive("Selecciona un cliente"),
  specie: z.string().optional().or(z.literal("")),
  typeContainer: z.string().optional().or(z.literal("")),
  typeFreight: z.string().min(1, "Tipo de flete requerido"),
  qtyContainers: z.coerce.number().int().min(1, "Mínimo 1 contenedor"),
  temperature: z.coerce.number().optional(),
  ventilation: z.string().optional().or(z.literal("")),
  bl: z.string().min(1, "Emisión BL requerida"),
  isATM: z.boolean(),
  isColdTreatment: z.boolean(),
  vgm: z.string().min(1, "VGM requerido"),
  humidity: z.coerce.number().optional(),
  description: z.string().optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

const EMPTY: FormValues = {
  clientId: 0,
  specie: "",
  typeContainer: "",
  typeFreight: "",
  qtyContainers: 1,
  temperature: undefined,
  ventilation: "",
  bl: "",
  isATM: false,
  isColdTreatment: false,
  vgm: "",
  humidity: undefined,
  description: "",
};

function toNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function ItineraryField({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="text-sm font-medium">{value || "—"}</p>
    </div>
  );
}

export function BookingCopyDialog({
  open,
  onOpenChange,
  booking,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: Booking | null;
}) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY,
    mode: "onBlur",
  });
  const createMutation = useCreateBooking();
  const { data: clients = [] } = useClients();
  const { data: commodities = [] } = useCommodities();
  const { data: containers = [] } = useTypeContainers();
  const {
    data: draft,
    isLoading: loadingDraft,
    error: draftError,
  } = useBookingCopyDraft(booking?.id, open);

  // El itinerario se conserva tal cual de la reserva origen.
  const itinerary = booking?.Itinerary ?? null;

  useEffect(() => {
    if (!open || !booking || !draft) return;
    form.reset({
      clientId: toNumber(draft.client_id ?? booking.Client?.id) ?? 0,
      specie: draft.specie ?? booking.specie ?? "",
      typeContainer:
        draft.typeContainer ??
        booking.typeContainer ??
        booking.typeContainerEntity ??
        "",
      typeFreight: draft.typeFreight ?? booking.typeFreight ?? "",
      qtyContainers:
        toNumber(draft.qtyContainers ?? booking.qtyContainers) ?? 1,
      temperature: toNumber(draft.temperature ?? booking.temperature),
      ventilation: draft.ventilation ?? booking.ventilation ?? "",
      bl: draft.bl ?? booking.bl ?? "",
      isATM:
        draft.isATM ?? draft.isAtm ?? booking.isATM ?? booking.isAtm ?? false,
      isColdTreatment:
        draft.isColdTreatment ?? booking.isColdTreatment ?? false,
      vgm: draft.vgm ?? booking.vgm ?? "",
      humidity: toNumber(draft.humidity ?? booking.humidity),
      description: draft.description ?? booking.description ?? "",
    });
  }, [open, booking, draft, form]);

  const onSubmit = async (values: FormValues) => {
    if (!booking) return;
    const itineraryId =
      draft?.itinerary_id ??
      draft?.itineraryId ??
      booking.itineraryId ??
      booking.itinerary_id ??
      itinerary?.id;
    if (!itineraryId) {
      toast.error("No se pudo determinar el itinerario de la reserva origen");
      return;
    }
    try {
      const created = await createMutation.mutateAsync({
        client_id: values.clientId,
        itinerary_id: itineraryId,
        itineraryId,
        specie: values.specie || null,
        typeContainer: values.typeContainer || null,
        typeFreight: values.typeFreight,
        qtyContainers: values.qtyContainers,
        temperature: values.temperature ?? null,
        ventilation: values.ventilation || null,
        bl: values.bl,
        isATM: values.isATM,
        isAtm: values.isATM,
        isColdTreatment: values.isColdTreatment,
        vgm: values.vgm,
        humidity: values.humidity ?? null,
        description: values.description || null,
      });
      toast.success(`Reserva copiada · nueva reserva #${created.id}`);
      onOpenChange(false);
    } catch (e) {
      toast.error(errorMessage(e, "No se pudo copiar la reserva"));
    }
  };

  const isSubmitting = createMutation.isPending;

  const activeClients = clients.filter((c) => c.active);
  const commodityNames = Array.from(
    new Set([
      ...(booking?.specie ? [booking.specie] : []),
      ...commodities.filter((c) => c.active).map((c) => c.name),
    ])
  );
  const containerNames = Array.from(
    new Set([
      ...(booking?.typeContainer ? [booking.typeContainer] : []),
      ...containers.filter((c) => c.active).map((c) => c.name),
    ])
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Copiar reserva #{booking?.id}</DialogTitle>
          <DialogDescription>
            Se crea una nueva reserva con los datos comerciales y del itinerario
            de la reserva origen. Los campos dinámicos (Nº reserva, booking, BL,
            stacking, corte documental y depósito) quedan vacíos. Revisa y ajusta
            antes de guardar.
          </DialogDescription>
        </DialogHeader>

        {draftError ? (
          <p className="text-sm text-destructive">
            {errorMessage(draftError, "No se pudo cargar la reserva origen")}
          </p>
        ) : loadingDraft ? (
          <div className="space-y-3">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-5"
              noValidate
            >
              <section className="rounded-lg border bg-muted/30 p-4">
                <h3 className="mb-3 text-sm font-semibold text-secondary">
                  Itinerario (se copia)
                </h3>
                <div className="grid gap-3 sm:grid-cols-3">
                  <ItineraryField label="Naviera" value={itinerary?.carrier} />
                  <ItineraryField
                    label="Motonave"
                    value={itinerary?.containerShip}
                  />
                  <ItineraryField label="Semana" value={itinerary?.weekNo} />
                  <ItineraryField label="Viaje" value={itinerary?.tripNo} />
                  <ItineraryField
                    label="Pto. Zarpe"
                    value={assocLabel(itinerary?.portDeparture)}
                  />
                  <ItineraryField
                    label="Pto. Destino"
                    value={assocLabel(itinerary?.portDestination)}
                  />
                  <ItineraryField
                    label="ETD"
                    value={formatDate(itinerary?.etd)}
                  />
                  <ItineraryField
                    label="ETA"
                    value={formatDate(itinerary?.eta)}
                  />
                  <ItineraryField
                    label="Transit time"
                    value={
                      typeof itinerary?.transitTime === "number"
                        ? `${itinerary.transitTime} días`
                        : "—"
                    }
                  />
                </div>
              </section>

              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente *</FormLabel>
                    <FormControl>
                      <SearchableSelect
                        value={field.value ? String(field.value) : ""}
                        onValueChange={(v) => field.onChange(Number(v))}
                        placeholder="Selecciona el cliente para esta reserva"
                        searchPlaceholder="Buscar cliente…"
                        options={activeClients.map((c) => ({
                          value: String(c.id),
                          label: c.name,
                        }))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="specie"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Especie</FormLabel>
                      <FormControl>
                        <SearchableSelect
                          value={field.value ?? ""}
                          onValueChange={field.onChange}
                          placeholder="Selecciona…"
                          searchPlaceholder="Buscar especie…"
                          options={commodityNames.map((name) => ({
                            value: name,
                            label: name,
                          }))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="typeContainer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contenedor</FormLabel>
                      <FormControl>
                        <SearchableSelect
                          value={field.value ?? ""}
                          onValueChange={field.onChange}
                          placeholder="Selecciona…"
                          searchPlaceholder="Buscar contenedor…"
                          options={containerNames.map((name) => ({
                            value: name,
                            label: name,
                          }))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="typeFreight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de flete *</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Selecciona…" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {FREIGHT_OPTIONS.map((o) => (
                            <SelectItem key={o} value={o}>
                              {o}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="qtyContainers"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cantidad contenedores *</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" min={1} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="temperature"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Temperatura (°C)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          type="number"
                          step="0.1"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ventilation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ventilación</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Emisión BL *</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Selecciona…" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {BL_OPTIONS.map((o) => (
                            <SelectItem key={o} value={o}>
                              {o}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="vgm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>VGM *</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Selecciona…" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {VGM_OPTIONS.map((o) => (
                            <SelectItem key={o} value={o}>
                              {o}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="humidity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Humedad (%)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          type="number"
                          min={0}
                          max={100}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="isATM"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center gap-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(v) => field.onChange(v === true)}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">
                        ATM controlada
                      </FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isColdTreatment"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center gap-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(v) => field.onChange(v === true)}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">
                        Cold treatment
                      </FormLabel>
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observaciones</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creando…
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Crear copia
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
