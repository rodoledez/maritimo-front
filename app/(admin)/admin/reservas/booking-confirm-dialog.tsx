"use client";

import { useEffect } from "react";
import { useForm, useFormContext, useWatch } from "react-hook-form";
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useConfirmBooking } from "@/lib/hooks/use-bookings";
import { useFacilities } from "@/lib/hooks/use-facilities";
import { errorMessage } from "@/lib/utils/errors";
import type { Booking, Facility } from "@/types/domain";

const TIME_HHMM = /^\d{2}:\d{2}$/;

const STACKING_MODES = ["CONTINUOUS", "DAILY"] as const;
type StackingMode = (typeof STACKING_MODES)[number];

const schema = z
  .object({
    booking: z.string().min(1, "Debe ingresar booking"),
    blNo: z.string().optional().or(z.literal("")),
    depotId: z.string().optional().or(z.literal("")),
    terminalId: z.string().optional().or(z.literal("")),
    stackingMode: z.enum(STACKING_MODES).optional(),
    stackingStart: z.string().optional().or(z.literal("")),
    stackingEnd: z.string().optional().or(z.literal("")),
    stackingOpenTime: z.string().optional().or(z.literal("")),
    stackingCloseTime: z.string().optional().or(z.literal("")),
    cutOff: z.string().optional().or(z.literal("")),
    lateArrival: z.string().optional().or(z.literal("")),
    demurrageDays: z.coerce.number().int().min(0).optional(),
    detentionDays: z.coerce.number().int().min(0).optional(),
    reeferPlugInDays: z.coerce.number().int().min(0).optional(),
    statusNotes: z.string().optional().or(z.literal("")),
  })
  .superRefine((v, ctx) => {
    if (!v.stackingMode) return;
    if (v.stackingMode === "CONTINUOUS") {
      if (!v.stackingStart) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["stackingStart"],
          message: "Debe ingresar el inicio",
        });
      }
      if (!v.stackingEnd) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["stackingEnd"],
          message: "Debe ingresar el término",
        });
      }
      if (v.stackingStart && v.stackingEnd) {
        const start = new Date(v.stackingStart).getTime();
        const end = new Date(v.stackingEnd).getTime();
        if (!Number.isNaN(start) && !Number.isNaN(end) && start > end) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["stackingEnd"],
            message: "El término debe ser posterior al inicio",
          });
        }
      }
    }
    if (v.stackingMode === "DAILY") {
      if (!v.stackingStart) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["stackingStart"],
          message: "Debe ingresar el primer día",
        });
      }
      if (!v.stackingEnd) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["stackingEnd"],
          message: "Debe ingresar el último día",
        });
      }
      if (v.stackingStart && v.stackingEnd && v.stackingStart > v.stackingEnd) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["stackingEnd"],
          message: "El último día debe ser posterior al primero",
        });
      }
      if (!v.stackingOpenTime || !TIME_HHMM.test(v.stackingOpenTime)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["stackingOpenTime"],
          message: "Formato HH:mm",
        });
      }
      if (!v.stackingCloseTime || !TIME_HHMM.test(v.stackingCloseTime)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["stackingCloseTime"],
          message: "Formato HH:mm",
        });
      }
      if (
        v.stackingOpenTime &&
        v.stackingCloseTime &&
        TIME_HHMM.test(v.stackingOpenTime) &&
        TIME_HHMM.test(v.stackingCloseTime) &&
        v.stackingOpenTime >= v.stackingCloseTime
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["stackingCloseTime"],
          message: "La hora de cierre debe ser posterior a la apertura",
        });
      }
    }
  });

type FormValues = z.infer<typeof schema>;

function toDatetimeLocal(value: string | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    // Fallback: if it's already roughly "YYYY-MM-DDTHH:mm", let it through.
    return typeof value === "string" ? value.slice(0, 16) : "";
  }
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

function fromDatetimeLocal(value: string): string | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toISOString();
}

function toDateOnly(value: string | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    return typeof value === "string" ? value.slice(0, 10) : "";
  }
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function fromDateOnly(value: string): string | undefined {
  if (!value) return undefined;
  const d = new Date(`${value}T00:00:00`);
  if (Number.isNaN(d.getTime())) return value;
  return d.toISOString();
}

