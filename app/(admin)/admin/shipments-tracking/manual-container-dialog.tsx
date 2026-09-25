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
import { useUpdateManualContainer } from "@/lib/hooks/use-shipments-tracking";
import { errorMessage } from "@/lib/utils/errors";
import type {
  ManualContainerUpdatePayload,
  ShipmentTracking,
  ShipsgoContainer,
} from "@/types/domain";

import { NOT_ASSIGNED_CONTAINER, normalizeContainerNumber } from "./_status";

const FORM_ID = "manual-container-form";

const schema = z.object({
  number: z
    .string()
    .trim()
    .min(1, "Ingresa el número")
    .max(20, "Máximo 20 caracteres")
    .refine(
      (v) => normalizeContainerNumber(v) !== NOT_ASSIGNED_CONTAINER,
      "Ingresa el número real del contenedor"
    ),
  size: z.string().regex(/^\d*$/, "Sólo números (p.ej. 20 o 40)"),
  type: z.string().trim().max(10, "Máximo 10 caracteres"),
});

type FormValues = z.infer<typeof schema>;

function defaultsFor(container: ShipsgoContainer | null): FormValues {
  if (!container) return { number: "", size: "", type: "" };
  return {
    number:
      container.number === NOT_ASSIGNED_CONTAINER ? "" : container.number,
    size: container.size ? String(container.size) : "",
    type: container.type ?? "",
  };
}

/**
 * Asigna número a un contenedor `NOT_ASSIGNED` o corrige número/tamaño/tipo
 * (`PATCH /:id/containers/:number`). Los movimientos se conservan.
 */
export function ManualContainerDialog({
  open,
  onOpenChange,
  tracking,
  container,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tracking: ShipmentTracking;
  container: ShipsgoContainer | null;
}) {
  const isAssign = container?.number === NOT_ASSIGNED_CONTAINER;
  const updateMutation = useUpdateManualContainer();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaultsFor(container),
    mode: "onBlur",
  });

  useEffect(() => {
    if (open) form.reset(defaultsFor(container));
  }, [open, container, form]);

  const onSubmit = async (values: FormValues) => {
    if (!container) return;
    const number = normalizeContainerNumber(values.number);
    const size = values.size ? Number(values.size) : null;
    const type = values.type.trim() ? values.type.trim().toUpperCase() : null;
    // Sólo se envía lo que cambió.
    const payload: ManualContainerUpdatePayload = {};
    if (number !== container.number) payload.number = number;
    if (size !== (container.size ?? null)) payload.size = size;
    if (type !== (container.type ?? null)) payload.type = type;
    if (!Object.keys(payload).length) {
      onOpenChange(false);
      return;
    }
    try {
      await updateMutation.mutateAsync({
        shipmentId: tracking.id,
        containerNumber: container.number,
        payload,
      });
      toast.success(
        isAssign ? `Número ${number} asignado` : "Contenedor actualizado"
      );
      onOpenChange(false);
    } catch (e) {
      toast.error(errorMessage(e, "No se pudo actualizar el contenedor"));
    }
  };

  const isSubmitting = form.formState.isSubmitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isAssign ? "Asignar número" : "Editar contenedor"}
          </DialogTitle>
          <DialogDescription>
            Los movimientos registrados en el contenedor se conservan.
          </DialogDescription>
        </DialogHeader>

        <form id={FORM_ID} onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            <Controller
              name="number"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="container-number">
                    Número <FieldRequiredMark />
                  </FieldLabel>
                  <Input
                    {...field}
                    onChange={(e) =>
                      field.onChange(e.target.value.toUpperCase())
                    }
                    id="container-number"
                    aria-invalid={fieldState.invalid}
                    placeholder="MSCU1234567"
                    maxLength={20}
                    autoComplete="off"
                    className="font-mono uppercase"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Controller
                name="size"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="container-size">Tamaño</FieldLabel>
                    <Input
                      {...field}
                      id="container-size"
                      inputMode="numeric"
                      aria-invalid={fieldState.invalid}
                      placeholder="40"
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
                    <FieldLabel htmlFor="container-type">Tipo</FieldLabel>
                    <Input
                      {...field}
                      onChange={(e) =>
                        field.onChange(e.target.value.toUpperCase())
                      }
                      id="container-type"
                      aria-invalid={fieldState.invalid}
                      placeholder="RF"
                      autoComplete="off"
                      className="uppercase"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
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
            Cancelar
          </Button>
          <Button type="submit" form={FORM_ID} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Guardando…
              </>
            ) : (
              "Guardar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
