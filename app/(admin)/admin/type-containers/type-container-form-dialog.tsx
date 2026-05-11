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
  useCreateTypeContainer,
  useUpdateTypeContainer,
} from "@/lib/hooks/use-type-containers";
import type { TypeContainerPayload } from "@/lib/api/type-containers";
import { explainSequelizeError } from "@/lib/utils/errors";
import type { TypeContainer } from "@/types/domain";

const schema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  description: z.string().optional().or(z.literal("")),
  active: z.boolean(),
});

type FormValues = z.infer<typeof schema>;
const empty: FormValues = { name: "", description: "", active: true };
const FORM_ID = "type-container-form";

export function TypeContainerFormDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: TypeContainer | null;
}) {
  const isEditing = editing !== null;
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: empty,
    mode: "onBlur",
  });
  const createMutation = useCreateTypeContainer();
  const updateMutation = useUpdateTypeContainer();

  useEffect(() => {
    if (open) {
      form.reset(
        editing
          ? {
              name: editing.name ?? "",
              description: editing.description ?? "",
              active: editing.active ?? true,
            }
          : empty
      );
    }
  }, [open, editing, form]);

  const onSubmit = async (values: FormValues) => {
    const payload: TypeContainerPayload = {
      name: values.name,
      description: values.description || null,
      active: values.active,
    };
    try {
      if (isEditing && editing) {
        await updateMutation.mutateAsync({ id: editing.id, payload });
        toast.success("Tipo de contenedor actualizado");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Tipo de contenedor creado");
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(
        explainSequelizeError(
          error,
          isEditing
            ? "No se pudo actualizar el tipo"
            : "No se pudo crear el tipo"
        )
      );
    }
  };

  const isSubmitting = form.formState.isSubmitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar tipo de contenedor" : "Crear tipo de contenedor"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifica los datos del tipo de contenedor."
              : "Registra un nuevo tipo de contenedor."}
          </DialogDescription>
        </DialogHeader>

        <form
          id={FORM_ID}
          onSubmit={form.handleSubmit(onSubmit)}
          noValidate
        >
          <FieldGroup>
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="type-container-name">
                    Nombre <FieldRequiredMark />
                  </FieldLabel>
                  <Input
                    {...field}
                    id="type-container-name"
                    aria-invalid={fieldState.invalid}
                    placeholder="Ej. 40 Pies High Cube Reefer"
                    autoComplete="off"
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
                  <FieldLabel htmlFor="type-container-description">
                    Descripción
                  </FieldLabel>
                  <Textarea
                    {...field}
                    id="type-container-description"
                    rows={3}
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
                <Field orientation="horizontal" className="justify-start">
                  <Checkbox
                    id="type-container-active"
                    checked={field.value}
                    onCheckedChange={(v) => field.onChange(v === true)}
                  />
                  <FieldLabel
                    htmlFor="type-container-active"
                    className="font-normal"
                  >
                    Activo
                  </FieldLabel>
                </Field>
              )}
            />
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
