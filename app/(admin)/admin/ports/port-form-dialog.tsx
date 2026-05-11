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
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCountries } from "@/lib/hooks/use-countries";
import {
  useCreatePort,
  useUpdatePort,
} from "@/lib/hooks/use-ports";
import type { PortPayload } from "@/lib/api/ports";
import { explainSequelizeError } from "@/lib/utils/errors";
import type { Port } from "@/types/domain";

const schema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  countryId: z
    .string()
    .min(1, "Debe seleccionar un país"),
  description: z.string().optional().or(z.literal("")),
  isOrigin: z.boolean(),
  isDestination: z.boolean(),
  active: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

const empty: FormValues = {
  name: "",
  countryId: "",
  description: "",
  isOrigin: true,
  isDestination: true,
  active: true,
};

const FORM_ID = "port-form";

export function PortFormDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Port | null;
}) {
  const isEditing = editing !== null;
  const { data: countries = [], isLoading: countriesLoading } = useCountries();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: empty,
    mode: "onBlur",
  });
  const createMutation = useCreatePort();
  const updateMutation = useUpdatePort();

  useEffect(() => {
    if (open) {
      form.reset(
        editing
          ? {
              name: editing.name ?? "",
              countryId: editing.countryId ? String(editing.countryId) : "",
              description: editing.description ?? "",
              isOrigin: editing.isOrigin ?? true,
              isDestination: editing.isDestination ?? true,
              active: editing.active ?? true,
            }
          : empty
      );
    }
  }, [open, editing, form]);

  const onSubmit = async (values: FormValues) => {
    const payload: PortPayload = {
      name: values.name,
      countryId: values.countryId ? Number(values.countryId) : null,
      description: values.description || null,
      isOrigin: values.isOrigin,
      isDestination: values.isDestination,
      active: values.active,
    };
    try {
      if (isEditing && editing) {
        await updateMutation.mutateAsync({ id: editing.id, payload });
        toast.success("Puerto actualizado");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Puerto creado");
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar puerto" : "Crear puerto"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifica los datos del puerto."
              : "Registra un nuevo puerto."}
          </DialogDescription>
        </DialogHeader>

        <form
          id={FORM_ID}
          onSubmit={form.handleSubmit(onSubmit)}
          noValidate
        >
          <FieldGroup>
            <div className="grid gap-6 sm:grid-cols-2">
              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="port-name">
                      Nombre <FieldRequiredMark />
                    </FieldLabel>
                    <Input
                      {...field}
                      id="port-name"
                      aria-invalid={fieldState.invalid}
                      placeholder="Ej. San Antonio"
                      autoComplete="off"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="countryId"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="port-country">
                      País <FieldRequiredMark />
                    </FieldLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={countriesLoading}
                    >
                      <SelectTrigger
                        id="port-country"
                        aria-invalid={fieldState.invalid}
                        className="w-full"
                      >
                        <SelectValue
                          placeholder={
                            countriesLoading ? "Cargando…" : "Selecciona un país"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {c.name} ({c.isoCode})
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
              name="description"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="port-description">
                    Descripción
                  </FieldLabel>
                  <Textarea
                    {...field}
                    id="port-description"
                    rows={2}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-3">
              <Controller
                name="isOrigin"
                control={form.control}
                render={({ field }) => (
                  <Field orientation="horizontal" className="justify-start">
                    <Checkbox
                      id="port-is-origin"
                      checked={field.value}
                      onCheckedChange={(v) => field.onChange(v === true)}
                    />
                    <FieldLabel
                      htmlFor="port-is-origin"
                      className="font-normal"
                    >
                      Puerto de origen
                    </FieldLabel>
                  </Field>
                )}
              />
              <Controller
                name="isDestination"
                control={form.control}
                render={({ field }) => (
                  <Field orientation="horizontal" className="justify-start">
                    <Checkbox
                      id="port-is-destination"
                      checked={field.value}
                      onCheckedChange={(v) => field.onChange(v === true)}
                    />
                    <FieldLabel
                      htmlFor="port-is-destination"
                      className="font-normal"
                    >
                      Puerto de destino
                    </FieldLabel>
                  </Field>
                )}
              />
              <Controller
                name="active"
                control={form.control}
                render={({ field }) => (
                  <Field orientation="horizontal" className="justify-start">
                    <Checkbox
                      id="port-active"
                      checked={field.value}
                      onCheckedChange={(v) => field.onChange(v === true)}
                    />
                    <FieldLabel
                      htmlFor="port-active"
                      className="font-normal"
                    >
                      Activo
                    </FieldLabel>
                  </Field>
                )}
              />
            </div>
          </FieldGroup>
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
