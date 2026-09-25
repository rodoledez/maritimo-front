"use client";

import { useEffect } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Plus, Trash2 } from "lucide-react";
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
  useCreateManualTracking,
  useUpdateManualTracking,
} from "@/lib/hooks/use-shipments-tracking";
import { errorMessage } from "@/lib/utils/errors";
import { assocLabel, itineraryPortDestination } from "@/lib/utils/format";
import type {
  Booking,
  ManualContainerInput,
  ShipmentTracking,
  ShipsgoContainer,
} from "@/types/domain";

import {
  UNLOCODE_RE,
  containerNumberLabel,
  normalizeContainerNumber,
} from "./_status";

const FORM_ID = "manual-tracking-form";

const portSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Ingresa el nombre del puerto")
    .max(255, "Máximo 255 caracteres"),
  code: z
    .string()
    .trim()
    .regex(UNLOCODE_RE, "UN/LOCODE inválido (p.ej. CLSAI)"),
});

const containerSchema = z.object({
  number: z
    .string()
    .trim()
    .min(1, "Ingresa el número")
    .max(20, "Máximo 20 caracteres"),
  size: z.string().regex(/^\d*$/, "Sólo números (p.ej. 20 o 40)"),
  type: z.string().trim().max(10, "Máximo 10 caracteres"),
});

function makeSchema(existingNumbers: string[]) {
  return z
    .object({
      pol: portSchema,
      pod: portSchema,
      etd: z.string(),
      eta: z.string(),
      containers: z.array(containerSchema),
    })
    .superRefine((values, ctx) => {
      if (values.etd && values.eta && values.eta < values.etd) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["eta"],
          message: "El ETA no puede ser anterior al ETD",
        });
      }
      const seen = new Set(existingNumbers);
      values.containers.forEach((c, i) => {
        const number = normalizeContainerNumber(c.number);
        if (!number) return;
        if (seen.has(number)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["containers", i, "number"],
            message: "Contenedor repetido",
          });
        }
        seen.add(number);
      });
    });
}

type FormValues = z.infer<ReturnType<typeof makeSchema>>;

const emptyContainer: FormValues["containers"][number] = {
  number: "",
  size: "",
  type: "",
};

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})/;

/** ISO → `YYYY-MM-DD` tomando los dígitos tal cual (sin corrimiento de zona). */
function toDateInput(value: string | null | undefined): string {
  if (!value) return "";
  const m = DATE_RE.exec(value);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : "";
}

/** `YYYY-MM-DD` → ISO a medianoche UTC, igual que `formatDate` lo muestra. */
function fromDateInput(value: string): string | undefined {
  return value ? `${value}T00:00:00.000Z` : undefined;
}

function toContainerPayload(
  c: FormValues["containers"][number]
): ManualContainerInput {
  return {
    number: normalizeContainerNumber(c.number),
    size: c.size ? Number(c.size) : null,
    type: c.type.trim() ? c.type.trim().toUpperCase() : null,
  };
}

function defaultsFor(
  booking: Booking | null | undefined,
  tracking: ShipmentTracking | null | undefined
): FormValues {
  if (tracking) {
    return {
      pol: {
        name: tracking.portOfLoading ?? "",
        code: tracking.polCode ?? "",
      },
      pod: {
        name: tracking.portOfDischarge ?? "",
        code: tracking.podCode ?? "",
      },
      etd: toDateInput(tracking.dateOfLoadingInitial ?? tracking.etd),
      eta: toDateInput(tracking.dateOfDischargeInitial ?? tracking.eta),
      containers: [],
    };
  }
  // El catálogo de puertos no tiene UN/LOCODE: sólo se precarga el nombre.
  const it = booking?.Itinerary;
  return {
    pol: { name: assocLabel(it?.portDeparture), code: "" },
    pod: { name: itineraryPortDestination(it), code: "" },
    etd: toDateInput(it?.etd),
    eta: toDateInput(it?.eta),
    containers: [],
  };
}

/**
 * Crea (`POST /shipments-tracking/manual`) o edita (`PATCH /:id/manual`) un
 * seguimiento manual. Al editar, los contenedores de la lista se AGREGAN a los
 * existentes; quitar uno se hace desde la tarjeta del contenedor.
 */
