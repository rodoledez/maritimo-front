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
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldRequiredMark,
  FieldSectionTitle,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  useCreateShippingCompany,
  useUpdateShippingCompany,
} from "@/lib/hooks/use-shipping-companies";
import type { ShippingCompanyPayload } from "@/lib/api/shipping-companies";
import { explainSequelizeError } from "@/lib/utils/errors";
import type { ShippingCompany } from "@/types/domain";

const schema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z
    .string()
    .email("Email inválido")
    .optional()
    .or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  website: z.string().optional().or(z.literal("")),
  contactPerson: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  active: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

const empty: FormValues = {
  name: "",
  email: "",
  phone: "",
  website: "",
  contactPerson: "",
  address: "",
  description: "",
  active: true,
};

const FORM_ID = "shipping-company-form";

export function ShippingCompanyFormDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: ShippingCompany | null;
}) {
  const isEditing = editing !== null;
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: empty,
    mode: "onBlur",
  });
  const createMutation = useCreateShippingCompany();
  const updateMutation = useUpdateShippingCompany();

  useEffect(() => {
    if (open) {
      form.reset(
        editing
          ? {
              name: editing.name ?? "",
              email: editing.email ?? "",
              phone: editing.phone ?? "",
              website: editing.website ?? "",
              contactPerson: editing.contactPerson ?? "",
              address: editing.address ?? "",
              description: editing.description ?? "",
              active: editing.active ?? true,
            }
          : empty
      );
    }
  }, [open, editing, form]);

  const onSubmit = async (values: FormValues) => {
    const payload: ShippingCompanyPayload = {
      name: values.name,
      email: values.email || null,
      phone: values.phone || null,
      website: values.website || null,
      contactPerson: values.contactPerson || null,
      address: values.address || null,
      description: values.description || null,
      active: values.active,
    };
    try {
      if (isEditing && editing) {
        await updateMutation.mutateAsync({ id: editing.id, payload });
        toast.success("Naviera actualizada");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Naviera creada");
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(
        explainSequelizeError(
          error,
          isEditing ? "No se pudo actualizar" : "No se pudo crear"
        )
      );
    }
  };

  const isSubmitting = form.formState.isSubmitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar naviera" : "Crear naviera"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifica los datos de la naviera."
              : "Registra una nueva naviera (shipping company)."}
          </DialogDescription>
        </DialogHeader>

        <form
          id={FORM_ID}
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-8"
          noValidate
        >
          <section className="space-y-5">
            <FieldSectionTitle>Datos de la naviera</FieldSectionTitle>
            <FieldGroup>
              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="naviera-name">
                      Nombre <FieldRequiredMark />
                    </FieldLabel>
                    <Input
                      {...field}
                      id="naviera-name"
                      aria-invalid={fieldState.invalid}
                      placeholder="Ej. Maersk"
                      autoComplete="off"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <div className="grid gap-6 sm:grid-cols-2">
                <Controller
                  name="website"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="naviera-website">Sitio web</FieldLabel>
                      <Input
                        {...field}
                        id="naviera-website"
                        aria-invalid={fieldState.invalid}
                        placeholder="https://…"
                        autoComplete="off"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  name="active"
                  control={form.control}
                  render={({ field }) => (
                    <Field orientation="horizontal" className="justify-start self-end pb-2">
                      <Checkbox
                        id="naviera-active"
                        checked={field.value}
                        onCheckedChange={(v) => field.onChange(v === true)}
                      />
                      <FieldLabel
                        htmlFor="naviera-active"
                        className="font-normal"
                      >
                        Activa
                      </FieldLabel>
                    </Field>
                  )}
                />
              </div>
            </FieldGroup>
          </section>

          <section className="space-y-5">
            <FieldSectionTitle>Contacto</FieldSectionTitle>
            <FieldGroup>
              <div className="grid gap-6 sm:grid-cols-2">
                <Controller
                  name="email"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="naviera-email">Email</FieldLabel>
                      <Input
                        {...field}
                        id="naviera-email"
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
                <Controller
                  name="phone"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="naviera-phone">Teléfono</FieldLabel>
                      <Input
                        {...field}
                        id="naviera-phone"
                        aria-invalid={fieldState.invalid}
                        placeholder="+56…"
                        autoComplete="off"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </div>
              <Controller
                name="contactPerson"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="naviera-contact-person">
                      Persona de contacto
                    </FieldLabel>
                    <Input
                      {...field}
                      id="naviera-contact-person"
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
                name="address"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="naviera-address">Dirección</FieldLabel>
                    <Textarea
                      {...field}
                      id="naviera-address"
                      rows={2}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="description"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="naviera-description">
                      Descripción
                    </FieldLabel>
                    <Textarea
                      {...field}
                      id="naviera-description"
                      rows={2}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
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
