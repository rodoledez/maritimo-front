"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateBooking } from "@/lib/hooks/use-bookings";
import { useCommodities } from "@/lib/hooks/use-commodities";
import { useTypeContainers } from "@/lib/hooks/use-type-containers";
import { errorMessage } from "@/lib/utils/errors";
import type { Booking } from "@/types/domain";

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

const schema = z.object({
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
});

type FormValues = z.infer<typeof schema>;

export function BookingEditDialog({
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
    },
    mode: "onBlur",
  });
  const mutation = useUpdateBooking();
  const { data: commodities = [] } = useCommodities();
  const { data: containers = [] } = useTypeContainers();

  useEffect(() => {
    if (open && booking) {
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
      });
    }
  }, [open, booking, form]);

  const onSubmit = async (values: FormValues) => {
    if (!booking) return;
    try {
      await mutation.mutateAsync({
        id: booking.id,
        payload: {
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
        },
      });
      toast.success("Reserva actualizada");
      onOpenChange(false);
    } catch (e) {
      toast.error(errorMessage(e, "No se pudo actualizar la reserva"));
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar reserva #{booking?.id}</DialogTitle>
          <DialogDescription>
            Modifica los datos de la reserva.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="specie"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Especie</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecciona…" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {commodityNames.map((name) => (
                          <SelectItem key={name} value={name}>
                            {name}
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
                name="typeContainer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contenedor</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecciona…" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {containerNames.map((name) => (
                          <SelectItem key={name} value={name}>
                            {name}
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
                name="typeFreight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de flete *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
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
                    <Select value={field.value} onValueChange={field.onChange}>
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
                    <Select value={field.value} onValueChange={field.onChange}>
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
                    <FormLabel className="font-normal">ATM controlada</FormLabel>
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
                    <FormLabel className="font-normal">Cold treatment</FormLabel>
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
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
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
