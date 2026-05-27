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
import { Textarea } from "@/components/ui/textarea";
import { useClients } from "@/lib/hooks/use-clients";
import {
  useCreateNotificationRule,
  useUpdateNotificationRule,
} from "@/lib/hooks/use-notifications";
import {
  NOTIFICATION_EVENT_TYPES,
  NOTIFICATION_REFERENCE_FIELDS,
  NOTIFICATION_TRIGGER_TYPES,
  eventTypeLabel,
  referenceFieldLabel,
  triggerTypeLabel,
} from "@/lib/notifications/constants";
import type { RulePayload } from "@/lib/api/notifications";
import type {
  NotificationEventType,
  NotificationReferenceField,
  NotificationRule,
  NotificationTriggerType,
} from "@/types/domain";

import { explainNotificationError } from "../_shared";

const GLOBAL_SCOPE = "__global__";

const TIME_REGEX = /^\d{2}:\d{2}(:\d{2})?$/;

const ruleSchema = z
  .object({
    eventType: z.enum(
      NOTIFICATION_EVENT_TYPES as [
        NotificationEventType,
        ...NotificationEventType[],
      ]
    ),
    clientId: z.string(),
    name: z.string().min(1, "Debe ingresar un nombre"),
    triggerType: z.enum(
      NOTIFICATION_TRIGGER_TYPES as [
        NotificationTriggerType,
        ...NotificationTriggerType[],
      ]
    ),
    referenceField: z.string().optional().or(z.literal("")),
    offsetHours: z.string().optional().or(z.literal("")),
    atTimeOfDay: z.string().optional().or(z.literal("")),
    recurrenceHours: z.string().optional().or(z.literal("")),
    maxRecurrences: z.string().optional().or(z.literal("")),
    conditionJson: z.string().optional().or(z.literal("")),
    description: z.string().optional().or(z.literal("")),
    isActive: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (
      data.triggerType === "BEFORE_REFERENCE" ||
      data.triggerType === "AFTER_REFERENCE"
    ) {
      if (!data.referenceField) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["referenceField"],
          message: "Selecciona la fecha de referencia",
        });
      }
      if (!data.offsetHours || Number.isNaN(Number(data.offsetHours))) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["offsetHours"],
          message: "Debe ingresar las horas de offset",
        });
      }
    }
    if (data.triggerType === "AT_TIME_OF_DAY") {
      if (!data.atTimeOfDay || !TIME_REGEX.test(data.atTimeOfDay)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["atTimeOfDay"],
          message: "Formato HH:mm o HH:mm:ss",
        });
      }
    }
    if (data.triggerType === "PERIODIC") {
      if (
        !data.recurrenceHours ||
        Number.isNaN(Number(data.recurrenceHours)) ||
        Number(data.recurrenceHours) <= 0
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["recurrenceHours"],
          message: "Debe ingresar la frecuencia en horas",
        });
      }
    }
    if (data.conditionJson && data.conditionJson.trim()) {
      try {
        JSON.parse(data.conditionJson);
      } catch {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["conditionJson"],
          message: "JSON inválido",
        });
      }
    }
  });

type RuleFormValues = z.infer<typeof ruleSchema>;

const emptyValues: RuleFormValues = {
  eventType: "GATE_OUT",
  clientId: GLOBAL_SCOPE,
  name: "",
  triggerType: "ON_EVENT",
  referenceField: "",
  offsetHours: "",
  atTimeOfDay: "",
  recurrenceHours: "",
  maxRecurrences: "",
  conditionJson: "",
  description: "",
  isActive: true,
};

const FORM_ID = "notification-rule-form";

