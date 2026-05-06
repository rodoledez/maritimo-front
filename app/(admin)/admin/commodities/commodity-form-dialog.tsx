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
  useCreateCommodity,
  useUpdateCommodity,
} from "@/lib/hooks/use-commodities";
import type { CommodityPayload } from "@/lib/api/commodities";
import { explainSequelizeError } from "@/lib/utils/errors";
import type { Commodity } from "@/types/domain";

const schema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  description: z.string().optional().or(z.literal("")),
  active: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

const empty: FormValues = { name: "", description: "", active: true };

export function CommodityFormDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Commodity | null;
}) {
  const isEditing = editing !== null;
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: empty,
    mode: "onBlur",
  });
  const createMutation = useCreateCommodity();
  const updateMutation = useUpdateCommodity();

  useEffect(() => {
    if (open) {
      form.reset(
        editing
          ? {
              name: editing.name ?? "",
              description: editing.description ?? "",
              active: editing.active ?? true,
            }
          : empty
      );
    }
  }, [open, editing, form]);

  const onSubmit = async (values: FormValues) => {
    const payload: CommodityPayload = {
      name: values.name,
      description: values.description || null,
      active: values.active,
    };
    try {
      if (isEditing && editing) {
        await updateMutation.mutateAsync({ id: editing.id, payload });
        toast.success("Commodity actualizada");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Commodity creada");
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(
        explainSequelizeError(
          error,
          isEditing
            ? "No se pudo actualizar la commodity"
            : "No se pudo crear la commodity"
        )
      );
    }
  };

  const isSubmitting = form.formState.isSubmitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar commodity" : "Crear commodity"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifica los datos de la commodity."
              : "Registra una nueva commodity (especie / producto)."}
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
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ej. Cerezas" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={3}
                      placeholder="Detalles opcionales"
                    />
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
