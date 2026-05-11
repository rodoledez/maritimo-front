"use client";

import { useEffect, useMemo } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
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
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldRequiredMark,
  FieldSectionTitle,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePorts } from "@/lib/hooks/use-ports";
import { useShippingCompanies } from "@/lib/hooks/use-shipping-companies";
import {
  useCreateItinerary,
  useUpdateItinerary,
} from "@/lib/hooks/use-itineraries";
import type { ItineraryPayload } from "@/lib/api/itineraries";
import { errorMessage } from "@/lib/utils/errors";
import type { Itinerary } from "@/types/domain";

const schema = z.object({
  weekNo: z.coerce.number().int().min(1, "Semana requerida"),
  shippingCompanyId: z.string().min(1, "Naviera requerida"),
  containerShip: z.string().min(1, "Motonave requerida"),
  tripNo: z.string().min(1, "Viaje requerido"),
  portOriginId: z.string().min(1, "Puerto de zarpe requerido"),
  portDestinationId: z.string().min(1, "Puerto de destino requerido"),
  countryDestination: z.string().optional().or(z.literal("")),
  etd: z.string().min(1, "ETD requerido"),
  eta: z.string().min(1, "ETA requerido"),
  stacking: z.string().optional().or(z.literal("")),
  documentClosure: z.string().optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

const empty: FormValues = {
  weekNo: 1,
  shippingCompanyId: "",
  containerShip: "",
  tripNo: "",
  portOriginId: "",
  portDestinationId: "",
  countryDestination: "",
  etd: "",
  eta: "",
  stacking: "",
  documentClosure: "",
};

const FORM_ID = "itinerary-form";

function diffDays(etd: string, eta: string): number | null {
  if (!etd || !eta) return null;
  const a = new Date(etd);
  const b = new Date(eta);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return null;
  const ms = b.getTime() - a.getTime();
  if (ms < 0) return null;
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

export function ItineraryFormDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Itinerary | null;
}) {
  const isEditing = editing !== null;
  const { data: companies = [] } = useShippingCompanies();
  const { data: ports = [] } = usePorts();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: empty,
    mode: "onBlur",
  });
  const createMutation = useCreateItinerary();
  const updateMutation = useUpdateItinerary();

  const etdValue = useWatch({ control: form.control, name: "etd" });
  const etaValue = useWatch({ control: form.control, name: "eta" });
  const transit = useMemo(() => diffDays(etdValue, etaValue), [etdValue, etaValue]);

  const originPorts = useMemo(
    () => ports.filter((p) => p.isOrigin && p.active),
    [ports]
  );
  const destinationPorts = useMemo(
    () => ports.filter((p) => p.isDestination && p.active),
    [ports]
  );
  const activeCompanies = useMemo(
    () => companies.filter((c) => c.active),
    [companies]
  );

  useEffect(() => {
    if (open) {
      form.reset(
        editing
          ? {
              weekNo: editing.weekNo ?? 1,
              shippingCompanyId: editing.shippingCompanyId
                ? String(editing.shippingCompanyId)
                : "",
              containerShip: editing.containerShip ?? "",
              tripNo: editing.tripNo ?? "",
              portOriginId: editing.portOriginId
                ? String(editing.portOriginId)
                : "",
              portDestinationId: editing.portDestinationId
                ? String(editing.portDestinationId)
                : "",
              countryDestination: editing.countryDestination ?? "",
              etd: editing.etd?.slice(0, 10) ?? "",
              eta: editing.eta?.slice(0, 10) ?? "",
              stacking: editing.stacking ?? "",
              documentClosure: editing.documentClosure ?? "",
            }
          : empty
      );
    }
  }, [open, editing, form]);

  const onSubmit = async (values: FormValues) => {
    const company = activeCompanies.find(
      (c) => String(c.id) === values.shippingCompanyId
    );
    const origin = ports.find(
      (p) => String(p.id) === values.portOriginId
    );
    const destination = ports.find(
      (p) => String(p.id) === values.portDestinationId
    );

    const payload: ItineraryPayload = {
      weekNo: values.weekNo,
      shippingCompanyId: Number(values.shippingCompanyId),
      carrier: company?.name ?? null,
      containerShip: values.containerShip,
      tripNo: values.tripNo,
      portOriginId: Number(values.portOriginId),
      portDeparture: origin?.name ?? null,
      portDestinationId: Number(values.portDestinationId),
      portDestination: destination?.name ?? null,
      countryDestination:
        values.countryDestination || destination?.Country?.name || null,
      etd: values.etd,
      eta: values.eta,
      transitTime: transit ?? null,
      stacking: values.stacking || null,
      documentClosure: values.documentClosure || null,
      active: editing?.active ?? true,
    };

    try {
      if (isEditing && editing) {
        await updateMutation.mutateAsync({ id: editing.id, payload });
        toast.success("Itinerario actualizado");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Itinerario creado");
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(
        errorMessage(
          error,
          isEditing ? "No se pudo actualizar" : "No se pudo crear"
        )
      );
    }
  };

  const isSubmitting = form.formState.isSubmitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar itinerario" : "Crear itinerario"}
          </DialogTitle>
          <DialogDescription>
            Completa los datos del itinerario marítimo.
          </DialogDescription>
        </DialogHeader>

        <form
          id={FORM_ID}
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-8"
          noValidate
        >
          <section className="space-y-5">
            <FieldSectionTitle>Viaje</FieldSectionTitle>
            <FieldGroup>
              <div className="grid gap-6 sm:grid-cols-3">
                <Controller
                  name="weekNo"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="itin-week">
                        Semana <FieldRequiredMark />
                      </FieldLabel>
                      <Input
                        {...field}
                        id="itin-week"
                        type="number"
                        min={1}
                        max={53}
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  name="shippingCompanyId"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field
                      data-invalid={fieldState.invalid}
                      className="sm:col-span-2"
                    >
                      <FieldLabel htmlFor="itin-shipping">
                        Naviera <FieldRequiredMark />
                      </FieldLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger
                          id="itin-shipping"
                          aria-invalid={fieldState.invalid}
                          className="w-full"
                        >
                          <SelectValue placeholder="Selecciona…" />
                        </SelectTrigger>
                        <SelectContent>
                          {activeCompanies.map((c) => (
                            <SelectItem key={c.id} value={String(c.id)}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                <Controller
                  name="containerShip"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="itin-ship">
                        Motonave <FieldRequiredMark />
                      </FieldLabel>
                      <Input
                        {...field}
                        id="itin-ship"
                        aria-invalid={fieldState.invalid}
                        autoComplete="off"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  name="tripNo"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="itin-trip">
                        Viaje <FieldRequiredMark />
                      </FieldLabel>
                      <Input
                        {...field}
                        id="itin-trip"
                        aria-invalid={fieldState.invalid}
                        autoComplete="off"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </div>
            </FieldGroup>
          </section>

          <section className="space-y-5">
            <FieldSectionTitle>Puertos</FieldSectionTitle>
            <FieldGroup>
              <div className="grid gap-6 sm:grid-cols-2">
                <Controller
                  name="portOriginId"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="itin-port-origin">
                        Puerto de zarpe <FieldRequiredMark />
                      </FieldLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger
                          id="itin-port-origin"
                          aria-invalid={fieldState.invalid}
                          className="w-full"
                        >
                          <SelectValue placeholder="Selecciona…" />
                        </SelectTrigger>
                        <SelectContent>
                          {originPorts.map((p) => (
                            <SelectItem key={p.id} value={String(p.id)}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  name="portDestinationId"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="itin-port-destination">
                        Puerto de destino <FieldRequiredMark />
                      </FieldLabel>
                      <Select
                        value={field.value}
                        onValueChange={(v) => {
                          field.onChange(v);
                          const dest = destinationPorts.find(
                            (p) => String(p.id) === v
                          );
                          if (dest?.Country?.name) {
                            form.setValue(
                              "countryDestination",
                              dest.Country.name
                            );
                          }
                        }}
                      >
                        <SelectTrigger
                          id="itin-port-destination"
                          aria-invalid={fieldState.invalid}
                          className="w-full"
                        >
                          <SelectValue placeholder="Selecciona…" />
                        </SelectTrigger>
                        <SelectContent>
                          {destinationPorts.map((p) => (
                            <SelectItem key={p.id} value={String(p.id)}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </div>
              <Controller
                name="countryDestination"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="itin-country-destination">
                      País destino
                    </FieldLabel>
                    <Input
                      {...field}
                      id="itin-country-destination"
                      aria-invalid={fieldState.invalid}
                      autoComplete="off"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </FieldGroup>
          </section>

          <section className="space-y-5">
            <FieldSectionTitle>Fechas y cortes</FieldSectionTitle>
            <FieldGroup>
              <div className="grid gap-6 sm:grid-cols-3">
                <Controller
                  name="etd"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="itin-etd">
                        ETD <FieldRequiredMark />
                      </FieldLabel>
                      <Input
                        {...field}
                        id="itin-etd"
                        type="date"
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  name="eta"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="itin-eta">
                        ETA <FieldRequiredMark />
                      </FieldLabel>
                      <Input
                        {...field}
                        id="itin-eta"
                        type="date"
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Field>
                  <FieldLabel htmlFor="itin-transit">Transit time</FieldLabel>
                  <Input
                    id="itin-transit"
                    value={transit !== null ? `${transit} días` : "—"}
                    disabled
                  />
                </Field>
              </div>
              <div className="grid gap-6 sm:grid-cols-3">
                <Controller
                  name="stacking"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="itin-stacking">Stacking</FieldLabel>
                      <Input
                        {...field}
                        id="itin-stacking"
                        aria-invalid={fieldState.invalid}
                        autoComplete="off"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  name="documentClosure"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field
                      data-invalid={fieldState.invalid}
                      className="sm:col-span-2"
                    >
                      <FieldLabel htmlFor="itin-document-closure">
                        Corte documental
                      </FieldLabel>
                      <Input
                        {...field}
                        id="itin-document-closure"
                        aria-invalid={fieldState.invalid}
                        autoComplete="off"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </div>
            </FieldGroup>
          </section>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cerrar
          </Button>
          <Button type="submit" form={FORM_ID} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Guardando…
              </>
            ) : isEditing ? (
              "Actualizar"
            ) : (
              "Guardar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
