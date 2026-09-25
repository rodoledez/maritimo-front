"use client";

import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCreateManualMovement,
  useUpdateManualMovement,
} from "@/lib/hooks/use-shipments-tracking";
import { errorMessage } from "@/lib/utils/errors";
import type {
  ManualMovementPayload,
  ShipmentTracking,
  ShipsgoContainer,
  ShipsgoMovement,
  ShipsgoMovementEvent,
} from "@/types/domain";

import {
  EVENTS_REQUIRING_LOCODE,
  MOVEMENT_EVENTS,
  MOVEMENT_EVENT_LABEL,
  UNLOCODE_RE,
  containerNumberLabel,
} from "./_status";

const FORM_ID = "manual-movement-form";

/** Tolerancia del backend para un movimiento `ACT` con fecha "futura". */
const FUTURE_TOLERANCE_MS = 10 * 60 * 1000;

const schema = z
  .object({
    event: z.enum(MOVEMENT_EVENTS as [ShipsgoMovementEvent, ...ShipsgoMovementEvent[]], {
      errorMap: () => ({ message: "Selecciona un evento" }),
    }),
    status: z.enum(["ACT", "EST"]),
    timestamp: z.string().min(1, "Ingresa la fecha y hora"),
    locationName: z
      .string()
      .trim()
      .min(1, "Ingresa el puerto o lugar")
      .max(255, "Máximo 255 caracteres"),
    locationCode: z.string().trim(),
    vesselName: z.string().trim().max(255, "Máximo 255 caracteres"),
    vesselImo: z.string().trim().regex(/^\d*$/, "Sólo números"),
    voyage: z.string().trim().max(50, "Máximo 50 caracteres"),
    containerNumbers: z.array(z.string()),
  })
  .superRefine((v, ctx) => {
    if (v.locationCode && !UNLOCODE_RE.test(v.locationCode)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["locationCode"],
        message: "UN/LOCODE inválido (p.ej. CLSAI)",
      });
    } else if (!v.locationCode && EVENTS_REQUIRING_LOCODE.includes(v.event)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["locationCode"],
        message: `Obligatorio para ${MOVEMENT_EVENT_LABEL[v.event]}`,
      });
    }
    if (v.timestamp) {
      const date = new Date(v.timestamp);
      if (Number.isNaN(date.getTime())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["timestamp"],
          message: "Fecha inválida",
        });
      } else if (
        v.status === "ACT" &&
        date.getTime() > Date.now() + FUTURE_TOLERANCE_MS
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["timestamp"],
          message:
            "Un movimiento real no puede tener fecha futura. Usa \"Estimado\".",
        });
      }
    }
    if (v.vesselImo && !v.vesselName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["vesselName"],
        message: "Ingresa la nave del IMO",
      });
    }
  });

type FormValues = z.infer<typeof schema>;

