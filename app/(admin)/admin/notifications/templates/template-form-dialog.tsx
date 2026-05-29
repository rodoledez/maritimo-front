"use client";

import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { useClients } from "@/lib/hooks/use-clients";
import {
  useCreateNotificationTemplate,
  useUpdateNotificationTemplate,
} from "@/lib/hooks/use-notifications";
import {
  NOTIFICATION_EVENT_TYPES,
  TEMPLATE_VARIABLES,
  eventTypeLabel,
  renderHandlebarsPreview,
} from "@/lib/notifications/constants";
import type { TemplatePayload } from "@/lib/api/notifications";
import type {
  NotificationEventType,
  NotificationTemplate,
} from "@/types/domain";

import { explainNotificationError } from "../_shared";

const GLOBAL_SCOPE = "__global__";

const templateSchema = z.object({
  eventType: z.enum(
    NOTIFICATION_EVENT_TYPES as [NotificationEventType, ...NotificationEventType[]]
  ),
  clientId: z.string(),
  subject: z.string().min(1, "Debe ingresar un asunto"),
  bodyHtml: z.string().min(1, "Debe ingresar el cuerpo HTML"),
  bodyText: z.string().optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  isActive: z.boolean(),
});

type TemplateFormValues = z.infer<typeof templateSchema>;

const emptyValues: TemplateFormValues = {
  eventType: "GATE_OUT",
  clientId: GLOBAL_SCOPE,
  subject: "",
  bodyHtml: "",
  bodyText: "",
  description: "",
  isActive: true,
};

const FORM_ID = "notification-template-form";

export function TemplateFormDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: NotificationTemplate | null;
}) {
  const isEditing = editing !== null;
  const form = useForm<TemplateFormValues>({
    resolver: zodResolver(templateSchema),
    defaultValues: emptyValues,
    mode: "onBlur",
  });
  const { data: clients = [] } = useClients();
  const createMutation = useCreateNotificationTemplate();
  const updateMutation = useUpdateNotificationTemplate();
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (open) {
      form.reset(
        editing
          ? {
              eventType: editing.eventType,
              clientId:
                editing.clientId === null ? GLOBAL_SCOPE : String(editing.clientId),
              subject: editing.subject,
              bodyHtml: editing.bodyHtml,
              bodyText: editing.bodyText ?? "",
              description: editing.description ?? "",
              isActive: editing.isActive,
            }
          : emptyValues
      );
    }
  }, [open, editing, form]);

  const subjectValue = form.watch("subject");
  const bodyHtmlValue = form.watch("bodyHtml");

  const subjectPreview = useMemo(
    () => renderHandlebarsPreview(subjectValue ?? ""),
    [subjectValue]
  );
  const bodyPreview = useMemo(
    () => renderHandlebarsPreview(bodyHtmlValue ?? ""),
    [bodyHtmlValue]
  );

  const onSubmit = async (values: TemplateFormValues) => {
    const payload: TemplatePayload = {
      eventType: values.eventType,
      clientId:
        values.clientId === GLOBAL_SCOPE ? null : Number(values.clientId),
      subject: values.subject,
      bodyHtml: values.bodyHtml,
      bodyText: values.bodyText?.trim() ? values.bodyText : null,
      description: values.description?.trim() ? values.description : null,
      isActive: values.isActive,
    };

    try {
      if (isEditing && editing) {
        await updateMutation.mutateAsync({ id: editing.id, payload });
        toast.success("Plantilla actualizada");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Plantilla creada");
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(
        explainNotificationError(
          error,
          isEditing
            ? "No se pudo actualizar la plantilla"
            : "No se pudo crear la plantilla"
        )
      );
    }
  };

  const isSubmitting = form.formState.isSubmitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar plantilla" : "Crear plantilla"}
          </DialogTitle>
          <DialogDescription>
            Plantillas Handlebars para correos de tracking. Usa{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              {"{{variable}}"}
            </code>{" "}
            para incluir datos del booking.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 lg:grid-cols-[1fr_220px]">
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
                      <FieldLabel htmlFor="template-event">
                        Evento <FieldRequiredMark />
                      </FieldLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={isEditing}
                      >
                        <SelectTrigger id="template-event">
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
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="template-client">
                        Cliente
                      </FieldLabel>
                      <SearchableSelect
                        id="template-client"
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={isEditing}
                        placeholder="Selecciona…"
                        searchPlaceholder="Buscar cliente…"
                        options={[
                          { value: GLOBAL_SCOPE, label: "Plantilla global" },
                          ...clients
                            .filter((c) => c.active)
                            .map((c) => ({
                              value: String(c.id),
                              label: c.name,
                            })),
                        ]}
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
              <FieldSectionTitle>Contenido</FieldSectionTitle>
              <Controller
                name="subject"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="template-subject">
                      Asunto <FieldRequiredMark />
                    </FieldLabel>
                    <Input
                      {...field}
                      id="template-subject"
                      aria-invalid={fieldState.invalid}
                      placeholder="TRACKING DE CARGA BOOKING {{bookingNumber}}…"
                      autoComplete="off"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="bodyHtml"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="template-body-html">
                      Cuerpo HTML <FieldRequiredMark />
                    </FieldLabel>
                    <Textarea
                      {...field}
                      id="template-body-html"
                      aria-invalid={fieldState.invalid}
                      placeholder="<p>Estimado {{clientName}}…</p>"
                      className="min-h-48 font-mono text-xs"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="bodyText"
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor="template-body-text">
                      Cuerpo texto plano (opcional)
                    </FieldLabel>
                    <Textarea
                      {...field}
                      id="template-body-text"
                      placeholder="Versión texto plano del correo"
                      className="min-h-24 font-mono text-xs"
                    />
                  </Field>
                )}
              />
              <Controller
                name="description"
                control={form.control}
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor="template-description">
                      Descripción interna
                    </FieldLabel>
                    <Input
                      {...field}
                      id="template-description"
                      placeholder="Para qué se usa esta plantilla"
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

            {showPreview ? (
              <section className="space-y-3 rounded-lg border bg-muted/30 p-4">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Vista previa con datos de ejemplo
                </h4>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Asunto</p>
                  <p className="text-sm font-medium">{subjectPreview || "—"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Cuerpo</p>
                  <div
                    className="rounded border bg-background p-3 text-sm"
                    dangerouslySetInnerHTML={{ __html: bodyPreview || "—" }}
                  />
                </div>
              </section>
            ) : null}
          </form>

          <aside className="space-y-3">
            <FieldSectionTitle>Variables disponibles</FieldSectionTitle>
            <ul className="space-y-2">
              {TEMPLATE_VARIABLES.map((v) => (
                <li key={v.name} className="space-y-0.5">
                  <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                    {`{{${v.name}}}`}
                  </code>
                  <p className="text-xs text-muted-foreground">
                    {v.description}
                  </p>
                </li>
              ))}
            </ul>
          </aside>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setShowPreview((p) => !p)}
          >
            {showPreview ? (
              <>
                <EyeOff className="h-4 w-4" />
                Ocultar vista previa
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                Vista previa
              </>
            )}
          </Button>
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
