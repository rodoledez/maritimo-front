"use client";

import { useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
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
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Switch } from "@/components/ui/switch";
import { useClients } from "@/lib/hooks/use-clients";
import { useNotificationTemplates } from "@/lib/hooks/use-notifications";
import {
  useCreateWeeklySummarySchedule,
  useUpdateWeeklySummarySchedule,
} from "@/lib/hooks/use-weekly-summary";
import {
  DAYS_OF_WEEK,
  DEFAULT_TIMEZONE,
  DEFAULT_TIME_OF_DAY,
  splitRecipientEmails,
  supportedTimezones,
} from "@/lib/notifications/weekly-summary";
import type { WeeklySummarySchedulePayload } from "@/lib/api/weekly-summary";
import { isApiError } from "@/types/api";
import type { WeeklySummarySchedule } from "@/types/domain";

import { explainNotificationError } from "../_shared";

const GLOBAL_TEMPLATE = "__global__";

/** `"HH:mm"` de 00:00 a 23:59. */
const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const scheduleSchema = z.object({
  clientId: z.string().min(1, "Debe seleccionar un cliente"),
  dayOfWeek: z.string().min(1, "Debe seleccionar un día"),
  timeOfDay: z
    .string()
    .regex(TIME_REGEX, "Debe tener el formato HH:mm (00:00 a 23:59)"),
  timezone: z.string().min(1, "Debe seleccionar una zona horaria"),
  isActive: z.boolean(),
  sendWhenEmpty: z.boolean(),
  templateId: z.string(),
  recipientEmails: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine(
      (value) =>
        !value || splitRecipientEmails(value).every((e) => EMAIL_REGEX.test(e)),
      "Revisa la lista: hay un correo con formato inválido"
    ),
});

type ScheduleFormValues = z.infer<typeof scheduleSchema>;

const emptyValues: ScheduleFormValues = {
  clientId: "",
  dayOfWeek: "3",
  timeOfDay: DEFAULT_TIME_OF_DAY,
  timezone: DEFAULT_TIMEZONE,
  isActive: true,
  sendWhenEmpty: false,
  templateId: GLOBAL_TEMPLATE,
  recipientEmails: "",
};

const FORM_ID = "weekly-summary-schedule-form";

