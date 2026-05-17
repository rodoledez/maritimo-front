"use client";

import { useEffect, useMemo } from "react";
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
import { useBookings } from "@/lib/hooks/use-bookings";
import { useCreateShipmentTracking } from "@/lib/hooks/use-shipments-tracking";
import { errorMessage } from "@/lib/utils/errors";

const schema = z.object({
  bookingId: z.string().min(1, "Debe seleccionar un booking"),
  followers: z.string().optional().or(z.literal("")),
  tags: z.string().optional().or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

const empty: FormValues = { bookingId: "", followers: "", tags: "" };
const FORM_ID = "tracking-form";

function splitCsv(value: string): string[] | undefined {
  const items = value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return items.length ? items : undefined;
}

export function TrackingFormDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: bookings = [], isLoading: bookingsLoading } = useBookings();
  const createMutation = useCreateShipmentTracking();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: empty,
    mode: "onBlur",
  });

  useEffect(() => {
    if (open) form.reset(empty);
  }, [open, form]);

  const trackeableBookings = useMemo(
    () => bookings.filter((b) => b.status === "Confirmado"),
    [bookings]
  );

  const onSubmit = async (values: FormValues) => {
    try {
      await createMutation.mutateAsync({
        bookingId: Number(values.bookingId),
        followers: splitCsv(values.followers ?? ""),
        tags: splitCsv(values.tags ?? ""),
      });
      toast.success("Tracking registrado en ShipsGo");
      onOpenChange(false);
    } catch (e) {
      toast.error(errorMessage(e, "No se pudo registrar el tracking"));
    }
  };

  const isSubmitting = form.formState.isSubmitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Registrar tracking</DialogTitle>
          <DialogDescription>
            Sólo bookings confirmados pueden registrarse en ShipsGo.
          </DialogDescription>
        </DialogHeader>

        <form
          id={FORM_ID}
          onSubmit={form.handleSubmit(onSubmit)}
          noValidate
        >
          <FieldGroup>
            <Controller
              name="bookingId"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="tracking-booking">
                    Booking <FieldRequiredMark />
                  </FieldLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={bookingsLoading}
                  >
                    <SelectTrigger
                      id="tracking-booking"
                      aria-invalid={fieldState.invalid}
                      className="w-full"
                    >
                      <SelectValue
                        placeholder={
                          bookingsLoading
                            ? "Cargando bookings…"
                            : "Selecciona un booking confirmado"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {trackeableBookings.map((b) => (
                        <SelectItem key={b.id} value={String(b.id)}>
                          #{b.id} ·{" "}
                          {b.Client?.name ?? "Sin cliente"}
                          {b.Itinerary?.carrier
                            ? ` · ${b.Itinerary.carrier}`
                            : ""}
                          {b.Itinerary?.containerShip
                            ? ` · ${b.Itinerary.containerShip}`
                            : ""}  Booking #{b.booking ?? "N/A"  } Bl #{b.blNo ?? "N/A"}
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
              name="followers"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="tracking-followers">
                    Seguidores (emails)
                  </FieldLabel>
                  <Input
                    {...field}
                    id="tracking-followers"
                    aria-invalid={fieldState.invalid}
                    placeholder="ana@empresa.com, juan@empresa.com"
                    autoComplete="off"
                  />
                  <FieldDescription>
                    Separa varios emails con coma. Recibirán notificaciones de
                    ShipsGo.
                  </FieldDescription>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              name="tags"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="tracking-tags">Tags</FieldLabel>
                  <Input
                    {...field}
                    id="tracking-tags"
                    aria-invalid={fieldState.invalid}
                    placeholder="urgente, cliente-X, q4"
                    autoComplete="off"
                  />
                  <FieldDescription>
                    Separa varios tags con coma. Útiles para clasificar el
                    shipment en ShipsGo.
                  </FieldDescription>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
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
            Cancelar
          </Button>
          <Button type="submit" form={FORM_ID} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Registrando…
              </>
            ) : (
              "Registrar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