/** ISO → valor de `<input type="datetime-local">` en la hora local del navegador. */
function toDatetimeLocal(value: string | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export type MovementDialogTarget =
  | {
      mode: "create";
      /** Contenedor desde el que se abrió; `null` = nivel embarque. */
      containerNumber: string | null;
    }
  | {
      mode: "edit";
      movement: ShipsgoMovement & { id: string };
      containerNumber: string;
    };

function defaultsFor(target: MovementDialogTarget | null): FormValues {
  if (target?.mode === "edit") {
    const m = target.movement;
    return {
      event: m.event,
      status: m.status,
      timestamp: toDatetimeLocal(m.timestamp),
      locationName: m.location?.name ?? "",
      locationCode: m.location?.code ?? "",
      vesselName: m.vessel?.name ?? "",
      vesselImo: m.vessel?.imo ? String(m.vessel.imo) : "",
      voyage: m.voyage ?? "",
      containerNumbers: [target.containerNumber],
    };
  }
  return {
    event: undefined as unknown as ShipsgoMovementEvent,
    status: "ACT",
    timestamp: "",
    locationName: "",
    locationCode: "",
    vesselName: "",
    vesselImo: "",
    voyage: "",
    containerNumbers: target?.containerNumber ? [target.containerNumber] : [],
  };
}

/**
 * Registra (`POST /:id/movements`) o corrige (`PATCH /:id/movements/:movementId`)
 * un movimiento de un tracking manual. El status del embarque y de cada
 * contenedor, el ETD/ETA actuales y los transbordos los recalcula el backend.
 */
export function ManualMovementFormDialog({
  open,
  onOpenChange,
  tracking,
  containers,
  target,
  fallbackVessel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tracking: ShipmentTracking;
  containers: ShipsgoContainer[];
  target: MovementDialogTarget | null;
  /** Nave/viaje del itinerario, si el tracking todavía no tiene los suyos. */
  fallbackVessel?: { name?: string | null; voyage?: string | null } | null;
}) {
  const isEdit = target?.mode === "edit";
  const createMutation = useCreateManualMovement();
  const updateMutation = useUpdateManualMovement();
  const [pending, setPending] = useState<FormValues | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaultsFor(target),
    mode: "onBlur",
  });

  useEffect(() => {
    if (open) form.reset(defaultsFor(target));
  }, [open, target, form]);

  // Precarga según el evento, sólo en campos que el usuario no tocó: así un
  // arribo a destino no se clasifica como transbordo por un código mal tipeado.
  const onEventChange = (event: ShipsgoMovementEvent) => {
    if (isEdit) return;
    const untouched = (name: keyof FormValues) =>
      !form.getFieldState(name).isDirty;
    const port =
      event === "DEPA"
        ? { name: tracking.portOfLoading, code: tracking.polCode }
        : event === "ARRV" || event === "DISC"
          ? { name: tracking.portOfDischarge, code: tracking.podCode }
          : null;
    if (port) {
      if (untouched("locationName"))
        form.setValue("locationName", port.name ?? "");
      if (untouched("locationCode"))
        form.setValue("locationCode", port.code ?? "");
    }
    if (event === "DEPA" || event === "LOAD") {
      const vesselName = tracking.currentVessel ?? fallbackVessel?.name ?? "";
      const voyage = tracking.currentVoyage ?? fallbackVessel?.voyage ?? "";
      if (untouched("vesselName")) form.setValue("vesselName", vesselName);
      if (untouched("vesselImo"))
        form.setValue(
          "vesselImo",
          tracking.currentVessel && tracking.currentVesselImo
            ? String(tracking.currentVesselImo)
            : ""
        );
      if (untouched("voyage")) form.setValue("voyage", voyage);
    }
  };

  const save = async (values: FormValues) => {
    const payload: Omit<ManualMovementPayload, "containerNumbers"> = {
      event: values.event,
      status: values.status,
      timestamp: new Date(values.timestamp).toISOString(),
      location: {
        name: values.locationName.trim(),
        code: values.locationCode.trim().toUpperCase() || undefined,
      },
      vessel: values.vesselName.trim()
        ? {
            name: values.vesselName.trim(),
            imo: values.vesselImo ? Number(values.vesselImo) : null,
          }
        : undefined,
      voyage: values.voyage.trim() || undefined,
    };
    try {
      if (target?.mode === "edit") {
        await updateMutation.mutateAsync({
          shipmentId: tracking.id,
          movementId: target.movement.id,
          payload,
        });
        toast.success("Movimiento actualizado");
      } else {
        await createMutation.mutateAsync({
          shipmentId: tracking.id,
          payload: {
            ...payload,
            containerNumbers: values.containerNumbers.length
              ? values.containerNumbers
              : undefined,
          },
        });
        toast.success("Movimiento registrado");
      }
      onOpenChange(false);
    } catch (e) {
      toast.error(
        errorMessage(
          e,
          isEdit
            ? "No se pudo actualizar el movimiento"
            : "No se pudo registrar el movimiento"
        )
      );
    }
  };

  // Un movimiento real registra el hito y puede notificar al cliente: se
  // confirma antes de guardarlo.
  const onSubmit = async (values: FormValues) => {
    if (values.status === "ACT") {
      setPending(values);
      return;
    }
    await save(values);
  };

  const onConfirm = async () => {
    const values = pending;
    setPending(null);
    if (values) await save(values);
  };

  const isSubmitting =
    form.formState.isSubmitting ||
    createMutation.isPending ||
    updateMutation.isPending;
  const event = useWatch({ control: form.control, name: "event" });
  const codeRequired = !!event && EVENTS_REQUIRING_LOCODE.includes(event);
  const assignable = containers.map((c) => c.number);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEdit ? "Editar movimiento" : "Registrar movimiento"}
              {target?.containerNumber
                ? ` · ${containerNumberLabel(target.containerNumber)}`
                : ""}
            </DialogTitle>
            <DialogDescription>
              {isEdit
                ? "El cambio afecta sólo a este contenedor: si el movimiento se registró para todo el embarque, las copias de los otros contenedores no cambian."
                : "El estado del embarque, el ETD/ETA actuales y los transbordos se recalculan a partir de los movimientos."}
            </DialogDescription>
          </DialogHeader>

          <form id={FORM_ID} onSubmit={form.handleSubmit(onSubmit)} noValidate>
            <FieldGroup>
              <div className="grid gap-4 sm:grid-cols-2">
                <Controller
                  name="event"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="movement-event">
                        Evento <FieldRequiredMark />
                      </FieldLabel>
                      <Select
                        value={field.value ?? ""}
                        onValueChange={(v) => {
                          field.onChange(v);
                          onEventChange(v as ShipsgoMovementEvent);
                        }}
                      >
                        <SelectTrigger
                          id="movement-event"
                          className="w-full"
                          aria-invalid={fieldState.invalid}
                        >
                          <SelectValue placeholder="Selecciona un evento" />
                        </SelectTrigger>
                        <SelectContent>
                          {MOVEMENT_EVENTS.map((e) => (
                            <SelectItem key={e} value={e}>
                              {MOVEMENT_EVENT_LABEL[e]}
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
                  name="status"
                  control={form.control}
                  render={({ field }) => (
                    <Field>
                      <FieldLabel htmlFor="movement-status">Tipo</FieldLabel>
                      <Select
                        value={field.value}
                        onValueChange={(v) => {
                          field.onChange(v);
                          // Revalida la fecha: pasar a Estimado permite fechas futuras.
                          if (form.getValues("timestamp"))
                            void form.trigger("timestamp");
                        }}
                      >
                        <SelectTrigger id="movement-status" className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ACT">Real (ya ocurrió)</SelectItem>
                          <SelectItem value="EST">Estimado</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  )}
                />
              </div>

              <Controller
                name="timestamp"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="movement-timestamp">
                      Fecha y hora <FieldRequiredMark />
                    </FieldLabel>
                    <Input
                      {...field}
                      id="movement-timestamp"
                      type="datetime-local"
                      step={60}
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldDescription>En tu hora local.</FieldDescription>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
                <Controller
                  name="locationName"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="movement-location">
                        Puerto o lugar <FieldRequiredMark />
                      </FieldLabel>
                      <Input
                        {...field}
                        id="movement-location"
                        aria-invalid={fieldState.invalid}
                        placeholder="San Antonio"
                        autoComplete="off"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  name="locationCode"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="movement-location-code">
                        UN/LOCODE {codeRequired ? <FieldRequiredMark /> : null}
                      </FieldLabel>
                      <Input
                        {...field}
                        onChange={(e) =>
                          field.onChange(e.target.value.toUpperCase())
                        }
                        id="movement-location-code"
                        aria-invalid={fieldState.invalid}
                        placeholder="CLSAI"
                        maxLength={5}
                        autoComplete="off"
                        className="font-mono uppercase"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </div>
              {codeRequired ? (
                <FieldDescription>
                  El código se compara con el POL ({tracking.polCode ?? "—"}) y
                  el POD ({tracking.podCode ?? "—"}) para distinguir zarpe de
                  origen, transbordo y arribo a destino.
                </FieldDescription>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-[1fr_120px_120px]">
                <Controller
                  name="vesselName"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="movement-vessel">Nave</FieldLabel>
                      <Input
                        {...field}
                        id="movement-vessel"
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
                  name="vesselImo"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="movement-imo">IMO</FieldLabel>
                      <Input
                        {...field}
                        id="movement-imo"
                        inputMode="numeric"
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
                  name="voyage"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="movement-voyage">Viaje</FieldLabel>
                      <Input
                        {...field}
                        id="movement-voyage"
                        aria-invalid={fieldState.invalid}
                        maxLength={50}
                        autoComplete="off"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </div>

              {!isEdit && assignable.length ? (
                <Controller
                  name="containerNumbers"
                  control={form.control}
                  render={({ field }) => (
                    <Field>
                      <FieldLabel>Contenedores</FieldLabel>
                      <div className="flex flex-wrap gap-x-4 gap-y-2">
                        {assignable.map((number) => {
                          const id = `movement-container-${number}`;
                          return (
                            <label
                              key={number}
                              htmlFor={id}
                              className="flex items-center gap-2 text-sm"
                            >
                              <Checkbox
                                id={id}
                                checked={field.value.includes(number)}
                                onCheckedChange={(v) =>
                                  field.onChange(
                                    v === true
                                      ? [...field.value, number]
                                      : field.value.filter((n) => n !== number)
                                  )
                                }
                              />
                              <span className="font-mono">
                                {containerNumberLabel(number)}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                      <FieldDescription>
                        Sin selección = aplica a todos los contenedores del
                        embarque (se registra una copia en cada uno).
                      </FieldDescription>
                    </Field>
                  )}
                />
              ) : null}

              {isEdit ? (
                <p className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
                  Los hitos ya notificados no se reenvían ni se revierten; sólo
                  se recalculan los pendientes.
                </p>
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
                "Registrar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!pending}
        onOpenChange={(o) => !o && setPending(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Guardar movimiento real?</AlertDialogTitle>
            <AlertDialogDescription>
              Se registrará el hito
              {pending ? ` "${MOVEMENT_EVENT_LABEL[pending.event]}"` : ""} y, si
              corresponde, se notificará al cliente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Volver</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirm}>Guardar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