function toTimeHHMM(value: string | null | undefined): string {
  if (!value) return "";
  if (TIME_HHMM.test(value)) return value;
  return value.slice(0, 5);
}

export function BookingConfirmDialog({
  open,
  onOpenChange,
  booking,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: Booking | null;
}) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      booking: "",
      blNo: "",
      depotId: "",
      terminalId: "",
      stackingMode: undefined,
      stackingStart: "",
      stackingEnd: "",
      stackingOpenTime: "",
      stackingCloseTime: "",
      cutOff: "",
      lateArrival: "",
      demurrageDays: undefined,
      detentionDays: undefined,
      reeferPlugInDays: undefined,
      statusNotes: "",
    },
    mode: "onBlur",
  });
  const mutation = useConfirmBooking();
  const { data: facilities = [] } = useFacilities();

  const facilityOptions = (
    kind: "DEPOT" | "TERMINAL",
    selectedId: number | string | null | undefined
  ): Array<{ value: string; label: string; keywords?: string }> => {
    const selected = selectedId !== null && selectedId !== undefined ? String(selectedId) : null;
    return facilities
      .filter(
        (f: Facility) =>
          f.type === kind && (f.active || String(f.id) === selected)
      )
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((f) => ({
        value: String(f.id),
        label: f.active ? f.name : `${f.name} (inactivo)`,
        keywords: [f.city, f.region].filter(Boolean).join(" "),
      }));
  };

  useEffect(() => {
    if (open && booking) {
      const mode = booking.stackingMode ?? undefined;
      form.reset({
        booking: booking.booking ?? "",
        blNo: booking.blNo ?? "",
        depotId:
          booking.depotId !== null && booking.depotId !== undefined
            ? String(booking.depotId)
            : "",
        terminalId:
          booking.terminalId !== null && booking.terminalId !== undefined
            ? String(booking.terminalId)
            : "",
        stackingMode: mode,
        stackingStart:
          mode === "DAILY"
            ? toDateOnly(booking.stackingStart ?? "")
            : toDatetimeLocal(booking.stackingStart ?? ""),
        stackingEnd:
          mode === "DAILY"
            ? toDateOnly(booking.stackingEnd ?? "")
            : toDatetimeLocal(booking.stackingEnd ?? ""),
        stackingOpenTime: toTimeHHMM(booking.stackingOpenTime ?? ""),
        stackingCloseTime: toTimeHHMM(booking.stackingCloseTime ?? ""),
        cutOff: toDatetimeLocal(
          booking.cutOff ?? booking.Itinerary?.documentClosure ?? ""
        ),
        lateArrival: toDatetimeLocal(booking.lateArrival ?? ""),
        demurrageDays: booking.demurrageDays ?? undefined,
        detentionDays: booking.detentionDays ?? undefined,
        reeferPlugInDays: booking.reeferPlugInDays ?? undefined,
        statusNotes: booking.statusNotes ?? "",
      });
    }
  }, [open, booking, form]);

  const onSubmit = async (values: FormValues) => {
    if (!booking) return;
    try {
      const mode = values.stackingMode;
      const stackingStart =
        mode === "CONTINUOUS"
          ? fromDatetimeLocal(values.stackingStart ?? "")
          : mode === "DAILY"
            ? fromDateOnly(values.stackingStart ?? "")
            : undefined;
      const stackingEnd =
        mode === "CONTINUOUS"
          ? fromDatetimeLocal(values.stackingEnd ?? "")
          : mode === "DAILY"
            ? fromDateOnly(values.stackingEnd ?? "")
            : undefined;
      const stackingOpenTime =
        mode === "DAILY" ? values.stackingOpenTime || undefined : undefined;
      const stackingCloseTime =
        mode === "DAILY" ? values.stackingCloseTime || undefined : undefined;

      await mutation.mutateAsync({
        id: booking.id,
        payload: {
          booking: values.booking,
          blNo: values.blNo || undefined,
          depotId: values.depotId ? Number(values.depotId) : undefined,
          terminalId: values.terminalId ? Number(values.terminalId) : undefined,
          stackingMode: mode,
          stackingStart,
          stackingEnd,
          stackingOpenTime,
          stackingCloseTime,
          cutOff: fromDatetimeLocal(values.cutOff ?? ""),
          lateArrival: fromDatetimeLocal(values.lateArrival ?? ""),
          demurrageDays: values.demurrageDays,
          detentionDays: values.detentionDays,
          reeferPlugInDays: values.reeferPlugInDays,
          statusNotes: values.statusNotes || undefined,
        },
      });
      toast.success("Reserva confirmada");
      onOpenChange(false);
    } catch (e) {
      toast.error(errorMessage(e, "No se pudo confirmar la reserva"));
    }
  };

  const isSubmitting = form.formState.isSubmitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Confirmar reserva #{booking?.id}</DialogTitle>
          <DialogDescription>
            Ingresa los datos de confirmación de la reserva.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
            noValidate
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="booking"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Booking *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="blNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nº BL</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="terminalId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Terminal</FormLabel>
                    <FormControl>
                      <SearchableSelect
                        value={field.value ?? ""}
                        onValueChange={field.onChange}
                        placeholder="Selecciona terminal…"
                        searchPlaceholder="Buscar terminal…"
                        options={facilityOptions(
                          "TERMINAL",
                          booking?.terminalId
                        )}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="depotId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Depósito</FormLabel>
                    <FormControl>
                      <SearchableSelect
                        value={field.value ?? ""}
                        onValueChange={field.onChange}
                        placeholder="Selecciona depósito…"
                        searchPlaceholder="Buscar depósito…"
                        options={facilityOptions("DEPOT", booking?.depotId)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cutOff"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Corte documental</FormLabel>
                    <FormControl>
                      <Input {...field} type="datetime-local" step={60} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lateArrival"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Late arrival</FormLabel>
                    <FormControl>
                      <Input {...field} type="datetime-local" step={60} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="demurrageDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Demurrage (días)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        type="number"
                        min={0}
                        step={1}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="detentionDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Detention (días)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        type="number"
                        min={0}
                        step={1}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="reeferPlugInDays"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Días de enchufe</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        type="number"
                        min={0}
                        step={1}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <StackingSection />

            <FormField
              control={form.control}
              name="statusNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cerrar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Confirmando…
                  </>
                ) : (
                  "Confirmar reserva"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

const STACKING_OPTIONS: Array<{ value: StackingMode; label: string }> = [
  { value: "CONTINUOUS", label: "Continuo" },
  { value: "DAILY", label: "Por horarios diarios" },
];

function StackingSection() {
  const form = useFormContext<FormValues>();
  const mode = useWatch({ control: form.control, name: "stackingMode" });

  const switchMode = (next: StackingMode | undefined) => {
    form.setValue("stackingMode", next, { shouldValidate: false });
    form.setValue("stackingStart", "", { shouldValidate: false });
    form.setValue("stackingEnd", "", { shouldValidate: false });
    form.setValue("stackingOpenTime", "", { shouldValidate: false });
    form.setValue("stackingCloseTime", "", { shouldValidate: false });
    form.clearErrors([
      "stackingStart",
      "stackingEnd",
      "stackingOpenTime",
      "stackingCloseTime",
    ]);
  };

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Stacking</p>
          <p className="text-xs text-muted-foreground">
            Selecciona la modalidad para habilitar los campos correspondientes.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {STACKING_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              type="button"
              size="sm"
              variant={mode === opt.value ? "default" : "outline"}
              onClick={() =>
                switchMode(mode === opt.value ? undefined : opt.value)
              }
              aria-pressed={mode === opt.value}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      {mode === "CONTINUOUS" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="stackingStart"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Inicio *</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    type="datetime-local"
                    step={60}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="stackingEnd"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Término *</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    type="datetime-local"
                    step={60}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      ) : null}

      {mode === "DAILY" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="stackingStart"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Primer día *</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    type="date"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="stackingEnd"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Último día *</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    type="date"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="stackingOpenTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hora apertura *</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    type="time"
                    step={60}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="stackingCloseTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hora cierre *</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    type="time"
                    step={60}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      ) : null}
    </div>
  );
}