export function ManualTrackingFormDialog({
  open,
  onOpenChange,
  booking,
  tracking,
  existingContainers = [],
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Reserva para la que se crea el seguimiento (modo creación). */
  booking?: Booking | null;
  /** Tracking manual a editar (modo edición). */
  tracking?: ShipmentTracking | null;
  existingContainers?: ShipsgoContainer[];
}) {
  const isEdit = !!tracking;
  const createMutation = useCreateManualTracking();
  const updateMutation = useUpdateManualTracking();
  const existingNumbers = existingContainers.map((c) => c.number);

  const form = useForm<FormValues>({
    resolver: zodResolver(makeSchema(existingNumbers)),
    defaultValues: defaultsFor(booking, tracking),
    mode: "onBlur",
  });
  const containers = useFieldArray({ control: form.control, name: "containers" });

  useEffect(() => {
    if (open) form.reset(defaultsFor(booking, tracking));
  }, [open, booking, tracking, form]);

  const onSubmit = async (values: FormValues) => {
    const port = (p: FormValues["pol"]) => ({
      name: p.name.trim(),
      code: p.code.trim().toUpperCase(),
    });
    const newContainers = values.containers.map(toContainerPayload);
    try {
      if (tracking) {
        await updateMutation.mutateAsync({
          shipmentId: tracking.id,
          payload: {
            portOfLoading: port(values.pol),
            portOfDischarge: port(values.pod),
            etd: fromDateInput(values.etd),
            eta: fromDateInput(values.eta),
            containers: newContainers.length ? newContainers : undefined,
          },
        });
        toast.success("Seguimiento manual actualizado");
      } else {
        if (!booking) return;
        await createMutation.mutateAsync({
          bookingId: Number(booking.id),
          portOfLoading: port(values.pol),
          portOfDischarge: port(values.pod),
          etd: fromDateInput(values.etd),
          eta: fromDateInput(values.eta),
          containers: newContainers.length ? newContainers : undefined,
        });
        toast.success(`Seguimiento manual creado para la reserva #${booking.id}`);
      }
      onOpenChange(false);
    } catch (e) {
      toast.error(
        errorMessage(
          e,
          isEdit
            ? "No se pudo actualizar el seguimiento"
            : "No se pudo crear el seguimiento"
        )
      );
    }
  };

  const isSubmitting = form.formState.isSubmitting;

  const portFields = (prefix: "pol" | "pod", label: string) => (
    <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
      <Controller
        name={`${prefix}.name`}
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={`manual-${prefix}-name`}>
              {label} <FieldRequiredMark />
            </FieldLabel>
            <Input
              {...field}
              id={`manual-${prefix}-name`}
              aria-invalid={fieldState.invalid}
              placeholder="San Antonio"
              autoComplete="off"
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <Controller
        name={`${prefix}.code`}
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={`manual-${prefix}-code`}>
              UN/LOCODE <FieldRequiredMark />
            </FieldLabel>
            <Input
              {...field}
              onChange={(e) => field.onChange(e.target.value.toUpperCase())}
              id={`manual-${prefix}-code`}
              aria-invalid={fieldState.invalid}
              placeholder="CLSAI"
              maxLength={5}
              autoComplete="off"
              className="font-mono uppercase"
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit
              ? "Editar seguimiento manual"
              : `Crear seguimiento manual${booking ? ` · Reserva #${booking.id}` : ""}`}
          </DialogTitle>
          <DialogDescription>
            La naviera de esta reserva no se integra con ShipsGo. Los puertos y
            las fechas planificadas son la base del seguimiento; el estado y el
            ETD/ETA actuales se calculan a partir de los movimientos.
          </DialogDescription>
        </DialogHeader>

        <form id={FORM_ID} onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            <FieldSectionTitle>Ruta</FieldSectionTitle>
            {portFields("pol", "Puerto de zarpe (POL)")}
            {portFields("pod", "Puerto de destino (POD)")}
            <FieldDescription>
              El UN/LOCODE son 5 caracteres: país + ubicación (p.ej. CLSAI,
              CLVAP, NLRTM).
            </FieldDescription>

            <FieldSectionTitle>Fechas planificadas</FieldSectionTitle>
            <div className="grid gap-4 sm:grid-cols-2">
              <Controller
                name="etd"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="manual-etd">ETD planificado</FieldLabel>
                    <Input
                      {...field}
                      id="manual-etd"
                      type="date"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="eta"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="manual-eta">ETA planificado</FieldLabel>
                    <Input
                      {...field}
                      id="manual-eta"
                      type="date"
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldDescription>
                      Base para medir el atraso del embarque.
                    </FieldDescription>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </div>

            <FieldSectionTitle>
              {isEdit ? "Agregar contenedores" : "Contenedores"}
            </FieldSectionTitle>
            {isEdit && existingContainers.length ? (
              <p className="text-xs text-muted-foreground">
                Actuales:{" "}
                <span className="font-mono text-foreground">
                  {existingContainers
                    .map((c) => containerNumberLabel(c.number))
                    .join(", ")}
                </span>
                . Para quitar uno, usa &quot;Eliminar&quot; en su tarjeta.
              </p>
            ) : null}
            {containers.fields.map((item, index) => (
              <div
                key={item.id}
                className="grid items-start gap-3 sm:grid-cols-[1fr_90px_90px_auto]"
              >
                <Controller
                  name={`containers.${index}.number`}
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={`manual-container-${index}`}>
                        Número <FieldRequiredMark />
                      </FieldLabel>
                      <Input
                        {...field}
                        onChange={(e) =>
                          field.onChange(e.target.value.toUpperCase())
                        }
                        id={`manual-container-${index}`}
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
                <Controller
                  name={`containers.${index}.size`}
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={`manual-container-size-${index}`}>
                        Tamaño
                      </FieldLabel>
                      <Input
                        {...field}
                        id={`manual-container-size-${index}`}
                        aria-invalid={fieldState.invalid}
                        inputMode="numeric"
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
                  name={`containers.${index}.type`}
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={`manual-container-type-${index}`}>
                        Tipo
                      </FieldLabel>
                      <Input
                        {...field}
                        onChange={(e) =>
                          field.onChange(e.target.value.toUpperCase())
                        }
                        id={`manual-container-type-${index}`}
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
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="mt-6"
                  onClick={() => containers.remove(index)}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Quitar contenedor</span>
                </Button>
              </div>
            ))}
            <div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => containers.append(emptyContainer)}
              >
                <Plus className="h-4 w-4" />
                Agregar contenedor
              </Button>
            </div>
            {!isEdit ? (
              <FieldDescription>
                Opcional. Si no hay contenedores, el primer movimiento crea uno
                &quot;Sin asignar&quot; al que luego se le asigna número.
              </FieldDescription>
            ) : null}
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
            ) : isEdit ? (
              "Guardar"
            ) : (
              "Crear seguimiento"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
