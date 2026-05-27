"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

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
import {
  Field,
  FieldDescription,
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
import { useBookings } from "@/lib/hooks/use-bookings";
import { useClients } from "@/lib/hooks/use-clients";
import {
  useCreateFreeDaysConfig,
  useUpdateFreeDaysConfig,
} from "@/lib/hooks/use-notifications";
import type { FreeDaysPayload } from "@/lib/api/notifications";
import type { FreeDaysConfig } from "@/types/domain";

import { explainNotificationError } from "../_shared";

export type FreeDaysScope = "client" | "booking";

const optionalIntString = z
  .string()
  .optional()
  .or(z.literal(""))
  .refine(
    (v) =>
      !v ||
      v === "" ||
      (!Number.isNaN(Number(v)) && Number(v) >= 0 && Number.isInteger(Number(v))),
    "Debe ser un entero positivo"
  );

const freeDaysSchema = z
  .object({
    scope: z.enum(["client", "booking"]),
    scopeId: z.string().min(1, "Debe seleccionar"),
    demurrageDays: optionalIntString,
    detentionDays: optionalIntString,
    reeferPlugInDays: optionalIntString,
    demurrageAlertHours: optionalIntString,
    detentionAlertHours: optionalIntString,
    reeferAlertHours: optionalIntString,
    isActive: z.boolean(),
  });

type FreeDaysFormValues = z.infer<typeof freeDaysSchema>;

function emptyValues(scope: FreeDaysScope): FreeDaysFormValues {
  return {
    scope,
    scopeId: "",
    demurrageDays: "",
    detentionDays: "",
    reeferPlugInDays: "",
    demurrageAlertHours: "",
    detentionAlertHours: "",
    reeferAlertHours: "",
    isActive: true,
  };
}

const FORM_ID = "free-days-form";

function toNullableInt(value: string | undefined): number | null {
  if (!value || value.trim() === "") return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

export function FreeDaysFormDialog({
  open,
  onOpenChange,
  initialScope,
  editing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialScope: FreeDaysScope;
  editing: FreeDaysConfig | null;
}) {
  const isEditing = editing !== null;
  const form = useForm<FreeDaysFormValues>({
    resolver: zodResolver(freeDaysSchema),
    defaultValues: emptyValues(initialScope),
    mode: "onBlur",
  });
  const { data: clients = [] } = useClients();
  const { data: bookings = [] } = useBookings();
  const createMutation = useCreateFreeDaysConfig();
  const updateMutation = useUpdateFreeDaysConfig();

  useEffect(() => {
    if (open) {
      if (editing) {
        const scope: FreeDaysScope =
          editing.clientId !== null ? "client" : "booking";
        const scopeId =
          editing.clientId !== null
            ? String(editing.clientId)
            : editing.bookingId !== null
              ? String(editing.bookingId)
              : "";
        form.reset({
          scope,
          scopeId,
          demurrageDays:
            editing.demurrageDays !== null ? String(editing.demurrageDays) : "",
          detentionDays:
            editing.detentionDays !== null ? String(editing.detentionDays) : "",
          reeferPlugInDays:
            editing.reeferPlugInDays !== null
              ? String(editing.reeferPlugInDays)
              : "",
          demurrageAlertHours:
            editing.demurrageAlertHours !== null
              ? String(editing.demurrageAlertHours)
              : "",
          detentionAlertHours:
            editing.detentionAlertHours !== null
              ? String(editing.detentionAlertHours)
              : "",
          reeferAlertHours:
            editing.reeferAlertHours !== null
              ? String(editing.reeferAlertHours)
              : "",
          isActive: editing.isActive,
        });
      } else {
        form.reset(emptyValues(initialScope));
      }
    }
  }, [open, editing, initialScope, form]);

  const scope = form.watch("scope");

  const onSubmit = async (values: FreeDaysFormValues) => {
    const payload: FreeDaysPayload = {
      clientId: values.scope === "client" ? Number(values.scopeId) : null,
      bookingId: values.scope === "booking" ? Number(values.scopeId) : null,
      demurrageDays: toNullableInt(values.demurrageDays),
      detentionDays: toNullableInt(values.detentionDays),
      reeferPlugInDays: toNullableInt(values.reeferPlugInDays),
      demurrageAlertHours: toNullableInt(values.demurrageAlertHours),
      detentionAlertHours: toNullableInt(values.detentionAlertHours),
      reeferAlertHours: toNullableInt(values.reeferAlertHours),
      isActive: values.isActive,
    };

    try {
      if (isEditing && editing) {
        await updateMutation.mutateAsync({ id: editing.id, payload });
        toast.success("Configuración actualizada");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Configuración creada");
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(
        explainNotificationError(
          error,
          isEditing
            ? "No se pudo actualizar la configuración"
            : "No se pudo crear la configuración"
        )
      );
    }
  };

  const isSubmitting = form.formState.isSubmitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? "Editar configuración"
              : "Crear configuración de free days"}
          </DialogTitle>
          <DialogDescription>
            Define los días libres y alertas para demurrage, detention y reefer
            plug-in. La configuración por booking sobrescribe la del cliente.
          </DialogDescription>
        </DialogHeader>

        <form
          id={FORM_ID}
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6"
          noValidate
        >
          <section className="space-y-5">
            <FieldSectionTitle>Alcance</FieldSectionTitle>
            <FieldGroup className="grid gap-6 sm:grid-cols-2">
              <Controller
                name="scope"
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor="fd-scope">
                      Tipo <FieldRequiredMark />
                    </FieldLabel>
                    <Select
                      value={field.value}
                      onValueChange={(v) => {
                        field.onChange(v as FreeDaysScope);
                        form.setValue("scopeId", "");
                      }}
                      disabled={isEditing}
                    >
                      <SelectTrigger id="fd-scope">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="client">
                          Default por cliente
                        </SelectItem>
                        <SelectItem value="booking">
                          Override por booking
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FieldDescription>
                      Debes seleccionar cliente O booking, no ambos.
                    </FieldDescription>
                  </Field>
                )}
              />
              <Controller
                name="scopeId"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="fd-scope-id">
                      {scope === "client" ? "Cliente" : "Booking"}{" "}
                      <FieldRequiredMark />
                    </FieldLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isEditing}
                    >
                      <SelectTrigger id="fd-scope-id">
                        <SelectValue placeholder="Selecciona…" />
                      </SelectTrigger>
                      <SelectContent>
                        {scope === "client"
                          ? clients
                              .filter((c) => c.active)
                              .map((c) => (
                                <SelectItem key={c.id} value={String(c.id)}>
                                  {c.name}
                                </SelectItem>
                              ))
                          : bookings.map((b) => (
                              <SelectItem key={b.id} value={String(b.id)}>
                                #{b.id} ·{" "}
                                {b.Client?.name ?? "Sin cliente"}
                                {b.booking ? ` · ${b.booking}` : ""}
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
            </FieldGroup>
          </section>

          <section className="space-y-5">
            <FieldSectionTitle>Demurrage</FieldSectionTitle>
            <FieldGroup className="grid gap-6 sm:grid-cols-2">
              <Controller
                name="demurrageDays"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="fd-dem-days">Días libres</FieldLabel>
                    <Input
                      {...field}
                      id="fd-dem-days"
                      type="number"
                      min={0}
                      step={1}
                      placeholder="Ej. 7"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="demurrageAlertHours"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="fd-dem-alert">
                      Frecuencia alerta (horas)
                    </FieldLabel>
                    <Input
                      {...field}
                      id="fd-dem-alert"
                      type="number"
                      min={0}
                      step={1}
                      placeholder="Ej. 24"
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
            <FieldSectionTitle>Detention</FieldSectionTitle>
            <FieldGroup className="grid gap-6 sm:grid-cols-2">
              <Controller
                name="detentionDays"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="fd-det-days">Días libres</FieldLabel>
                    <Input
                      {...field}
                      id="fd-det-days"
                      type="number"
                      min={0}
                      step={1}
                      placeholder="Ej. 5"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="detentionAlertHours"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="fd-det-alert">
                      Frecuencia alerta (horas)
                    </FieldLabel>
                    <Input
                      {...field}
                      id="fd-det-alert"
                      type="number"
                      min={0}
                      step={1}
                      placeholder="Ej. 24"
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
            <FieldSectionTitle>Reefer plug-in</FieldSectionTitle>
            <FieldGroup className="grid gap-6 sm:grid-cols-2">
              <Controller
                name="reeferPlugInDays"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="fd-reef-days">Días libres</FieldLabel>
                    <Input
                      {...field}
                      id="fd-reef-days"
                      type="number"
                      min={0}
                      step={1}
                      placeholder="Ej. 3"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="reeferAlertHours"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="fd-reef-alert">
                      Frecuencia alerta (horas)
                    </FieldLabel>
                    <Input
                      {...field}
                      id="fd-reef-alert"
                      type="number"
                      min={0}
                      step={1}
                      placeholder="Ej. 12"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </FieldGroup>
          </section>

          <Controller
            name="isActive"
            control={form.control}
            render={({ field }) => (
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(v) => field.onChange(v === true)}
                />
                Activa
              </label>
            )}
          />
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
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
