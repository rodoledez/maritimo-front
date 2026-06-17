"use client";

import { useEffect } from "react";
import {
  useFieldArray,
  useForm,
  useFormContext,
  useWatch,
} from "react-hook-form";
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useUpdateConfirmation } from "@/lib/hooks/use-bookings";
import { useCommodities } from "@/lib/hooks/use-commodities";
import { useTypeContainers } from "@/lib/hooks/use-type-containers";
import { useFacilities } from "@/lib/hooks/use-facilities";
import { errorMessage } from "@/lib/utils/errors";
import type { Booking, Facility } from "@/types/domain";

const TIME_HHMM = /^\d{2}:\d{2}$/;

const STACKING_MODES = ["CONTINUOUS", "DAILY"] as const;
type StackingMode = (typeof STACKING_MODES)[number];

const FREIGHT_OPTIONS = [
  "Collect",
  "Prepaid",
  "Prepaid as per agreement",
] as const;
const BL_OPTIONS = [
  "Emision Origen",
  "Emision Destino",
  "Sea WayBill",
  "Telex Release",
  "Express Release",
] as const;
const VGM_OPTIONS = ["En Planta", "En Puerto"] as const;

const scheduleRowSchema = z.object({
  day: z.string().optional().or(z.literal("")),
  startTime: z.string().optional().or(z.literal("")),
  endTime: z.string().optional().or(z.literal("")),
});

const schema = z
  .object({
    // Carga
    specie: z.string().optional().or(z.literal("")),
    typeContainer: z.string().optional().or(z.literal("")),
    typeFreight: z.string().min(1, "Tipo de flete requerido"),
    qtyContainers: z.coerce.number().int().min(1, "Mínimo 1 contenedor"),
    temperature: z.coerce.number().optional(),
    ventilation: z.string().optional().or(z.literal("")),
    bl: z.string().min(1, "Emisión BL requerida"),
    isATM: z.boolean(),
    isColdTreatment: z.boolean(),
    vgm: z.string().min(1, "VGM requerido"),
    humidity: z.coerce.number().optional(),
    description: z.string().optional().or(z.literal("")),
    // Confirmación
    booking: z.string().min(1, "Debe ingresar booking"),
    blNo: z.string().optional().or(z.literal("")),
    depotId: z.string().optional().or(z.literal("")),
    terminalId: z.string().optional().or(z.literal("")),
    stackingMode: z.enum(STACKING_MODES).optional(),
    stackingStart: z.string().optional().or(z.literal("")),
    stackingEnd: z.string().optional().or(z.literal("")),
    stackingSchedule: z.array(scheduleRowSchema).optional(),
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
      const rows = v.stackingSchedule ?? [];
      if (rows.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["stackingSchedule"],
          message: "Debe agregar al menos un día",
        });
      }
      rows.forEach((row, i) => {
        if (!row.day) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["stackingSchedule", i, "day"],
            message: "Día requerido",
          });
        }
        if (!row.startTime || !TIME_HHMM.test(row.startTime)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["stackingSchedule", i, "startTime"],
            message: "HH:mm",
          });
        }
        if (!row.endTime || !TIME_HHMM.test(row.endTime)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["stackingSchedule", i, "endTime"],
            message: "HH:mm",
          });
        }
        if (
          row.startTime &&
          row.endTime &&
          TIME_HHMM.test(row.startTime) &&
          TIME_HHMM.test(row.endTime) &&
          row.startTime >= row.endTime
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["stackingSchedule", i, "endTime"],
            message: "El cierre debe ser posterior a la apertura",
          });
        }
      });
    }
  });

type FormValues = z.infer<typeof schema>;

