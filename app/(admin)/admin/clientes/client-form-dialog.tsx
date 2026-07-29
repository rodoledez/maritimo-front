"use client";

import { useEffect, useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useCreateClient,
  useUpdateClient,
} from "@/lib/hooks/use-clients";
import { useContacts } from "@/lib/hooks/use-contacts";
import type { ClientPayload } from "@/lib/api/clients";
import { isApiError } from "@/types/api";
import type { Client } from "@/types/domain";

import { ClientContactsSection } from "./client-contacts-section";

const clientSchema = z.object({
  name: z.string().min(1, "Debe ingresar nombre empresa"),
  username: z
    .string()
    .min(1, "Debe ingresar nombre usuario (e-mail)")
    .email("E-mail inválido"),
  contactName: z.string().min(1, "Debe ingresar nombre contacto"),
  contactEmail: z
    .string()
    .min(1, "Debe ingresar e-mail contacto")
    .email("E-mail inválido"),
  contactEmail2: z
    .string()
    .refine(
      (value) =>
        value
          .split(/[,;]/)
          .map((email) => email.trim())
          .filter((email) => email.length > 0)
          .every((email) => z.string().email().safeParse(email).success),
      "E-mail inválido. Separe varios correos con coma o punto y coma"
    )
    .optional()
    .or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  notificationsEnabled: z.boolean(),
});

type ClientFormValues = z.infer<typeof clientSchema>;

const emptyValues: ClientFormValues = {
  name: "",
  username: "",
  contactName: "",
  contactEmail: "",
  contactEmail2: "",
  phone: "",
  notificationsEnabled: true,
};

function explainError(error: unknown, fallback: string): string {
  if (!isApiError(error)) return fallback;
  const data = error.data as
    | { name?: string; message?: string; errors?: Array<{ path?: string; message?: string; type?: string }> }
    | undefined;
  if (data?.name === "SequelizeUniqueConstraintError") {
    const usernameError = data.errors?.find(
      (e) => e.path === "username" || e.message?.includes("username")
    );
    return usernameError
      ? "Nombre de usuario ya creado"
      : "Ya existe un registro con estos datos";
  }
  if (
    error.status === 400 &&
    (data?.message?.includes("username") ||
      data?.message?.includes("unique") ||
      JSON.stringify(data ?? {}).includes("username must be unique"))
  ) {
    return "Nombre de usuario ya creado";
  }
  return data?.message ?? error.message ?? fallback;
}

const FORM_ID = "client-form";

