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
import { useConfirmBooking } from "@/lib/hooks/use-bookings";
import { errorMessage } from "@/lib/utils/errors";
import type { Booking } from "@/types/domain";

const schema = z.object({
  booking: z.string().min(1, "Debe ingresar booking"),
  blNo: z.string().optional().or(z.literal("")),
  depot: z.string().optional().or(z.literal("")),
  stacking: z.string().optional().or(z.literal("")),
  cutOff: z.string().optional().or(z.literal("")),
  lateArrival: z.string().optional().or(z.literal("")),
  demurrageDays: z.coerce.number().int().min(0).optional(),
  detentionDays: z.coerce.number().int().min(0).optional(),
  reeferPlugInDays: z.coerce.number().int().min(0).optional(),
  statusNotes: z.string().optional().or(z.literal("")),
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
      depot: "",
      stacking: "",
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

  useEffect(() => {
    if (open && booking) {
      form.reset({
        booking: booking.booking ?? "",
        blNo: booking.blNo ?? "",
        depot: booking.depot ?? "",
        stacking: booking.stacking ?? booking.Itinerary?.stacking ?? "",
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
      await mutation.mutateAsync({
        id: booking.id,
        payload: {
          booking: values.booking,
          blNo: values.blNo || undefined,
          depot: values.depot || undefined,
          stacking: values.stacking || undefined,
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
                name="depot"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Depot</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="stacking"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stacking</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