export function RuleFormDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: NotificationRule | null;
}) {
  const isEditing = editing !== null;
  const form = useForm<RuleFormValues>({
    resolver: zodResolver(ruleSchema),
    defaultValues: emptyValues,
    mode: "onBlur",
  });
  const { data: clients = [] } = useClients();
  const createMutation = useCreateNotificationRule();
  const updateMutation = useUpdateNotificationRule();

  useEffect(() => {
    if (open) {
      form.reset(
        editing
          ? {
              eventType: editing.eventType,
              clientId:
                editing.clientId === null ? GLOBAL_SCOPE : String(editing.clientId),
              name: editing.name,
              triggerType: editing.triggerType,
              referenceField: editing.referenceField ?? "",
              offsetHours:
                editing.offsetHours !== null ? String(editing.offsetHours) : "",
              atTimeOfDay: editing.atTimeOfDay ?? "",
              recurrenceHours:
                editing.recurrenceHours !== null
                  ? String(editing.recurrenceHours)
                  : "",
              maxRecurrences:
                editing.maxRecurrences !== null
                  ? String(editing.maxRecurrences)
                  : "",
              conditionJson: editing.conditionJson
                ? JSON.stringify(editing.conditionJson, null, 2)
                : "",
              description: editing.description ?? "",
              isActive: editing.isActive,
            }
          : emptyValues
      );
    }
  }, [open, editing, form]);

  const triggerType = form.watch("triggerType");
  const showReference =
    triggerType === "BEFORE_REFERENCE" || triggerType === "AFTER_REFERENCE";
  const showTimeOfDay = triggerType === "AT_TIME_OF_DAY";
  const showPeriodic = triggerType === "PERIODIC";

  const onSubmit = async (values: RuleFormValues) => {
    const payload: RulePayload = {
      eventType: values.eventType,
      clientId:
        values.clientId === GLOBAL_SCOPE ? null : Number(values.clientId),
      name: values.name,
      triggerType: values.triggerType,
      referenceField: showReference
        ? (values.referenceField as NotificationReferenceField)
        : null,
      offsetHours: showReference ? Number(values.offsetHours) : null,
      atTimeOfDay: showTimeOfDay ? values.atTimeOfDay || null : null,
      recurrenceHours: showPeriodic ? Number(values.recurrenceHours) : null,
      maxRecurrences:
        showPeriodic && values.maxRecurrences
          ? Number(values.maxRecurrences)
          : null,
      conditionJson:
        values.conditionJson && values.conditionJson.trim()
          ? (JSON.parse(values.conditionJson) as Record<string, unknown>)
          : null,
      description: values.description?.trim() ? values.description : null,
      isActive: values.isActive,
    };

    try {
      if (isEditing && editing) {
        await updateMutation.mutateAsync({ id: editing.id, payload });
        toast.success("Regla actualizada");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Regla creada");
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(
        explainNotificationError(
          error,
          isEditing ? "No se pudo actualizar la regla" : "No se pudo crear la regla"
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
            {isEditing ? "Editar regla" : "Crear regla"}
          </DialogTitle>
          <DialogDescription>
            Define cuándo enviar una notificación de tracking para un evento.
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
                name="eventType"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="rule-event">
                      Evento <FieldRequiredMark />
                    </FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="rule-event">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {NOTIFICATION_EVENT_TYPES.map((evt) => (
                          <SelectItem key={evt} value={evt}>
                            {eventTypeLabel(evt)}
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
                name="clientId"
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor="rule-client">Cliente</FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="rule-client">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={GLOBAL_SCOPE}>
                          Regla global
                        </SelectItem>
                        {clients
                          .filter((c) => c.active)
                          .map((c) => (
                            <SelectItem key={c.id} value={String(c.id)}>
                              {c.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <FieldDescription>
                      Si existen reglas por cliente para este evento, las reglas
                      globales no aplican.
                    </FieldDescription>
                  </Field>
                )}
              />
            </FieldGroup>
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="rule-name">
                    Nombre <FieldRequiredMark />
                  </FieldLabel>
                  <Input
                    {...field}
                    id="rule-name"
                    aria-invalid={fieldState.invalid}
                    placeholder="Ej. Reporte 24h antes del corte"
                    autoComplete="off"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </section>

          <section className="space-y-5">
            <FieldSectionTitle>Disparador</FieldSectionTitle>
            <Controller
              name="triggerType"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="rule-trigger">
                    Tipo de disparo <FieldRequiredMark />
                  </FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="rule-trigger">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {NOTIFICATION_TRIGGER_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {triggerTypeLabel(t)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            />

            {showReference ? (
              <FieldGroup className="grid gap-6 sm:grid-cols-2">
                <Controller
                  name="referenceField"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="rule-reference">
                        Fecha de referencia <FieldRequiredMark />
                      </FieldLabel>
                      <Select
                        value={field.value || ""}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger id="rule-reference">
                          <SelectValue placeholder="Selecciona…" />
                        </SelectTrigger>
                        <SelectContent>
                          {NOTIFICATION_REFERENCE_FIELDS.map((rf) => (
                            <SelectItem key={rf} value={rf}>
                              {referenceFieldLabel(rf)}
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
                  name="offsetHours"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="rule-offset">
                        Offset (horas) <FieldRequiredMark />
                      </FieldLabel>
                      <Input
                        {...field}
                        id="rule-offset"
                        type="number"
                        min={0}
                        step={1}
                        aria-invalid={fieldState.invalid}
                        placeholder="24"
                      />
                      <FieldDescription>
                        Cantidad de horas{" "}
                        {triggerType === "BEFORE_REFERENCE" ? "antes" : "después"}{" "}
                        de la fecha de referencia.
                      </FieldDescription>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </FieldGroup>
            ) : null}

            {showTimeOfDay ? (
              <Controller
                name="atTimeOfDay"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="rule-time">
                      Hora del día <FieldRequiredMark />
                    </FieldLabel>
                    <Input
                      {...field}
                      id="rule-time"
                      type="time"
                      step={1}
                      aria-invalid={fieldState.invalid}
                      className="w-40"
                    />
                    <FieldDescription>
                      Hora local (HH:mm o HH:mm:ss) a la que se dispara.
                    </FieldDescription>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            ) : null}

            {showPeriodic ? (
              <FieldGroup className="grid gap-6 sm:grid-cols-2">
                <Controller
                  name="recurrenceHours"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="rule-recurrence">
                        Frecuencia (horas) <FieldRequiredMark />
                      </FieldLabel>
                      <Input
                        {...field}
                        id="rule-recurrence"
                        type="number"
                        min={1}
                        step={1}
                        aria-invalid={fieldState.invalid}
                        placeholder="24"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  name="maxRecurrences"
                  control={form.control}
                  render={({ field }) => (
                    <Field>
                      <FieldLabel htmlFor="rule-max">
                        Máximo de envíos
                      </FieldLabel>
                      <Input
                        {...field}
                        id="rule-max"
                        type="number"
                        min={1}
                        step={1}
                        placeholder="Sin límite"
                      />
                      <FieldDescription>
                        Vacío = sin límite.
                      </FieldDescription>
                    </Field>
                  )}
                />
              </FieldGroup>
            ) : null}
          </section>

          <section className="space-y-5">
            <FieldSectionTitle>Avanzado</FieldSectionTitle>
            <Controller
              name="conditionJson"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="rule-condition">
                    Condición (JSON)
                  </FieldLabel>
                  <Textarea
                    {...field}
                    id="rule-condition"
                    aria-invalid={fieldState.invalid}
                    placeholder={`{\n  "type": "container_count_compare",\n  "lhs": "gatedOutCount",\n  "op": "<",\n  "rhs": "confirmedCount"\n}`}
                    className="min-h-32 font-mono text-xs"
                  />
                  <FieldDescription>
                    Condición opcional evaluada antes de disparar.
                  </FieldDescription>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="description"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="rule-description">
                    Descripción interna
                  </FieldLabel>
                  <Input
                    {...field}
                    id="rule-description"
                    placeholder="Para qué se usa esta regla"
                    autoComplete="off"
                  />
                </Field>
              )}
            />
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
