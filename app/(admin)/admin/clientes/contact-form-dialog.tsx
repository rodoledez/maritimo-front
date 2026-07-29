"use client";

import { useEffect } from "react";
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
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  NOTIFICATION_EVENT_TYPES,
  eventTypeLabel,
} from "@/lib/notifications/constants";
import {
  CONTACT_CATEGORIES,
  contactCategoryDescription,
  contactCategoryLabel,
} from "@/lib/contacts/constants";
import { useCreateContact, useUpdateContact } from "@/lib/hooks/use-contacts";
import type { ContactPayload } from "@/lib/api/contacts";
import { isApiError } from "@/types/api";
import type { ClientContact, NotificationEventType } from "@/types/domain";

const EVENT_VALUES = NOTIFICATION_EVENT_TYPES as [
  NotificationEventType,
  ...NotificationEventType[],
];

const contactSchema = z.object({
  name: z.string().min(1, "Debe ingresar nombre"),
  email: z
    .string()
    .min(1, "Debe ingresar e-mail")
    .email("E-mail inválido"),
  category: z.enum(["BOOKING", "TRACKING"] as const, {
    required_error: "Debe seleccionar una categoría",
  }),
  subscribedEvents: z.array(z.enum(EVENT_VALUES)),
  active: z.boolean(),
});

type ContactFormValues = z.infer<typeof contactSchema>;

const emptyValues: ContactFormValues = {
  name: "",
  email: "",
  category: "BOOKING",
  subscribedEvents: [],
  active: true,
};

function explainError(error: unknown, fallback: string): string {
  if (!isApiError(error)) return fallback;
  const data = error.data as { message?: string } | undefined;
  return data?.message ?? error.message ?? fallback;
}

const FORM_ID = "contact-form";

export function ContactFormDialog({
  open,
  onOpenChange,
  clientId,
  editing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: ClientContact["clientId"];
  editing: ClientContact | null;
}) {
  const isEditing = editing !== null;
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: emptyValues,
    mode: "onBlur",
  });
  const createMutation = useCreateContact(clientId);
  const updateMutation = useUpdateContact(clientId);

  const category = form.watch("category");
  const isTracking = category === "TRACKING";

  useEffect(() => {
    if (open) {
      form.reset(
        editing
          ? {
              name: editing.name ?? "",
              email: editing.email ?? "",
              category: editing.category ?? "BOOKING",
              subscribedEvents: editing.subscribedEvents ?? [],
              active: editing.active ?? true,
            }
          : emptyValues
      );
    }
  }, [open, editing, form]);

  const onSubmit = async (values: ContactFormValues) => {
    const payload: ContactPayload = {
      name: values.name,
      email: values.email,
      category: values.category,
      active: values.active,
      // subscribedEvents only applies to TRACKING; empty = all events.
      ...(values.category === "TRACKING"
        ? { subscribedEvents: values.subscribedEvents }
        : {}),
    };

    try {
      if (isEditing && editing) {
        await updateMutation.mutateAsync({ contactId: editing.id, payload });
        toast.success("Contacto actualizado");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Contacto creado");
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(
        explainError(
          error,
          isEditing
            ? "No se pudo actualizar el contacto"
            : "No se pudo crear el contacto"
        )
      );
    }
  };

  const isSubmitting = form.formState.isSubmitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar contacto" : "Agregar contacto"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifica los datos del contacto."
              : "Completa los datos para agregar un nuevo contacto."}
          </DialogDescription>
        </DialogHeader>

        <form
          id={FORM_ID}
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6"
          noValidate
        >
          <FieldGroup className="grid gap-6 sm:grid-cols-2">
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="contact-name">
                    Nombre <FieldRequiredMark />
                  </FieldLabel>
                  <Input
                    {...field}
                    id="contact-name"
                    aria-invalid={fieldState.invalid}
                    placeholder="Nombre del contacto"
                    autoComplete="off"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="contact-email">
                    Mail <FieldRequiredMark />
                  </FieldLabel>
                  <Input
                    {...field}
                    id="contact-email"
                    type="email"
                    aria-invalid={fieldState.invalid}
                    placeholder="contacto@empresa.com"
                    autoComplete="off"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>

          <Controller
            name="category"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="contact-category">
                  Categoría <FieldRequiredMark />
                </FieldLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger
                    id="contact-category"
                    className="w-full"
                    aria-invalid={fieldState.invalid}
                  >
                    <SelectValue placeholder="Seleccione una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTACT_CATEGORIES.map((value) => (
                      <SelectItem key={value} value={value}>
                        {contactCategoryLabel(value)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldDescription>
                  {contactCategoryDescription(field.value)}
                </FieldDescription>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          {isTracking && (
            <Controller
              name="subscribedEvents"
              control={form.control}
              render={({ field }) => (
                <Field>
                  <FieldLabel>Eventos suscritos</FieldLabel>
                  <FieldDescription>
                    Deje todo sin marcar para recibir todos los eventos.
                  </FieldDescription>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {NOTIFICATION_EVENT_TYPES.map((event) => {
                      const checked = field.value.includes(event);
                      return (
                        <label
                          key={event}
                          className="flex items-center gap-2 rounded-md border p-2 text-sm"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(value) => {
                              field.onChange(
                                value === true
                                  ? [...field.value, event]
                                  : field.value.filter((e) => e !== event)
                              );
                            }}
                          />
                          {eventTypeLabel(event)}
                        </label>
                      );
                    })}
                  </div>
                </Field>
              )}
            />
          )}

          <Controller
            name="active"
            control={form.control}
            render={({ field }) => (
              <Field
                orientation="horizontal"
                className="justify-between rounded-lg border p-3"
              >
                <div className="space-y-1">
                  <FieldLabel htmlFor="contact-active">Activo</FieldLabel>
                  <FieldDescription>
                    Un contacto inactivo se conserva pero deja de recibir
                    correos.
                  </FieldDescription>
                </div>
                <Switch
                  id="contact-active"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </Field>
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