function toDatetimeLocal(value: string | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
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

function toTimeHHMM(value: string | null | undefined): string {
  if (!value) return "";
  if (TIME_HHMM.test(value)) return value;
  return value.slice(0, 5);
}

export function BookingUpdateConfirmationDialog({
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
      specie: "",
      typeContainer: "",
      typeFreight: "",
      qtyContainers: 1,
      temperature: undefined,
      ventilation: "",
      bl: "",
      isATM: false,
      isColdTreatment: false,
      vgm: "",
      humidity: undefined,
      description: "",
      booking: "",
      blNo: "",
      depotId: "",
      terminalId: "",
      stackingMode: undefined,
      stackingStart: "",
      stackingEnd: "",
      stackingSchedule: [],
      cutOff: "",
      lateArrival: "",
      demurrageDays: undefined,
      detentionDays: undefined,
      reeferPlugInDays: undefined,
      statusNotes: "",
    },
    mode: "onBlur",
  });
  const mutation = useUpdateConfirmation();
  const { data: commodities = [] } = useCommodities();
  const { data: containers = [] } = useTypeContainers();
  const { data: facilities = [] } = useFacilities();

  const facilityOptions = (
    kind: "DEPOT" | "TERMINAL",
    selectedId: number | string | null | undefined
  ): Array<{ value: string; label: string; keywords?: string }> => {
    const selected =
      selectedId !== null && selectedId !== undefined ? String(selectedId) : null;
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
        specie: booking.specie ?? "",
        typeContainer:
          booking.typeContainer ?? booking.typeContainerEntity ?? "",
        typeFreight: booking.typeFreight ?? "",
        qtyContainers: booking.qtyContainers ?? 1,
        temperature: booking.temperature ?? undefined,
        ventilation: booking.ventilation ?? "",
        bl: booking.bl ?? "",
        isATM: booking.isATM ?? booking.isAtm ?? false,
        isColdTreatment: booking.isColdTreatment ?? false,
        vgm: booking.vgm ?? "",
        humidity: booking.humidity ?? undefined,
        description: booking.description ?? "",
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
          mode === "CONTINUOUS"
            ? toDatetimeLocal(booking.stackingStart ?? "")
            : "",
        stackingEnd:
          mode === "CONTINUOUS"
            ? toDatetimeLocal(booking.stackingEnd ?? "")
            : "",
        stackingSchedule:
          mode === "DAILY"
            ? (booking.stackingSchedule ?? []).map((s) => ({
                day: toDateOnly(s.day ?? ""),
                startTime: toTimeHHMM(s.startTime ?? ""),
                endTime: toTimeHHMM(s.endTime ?? ""),
              }))
            : [],
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
          : undefined;
      const stackingEnd =
        mode === "CONTINUOUS"
          ? fromDatetimeLocal(values.stackingEnd ?? "")
          : undefined;
      const stackingSchedule =
        mode === "DAILY"
          ? (values.stackingSchedule ?? []).map((row) => ({
              day: row.day ?? "",
              startTime: row.startTime ?? "",
              endTime: row.endTime ?? "",
            }))
          : undefined;

      await mutation.mutateAsync({
        id: booking.id,
        payload: {
          // Carga
          specie: values.specie || null,
          typeContainer: values.typeContainer || null,
          typeFreight: values.typeFreight,
          qtyContainers: values.qtyContainers,
          temperature: values.temperature ?? null,
          ventilation: values.ventilation || null,
          bl: values.bl,
          isATM: values.isATM,
          isColdTreatment: values.isColdTreatment,
          vgm: values.vgm,
          humidity: values.humidity ?? null,
          description: values.description || null,
          // Confirmación
          booking: values.booking,
          blNo: values.blNo || undefined,
          depotId: values.depotId ? Number(values.depotId) : undefined,
          terminalId: values.terminalId ? Number(values.terminalId) : undefined,
          stackingMode: mode,
          stackingStart,
          stackingEnd,
          stackingSchedule,
          cutOff: fromDatetimeLocal(values.cutOff ?? ""),
          lateArrival: fromDatetimeLocal(values.lateArrival ?? ""),
          demurrageDays: values.demurrageDays,
          detentionDays: values.detentionDays,
          reeferPlugInDays: values.reeferPlugInDays,
          statusNotes: values.statusNotes || undefined,
        },
      });
      toast.success("Confirmación actualizada");
      onOpenChange(false);
    } catch (e) {
      toast.error(errorMessage(e, "No se pudo actualizar la confirmación"));
    }
  };

  const isSubmitting = form.formState.isSubmitting;

  const commodityNames = Array.from(
    new Set([
      ...(booking?.specie ? [booking.specie] : []),
      ...commodities.filter((c) => c.active).map((c) => c.name),
    ])
  );
  const containerNames = Array.from(
    new Set([
      ...(booking?.typeContainer ? [booking.typeContainer] : []),
      ...containers.filter((c) => c.active).map((c) => c.name),
    ])
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Actualizar confirmación #{booking?.id}</DialogTitle>
          <DialogDescription>
            Modifica los datos de carga y de confirmación de la reserva.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6"
            noValidate
          >
            <div className="space-y-4">
              <p className="text-sm font-medium">Datos de carga</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="specie"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Especie</FormLabel>
                      <FormControl>
                        <SearchableSelect
                          value={field.value ?? ""}
                          onValueChange={field.onChange}
                          placeholder="Selecciona…"
                          searchPlaceholder="Buscar especie…"
                          options={commodityNames.map((name) => ({
                            value: name,
                            label: name,
                          }))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="typeContainer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contenedor</FormLabel>
                      <FormControl>
                        <SearchableSelect
                          value={field.value ?? ""}
                          onValueChange={field.onChange}
                          placeholder="Selecciona…"
                          searchPlaceholder="Buscar contenedor…"
                          options={containerNames.map((name) => ({
                            value: name,
                            label: name,
                          }))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="typeFreight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de flete *</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Selecciona…" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {FREIGHT_OPTIONS.map((o) => (
                            <SelectItem key={o} value={o}>
                              {o}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="qtyContainers"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cantidad contenedores *</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" min={1} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="temperature"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Temperatura (°C)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          type="number"
                          step="0.1"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ventilation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ventilación</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Emisión BL *</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Selecciona…" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {BL_OPTIONS.map((o) => (
                            <SelectItem key={o} value={o}>
                              {o}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="vgm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>VGM *</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Selecciona…" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {VGM_OPTIONS.map((o) => (
                            <SelectItem key={o} value={o}>
                              {o}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="humidity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Humedad (%)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          type="number"
                          min={0}
                          max={100}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="isATM"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center gap-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(v) => field.onChange(v === true)}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">
                        ATM controlada
                      </FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isColdTreatment"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center gap-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(v) => field.onChange(v === true)}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">
                        Cold treatment
                      </FormLabel>
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observaciones</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4 border-t pt-4">
              <p className="text-sm font-medium">Datos de confirmación</p>
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
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cerrar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Guardando…
                  </>
                ) : (
                  "Guardar cambios"
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
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "stackingSchedule",
  });

  const switchMode = (next: StackingMode | undefined) => {
    form.setValue("stackingMode", next, { shouldValidate: false });
    form.setValue("stackingStart", "", { shouldValidate: false });
    form.setValue("stackingEnd", "", { shouldValidate: false });
    form.setValue(
      "stackingSchedule",
      next === "DAILY" ? [{ day: "", startTime: "", endTime: "" }] : [],
      { shouldValidate: false }
    );
    form.clearErrors(["stackingStart", "stackingEnd", "stackingSchedule"]);
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
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Agrega cada día con su propio rango horario.
          </p>
          <div className="space-y-2">
            {fields.map((row, index) => (
              <div
                key={row.id}
                className="flex flex-wrap items-start gap-3 rounded-md border p-3 sm:flex-nowrap"
              >
                <FormField
                  control={form.control}
                  name={`stackingSchedule.${index}.day`}
                  render={({ field }) => (
                    <FormItem className="flex-1 min-w-[140px]">
                      <FormLabel>Día *</FormLabel>
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
                  name={`stackingSchedule.${index}.startTime`}
                  render={({ field }) => (
                    <FormItem className="w-[120px]">
                      <FormLabel>Apertura *</FormLabel>
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
                  name={`stackingSchedule.${index}.endTime`}
                  render={({ field }) => (
                    <FormItem className="w-[120px]">
                      <FormLabel>Cierre *</FormLabel>
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
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="mt-6 shrink-0 text-destructive hover:text-destructive"
                  onClick={() => remove(index)}
                  disabled={fields.length <= 1}
                  aria-label="Quitar día"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          {form.formState.errors.stackingSchedule &&
          !Array.isArray(form.formState.errors.stackingSchedule) ? (
            <p className="text-sm text-destructive">
              {form.formState.errors.stackingSchedule.message}
            </p>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ day: "", startTime: "", endTime: "" })}
          >
            <Plus className="h-4 w-4" />
            Agregar día
          </Button>
        </div>
      ) : null}
    </div>
  );
}
