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
  useCreateCountry,
  useUpdateCountry,
} from "@/lib/hooks/use-countries";
import type { CountryPayload } from "@/lib/api/countries";
import { explainSequelizeError } from "@/lib/utils/errors";
import type { Country } from "@/types/domain";

const schema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  isoCode: z
    .string()
    .length(2, "Código ISO debe tener 2 caracteres")
    .regex(/^[A-Z]{2}$/, "Use 2 letras mayúsculas (ej. CL, AR)"),
  description: z.string().optional().or(z.literal("")),
  active: z.boolean(),
});

type FormValues = z.infer<typeof schema>;
const empty: FormValues = { name: "", isoCode: "", description: "", active: true };

export function CountryFormDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Country | null;
}) {
  const isEditing = editing !== null;
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: empty,
    mode: "onBlur",
  });
  const createMutation = useCreateCountry();
  const updateMutation = useUpdateCountry();

  useEffect(() => {
    if (open) {
      form.reset(
        editing
          ? {
              name: editing.name ?? "",
              isoCode: editing.isoCode ?? "",
              description: editing.description ?? "",
              active: editing.active ?? true,
            }
          : empty
      );
    }
  }, [open, editing, form]);

  const onSubmit = async (values: FormValues) => {
    const payload: CountryPayload = {
      name: values.name,
      isoCode: values.isoCode.toUpperCase(),
      description: values.description || null,
      active: values.active,
    };
    try {
      if (isEditing && editing) {
        await updateMutation.mutateAsync({ id: editing.id, payload });
        toast.success("País actualizado");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("País creado");
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(
        explainSequelizeError(
          error,
          isEditing ? "No se pudo actualizar el país" : "No se pudo crear el país"
        )
      );
    }
  };

  const isSubmitting = form.formState.isSubmitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar país" : "Crear país"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifica los datos del país."
              : "Registra un nuevo país."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4"
            noValidate
          >
            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Nombre *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ej. Chile" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isoCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código ISO *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        maxLength={2}
                        className="uppercase"
                        placeholder="CL"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(v) => field.onChange(v === true)}
                    />
                  </FormControl>
                  <FormLabel className="font-normal">Activo</FormLabel>
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
                ) : isEditing ? (
                  "Actualizar"
                ) : (
                  "Guardar"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