export function ClientFormDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Client | null;
}) {
  const isEditing = editing !== null;
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: emptyValues,
    mode: "onBlur",
  });
  const createMutation = useCreateClient();
  const updateMutation = useUpdateClient();

  const [tab, setTab] = useState<"datos" | "contactos">("datos");
  const [showLegacy, setShowLegacy] = useState(false);

  // Shares its cache with the contacts grid (default, unfiltered query).
  const { data: contacts } = useContacts(editing?.id ?? null);
  const hasContacts = (contacts?.length ?? 0) > 0;

  // Reset the view state on close (in the handler, not an effect) so the next
  // open starts on the "datos" tab with the legacy fields collapsed.
  const close = () => {
    setTab("datos");
    setShowLegacy(false);
    onOpenChange(false);
  };

  useEffect(() => {
    if (open) {
      form.reset(
        editing
          ? {
              name: editing.name ?? "",
              username: editing.username ?? "",
              contactName: editing.contactName ?? "",
              contactEmail: editing.contactEmail ?? "",
              contactEmail2: editing.contactEmail2 ?? "",
              phone: editing.phone ?? "",
              notificationsEnabled: editing.notificationsEnabled ?? true,
            }
          : emptyValues
      );
    }
  }, [open, editing, form]);

  const onSubmit = async (values: ClientFormValues) => {
    const payload: ClientPayload = {
      name: values.name,
      username: values.username,
      contactName: values.contactName,
      contactEmail: values.contactEmail,
      contactEmail2: values.contactEmail2 || null,
      phone: values.phone || null,
      notificationsEnabled: values.notificationsEnabled,
    };

    try {
      if (isEditing && editing) {
        await updateMutation.mutateAsync({ id: editing.id, payload });
        toast.success("Cliente actualizado");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Cliente creado");
      }
      close();
    } catch (error) {
      toast.error(
        explainError(
          error,
          isEditing
            ? "No se pudo actualizar el cliente"
            : "No se pudo crear el cliente"
        )
      );
    }
  };

  const isSubmitting = form.formState.isSubmitting;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) close();
      }}
    >
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar cliente" : "Crear cliente"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifica los datos del cliente."
              : "Completa los datos para crear un nuevo cliente."}
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={tab}
          onValueChange={(value) => setTab(value as "datos" | "contactos")}
        >
          <TabsList>
            <TabsTrigger value="datos">Datos</TabsTrigger>
            <TabsTrigger value="contactos" disabled={!isEditing}>
              Contactos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="datos" className="mt-4">
            <form
              id={FORM_ID}
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-8"
              noValidate
            >
              <section className="space-y-5">
                <FieldSectionTitle>Datos de la empresa</FieldSectionTitle>
            <FieldGroup className="grid gap-8 sm:grid-cols-2">
              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="client-name">
                      Empresa <FieldRequiredMark />
                    </FieldLabel>
                    <Input
                      {...field}
                      id="client-name"
                      aria-invalid={fieldState.invalid}
                      placeholder="Ingrese el nombre de la empresa"
                      autoComplete="off"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="username"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="client-username">
                      Usuario (email) <FieldRequiredMark />
                    </FieldLabel>
                    <Input
                      {...field}
                      id="client-username"
                      type="email"
                      aria-invalid={fieldState.invalid}
                      placeholder="usuario@empresa.com"
                      disabled={isEditing}
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
                <div className="flex items-center justify-between gap-2 border-b pb-2">
                  <FieldSectionTitle className="border-0 pb-0">
                    {hasContacts
                      ? "Contacto principal (respaldo)"
                      : "Contacto principal"}
                  </FieldSectionTitle>
                  {hasContacts && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowLegacy((value) => !value)}
                    >
                      {showLegacy ? "Ocultar" : "Mostrar"}
                    </Button>
                  )}
                </div>

                {hasContacts && (
                  <FieldDescription>
                    Este cliente ya tiene contactos en la pestaña
                    &ldquo;Contactos&rdquo;. Estos campos se conservan como
                    respaldo y se usan solo si no hay contactos de la categoría
                    correspondiente.
                  </FieldDescription>
                )}

                {(!hasContacts || showLegacy) && (
                  <>
                    <FieldGroup className="grid gap-8 sm:grid-cols-2">
                      <Controller
                        name="contactName"
                        control={form.control}
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor="client-contact-name">
                              Nombre contacto <FieldRequiredMark />
                            </FieldLabel>
                            <Input
                              {...field}
                              id="client-contact-name"
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
                        name="contactEmail"
                        control={form.control}
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor="client-contact-email">
                              Email contacto <FieldRequiredMark />
                            </FieldLabel>
                            <Input
                              {...field}
                              id="client-contact-email"
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
                      name="contactEmail2"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor="client-contact-email-2">
                            Email adicional
                          </FieldLabel>
                          <Input
                            {...field}
                            id="client-contact-email-2"
                            type="text"
                            inputMode="email"
                            aria-invalid={fieldState.invalid}
                            placeholder="opcional (separe con , o ;)"
                            autoComplete="off"
                          />
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                  </>
                )}
              </section>

              <section className="space-y-5">
                <FieldSectionTitle>Notificaciones</FieldSectionTitle>
                <Controller
                  name="notificationsEnabled"
                  control={form.control}
                  render={({ field }) => (
                    <Field
                      orientation="horizontal"
                      className="justify-between rounded-lg border p-3"
                    >
                      <div className="space-y-1">
                        <FieldLabel htmlFor="client-notifications-enabled">
                          Notificaciones por email
                        </FieldLabel>
                        <FieldDescription>
                          Enviar correos de notificación de embarques a este
                          cliente.
                        </FieldDescription>
                      </div>
                      <Switch
                        id="client-notifications-enabled"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </Field>
                  )}
                />
              </section>
            </form>
          </TabsContent>

          <TabsContent value="contactos" className="mt-4">
            {isEditing && editing ? (
              <ClientContactsSection clientId={editing.id} />
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Guarda el cliente primero para poder agregar contactos.
              </p>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={close}>
            {tab === "contactos" ? "Cerrar" : "Cancelar"}
          </Button>
          {tab === "datos" && (
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
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
