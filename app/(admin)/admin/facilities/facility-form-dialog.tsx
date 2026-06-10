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
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldRequiredMark,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  useCreateFacility,
  useUpdateFacility,
} from "@/lib/hooks/use-facilities";
import type { FacilityPayload } from "@/lib/api/facilities";
import { explainSequelizeError } from "@/lib/utils/errors";
import type { Facility, FacilityType } from "@/types/domain";

const FACILITY_TYPES: FacilityType[] = ["TERMINAL", "DEPOT"];

const FACILITY_TYPE_LABELS: Record<FacilityType, string> = {
  TERMINAL: "Terminal",
  DEPOT: "Depósito",
};

const schema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  type: z.enum(FACILITY_TYPES as [FacilityType, ...FacilityType[]]),
  city: z.string().optional().or(z.literal("")),
  region: z.string().optional().or(z.literal("")),
  active: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

const empty: FormValues = {
  name: "",
  type: "TERMINAL",
  city: "",
  region: "",
  active: true,
};

const FORM_ID = "facility-form";

export function FacilityFormDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Facility | null;
}) {
  const isEditing = editing !== null;
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: empty,
    mode: "onBlur",
  });
  const createMutation = useCreateFacility();
  const updateMutation = useUpdateFacility();

  useEffect(() => {
    if (open) {
      form.reset(
        editing
          ? {
              name: editing.name ?? "",
              type: editing.type ?? "TERMINAL",
              city: editing.city ?? "",
              region: editing.region ?? "",
              active: editing.active ?? true,
            }
          : empty
      );
    }
  }, [open, editing, form]);

  const onSubmit = async (values: FormValues) => {
    const payload: FacilityPayload = {
      name: values.name,
      type: values.type,
      city: values.city || null,
      region: values.region || null,
      active: values.active,
    };
    try {
      if (isEditing && editing) {
        await updateMutation.mutateAsync({ id: editing.id, payload });
        toast.success("Instalación actualizada");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Instalación creada");
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
          <DialogTitle>
            {isEditing ? "Editar instalación" : "Crear instalación"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifica los datos del depósito o terminal."
              : "Registra un nuevo depósito o terminal."}
          </DialogDescription>
        </DialogHeader>

        <form id={FORM_ID} onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            <div className="grid gap-6 sm:grid-cols-2">
              <Controller
                name="name"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="facility-name">
                      Nombre <FieldRequiredMark />
                    </FieldLabel>
                    <Input
                      {...field}
                      id="facility-name"
                      aria-invalid={fieldState.invalid}
                      placeholder="Ej. STI"
                      autoComplete="off"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="type"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="facility-type">
                      Tipo <FieldRequiredMark />
                    </FieldLabel>
                    <SearchableSelect
                      id="facility-type"
                      value={field.value}
                      onValueChange={(v) => field.onChange(v as FacilityType)}
                      aria-invalid={fieldState.invalid}
                      placeholder="Selecciona…"
                      searchPlaceholder="Buscar tipo…"
                      options={FACILITY_TYPES.map((t) => ({
                        value: t,
                        label: FACILITY_TYPE_LABELS[t],
                      }))}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="city"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="facility-city">Ciudad</FieldLabel>
                    <Input
                      {...field}
                      id="facility-city"
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
                name="region"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="facility-region">Región</FieldLabel>
                    <Input
                      {...field}
                      id="facility-region"
                      aria-invalid={fieldState.invalid}
                      placeholder="Ej. Valparaíso"
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
              name="active"
              control={form.control}
              render={({ field }) => (
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(v) => field.onChange(v === true)}
                  />
                  Activo
                </label>
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

export { FACILITY_TYPE_LABELS };
