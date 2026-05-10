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
import { Textarea } from "@/components/ui/textarea";
import { useCancelBooking } from "@/lib/hooks/use-bookings";
import { errorMessage } from "@/lib/utils/errors";
import type { Booking } from "@/types/domain";

const schema = z.object({
  statusNotes: z
    .string()
    .min(3, "Indica el motivo de la cancelación (mín. 3 caracteres)"),
});

type FormValues = z.infer<typeof schema>;

export function BookingCancelDialog({
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
    defaultValues: { statusNotes: "" },
    mode: "onBlur",
  });
  const mutation = useCancelBooking();

  useEffect(() => {
    if (open) form.reset({ statusNotes: "" });
  }, [open, form]);

  const onSubmit = async (values: FormValues) => {
    if (!booking) return;
    try {
      await mutation.mutateAsync({
        id: booking.id,
        payload: { statusNotes: values.statusNotes },
      });
      toast.success("Reserva cancelada");
      onOpenChange(false);
    } catch (e) {
      toast.error(errorMessage(e, "No se pudo cancelar la reserva"));
    }
  };

  const isSubmitting = form.formState.isSubmitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Cancelar reserva #{booking?.id}</DialogTitle>
          <DialogDescription>
            Indica el motivo de la cancelación. Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
            noValidate
          >
            <FormField
              control={form.control}
              name="statusNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivo *</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={4} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cerrar
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={isSubmitting}
                className="bg-destructive text-white hover:bg-destructive/90"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Cancelando…
                  </>
                ) : (
                  "Cancelar reserva"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