export function ScheduleFormDialog({
  open,
  onOpenChange,
  editing,
  /** Clientes que ya tienen programación: se excluyen del alta (UNIQUE clientId). */
  takenClientIds,
  onConflict,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: WeeklySummarySchedule | null;
  takenClientIds: number[];
  onConflict?: (clientId: number) => void;
}) {
  const isEditing = editing !== null;
  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: emptyValues,
    mode: "onBlur",
  });
  const { data: clients = [] } = useClients();
  const { data: templatesPage } = useNotificationTemplates({
    eventType: "WEEKLY_SUMMARY",
    take: 100,
  });
  const createMutation = useCreateWeeklySummarySchedule();
  const updateMutation = useUpdateWeeklySummarySchedule();

  const timezones = useMemo(() => supportedTimezones(), []);

  const clientOptions = useMemo(() => {
    const taken = new Set(takenClientIds.map(Number));
    return clients
      .filter((c) => c.active)
      // Al editar el cliente no se puede cambiar; al crear, sólo los que no tienen una.
      .filter((c) => isEditing || !taken.has(Number(c.id)))
      .map((c) => ({ value: String(c.id), label: c.name }));
  }, [clients, takenClientIds, isEditing]);

  const templateOptions = useMemo(
    () => [
      { value: GLOBAL_TEMPLATE, label: "Plantilla global" },
      ...(templatesPage?.rows ?? []).map((t) => ({
        value: String(t.id),
        label: t.clientId === null ? `${t.subject} (global)` : t.subject,
      })),
    ],
    [templatesPage]
  );

  useEffect(() => {
    if (open) {
      form.reset(
        editing
          ? {
              clientId: String(editing.clientId),
              dayOfWeek: String(editing.dayOfWeek),
              timeOfDay: editing.timeOfDay ?? DEFAULT_TIME_OF_DAY,
              timezone: editing.timezone ?? DEFAULT_TIMEZONE,
              isActive: editing.isActive,
              sendWhenEmpty: editing.sendWhenEmpty,
              templateId:
                editing.templateId === null
                  ? GLOBAL_TEMPLATE
                  : String(editing.templateId),
              recipientEmails: editing.recipientEmails ?? "",
            }
          : emptyValues
      );
    }
  }, [open, editing, form]);

  const onSubmit = async (values: ScheduleFormValues) => {
    const common = {
      dayOfWeek: Number(values.dayOfWeek),
      timeOfDay: values.timeOfDay,
      timezone: values.timezone,
      isActive: values.isActive,
      sendWhenEmpty: values.sendWhenEmpty,
      templateId:
        values.templateId === GLOBAL_TEMPLATE
          ? null
          : Number(values.templateId),
      recipientEmails: values.recipientEmails?.trim()
        ? splitRecipientEmails(values.recipientEmails).join(", ")
        : null,
    };

    try {
      if (isEditing && editing) {
        await updateMutation.mutateAsync({ id: editing.id, payload: common });
        toast.success("Programación actualizada");
      } else {
        const payload: WeeklySummarySchedulePayload = {
          clientId: Number(values.clientId),
          ...common,
        };
        await createMutation.mutateAsync(payload);
        toast.success("Programación creada");
      }
      onOpenChange(false);
    } catch (error) {
      if (!isEditing && isApiError(error) && error.status === 409) {
        onOpenChange(false);
        onConflict?.(Number(values.clientId));
        return;
      }
      toast.error(
        explainNotificationError(
          error,
          isEditing
            ? "No se pudo actualizar la programación"
            : "No se pudo crear la programación"
        )
      );
    }
  };

  const isSubmitting = form.formState.isSubmitting;
  const timezoneValue = form.watch("timezone");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar programación" : "Programar resumen semanal"}
          </DialogTitle>
          <DialogDescription>
            Un correo semanal por cliente con todos sus embarques en curso y el
            último estado de ShipsGo.
          </DialogDescription>
        </DialogHeader>

        <form
          id={FORM_ID}
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6"
          noValidate
        >
          <section className="space-y-5">
            <FieldSectionTitle>Cuándo</FieldSectionTitle>
            <Controller
              name="clientId"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="ws-client">
                    Cliente <FieldRequiredMark />
                  </FieldLabel>
                  <SearchableSelect
                    id="ws-client"
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isEditing}
                    placeholder="Selecciona…"
                    searchPlaceholder="Buscar cliente…"
                    options={clientOptions}
                    aria-invalid={fieldState.invalid}
                  />
                  <FieldDescription>
                    {isEditing
                      ? "El cliente no se puede cambiar: crea otra programación si hace falta."
                      : "Sólo aparecen los clientes que todavía no tienen una programación."}
                  </FieldDescription>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <FieldGroup className="grid gap-6 sm:grid-cols-3">
              <Controller
                name="dayOfWeek"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="ws-day">
                      Día <FieldRequiredMark />
                    </FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="ws-day">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DAYS_OF_WEEK.map((d) => (
                          <SelectItem key={d.value} value={String(d.value)}>
                            {d.label}
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
                name="timeOfDay"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="ws-time">
                      Hora <FieldRequiredMark />
                    </FieldLabel>
                    <Input
                      {...field}
                      id="ws-time"
                      type="time"
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldDescription>
                      Hora local de la zona horaria elegida.
                    </FieldDescription>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="timezone"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="ws-timezone">
                      Zona horaria <FieldRequiredMark />
                    </FieldLabel>
                    <SearchableSelect
                      id="ws-timezone"
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Selecciona…"
                      searchPlaceholder="Buscar zona…"
                      options={timezones.map((tz) => ({
                        value: tz,
                        label: tz,
                      }))}
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </FieldGroup>
            <p className="text-xs text-muted-foreground">
              La hora se guarda como hora de pared:{" "}
              <span className="font-medium text-foreground">
                {form.watch("timeOfDay") || "—"}
              </span>{" "}
              en <span className="font-mono">{timezoneValue}</span>. Cuando Chile
              cambia de horario el envío igual sale a esa hora local.
            </p>
          </section>

          <section className="space-y-5">
            <FieldSectionTitle>Contenido y destinatarios</FieldSectionTitle>
            <Controller
              name="templateId"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="ws-template">Plantilla</FieldLabel>
                  <SearchableSelect
                    id="ws-template"
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder="Plantilla global"
                    searchPlaceholder="Buscar plantilla…"
                    options={templateOptions}
                  />
                  <FieldDescription>
                    Sólo plantillas de tipo Resumen semanal. Vacío = se usa la
                    plantilla global.
                  </FieldDescription>
                </Field>
              )}
            />
            <Controller
              name="recipientEmails"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="ws-recipients">
                    Destinatarios
                  </FieldLabel>
                  <Input
                    {...field}
                    id="ws-recipients"
                    aria-invalid={fieldState.invalid}
                    placeholder="ana@empresa.cl, operaciones@empresa.cl"
                    autoComplete="off"
                  />
                  <FieldDescription>
                    Si lo dejas vacío, el resumen va a los contactos de Tracking
                    del cliente suscritos a este evento. Si escribes correos
                    acá, se usan <em>en vez</em> de los contactos.
                  </FieldDescription>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </section>

          <section className="space-y-3">
            <Controller
              name="sendWhenEmpty"
              control={form.control}
              render={({ field }) => (
                <Field
                  orientation="horizontal"
                  className="justify-between rounded-lg border p-3"
                >
                  <div className="space-y-1">
                    <FieldLabel htmlFor="ws-send-empty">
                      Enviar aunque no haya embarques
                    </FieldLabel>
                    <FieldDescription>
                      Por defecto, si el cliente no tiene embarques en curso esa
                      semana no se envía nada. Actívalo sólo si el cliente pidió
                      recibir el aviso igual.
                    </FieldDescription>
                  </div>
                  <Switch
                    id="ws-send-empty"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </Field>
              )}
            />
            <Controller
              name="isActive"
              control={form.control}
              render={({ field }) => (
                <Field
                  orientation="horizontal"
                  className="justify-between rounded-lg border p-3"
                >
                  <div className="space-y-1">
                    <FieldLabel htmlFor="ws-active">Activa</FieldLabel>
                    <FieldDescription>
                      Pausar una programación la conserva, pero deja de enviarse.
                    </FieldDescription>
                  </div>
                  <Switch
                    id="ws-active"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </Field>
              )}
            />
          </section>
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
