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
import { useCountries } from "@/lib/hooks/use-countries";
import {
  useCreatePort,
  useUpdatePort,
} from "@/lib/hooks/use-ports";
import type { PortPayload } from "@/lib/api/ports";
import { explainSequelizeError } from "@/lib/utils/errors";
import type { Port } from "@/types/domain";

const schema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  countryId: z
    .string()
    .min(1, "Debe seleccionar un país"),
  description: z.string().optional().or(z.literal("")),
  isOrigin: z.boolean(),
  isDestination: z.boolean(),
  active: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

const empty: FormValues = {
  name: "",
  countryId: "",
  description: "",
  isOrigin: true,
  isDestination: true,
  active: true,
};

export function PortFormDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Port | null;
}) {
  const isEditing = editing !== null;
  const { data: countries = [], isLoading: countriesLoading } = useCountries();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: empty,
    mode: "onBlur",
  });
  const createMutation = useCreatePort();
  const updateMutation = useUpdatePort();

  useEffect(() => {
    if (open) {
      form.reset(
        editing
          ? {
              name: editing.name ?? "",
              countryId: editing.countryId ? String(editing.countryId) : "",
              description: editing.description ?? "",
              isOrigin: editing.isOrigin ?? true,
              isDestination: editing.isDestination ?? true,
              active: editing.active ?? true,
            }
          : empty
      );
    }
  }, [open, editing, form]);

  const onSubmit = async (values: FormValues) => {
    const payload: PortPayload = {
      name: values.name,
      countryId: values.countryId ? Number(values.countryId) : null,
      description: values.description || null,
      isOrigin: values.isOrigin,
      isDestination: values.isDestination,
      active: values.active,
    };
    try {
      if (isEditing && editing) {
        await updateMutation.mutateAsync({ id: editing.id, payload });
        toast.success("Puerto actualizado");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Puerto creado");
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(
        explainSequelizeError(
          error,
          isEditing ? "No se pudo actualizar" : "No se pudo crear"
        )
      );
    }
  };

  const isSubmitting = form.formState.isSubmitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar puerto" : "Crear puerto"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifica los datos del puerto."
              : "Registra un nuevo puerto."}
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
                    <Input {...field} placeholder="Ej. San Antonio" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="countryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>País *</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={countriesLoading}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={
                            countriesLoading ? "Cargando…" : "Selecciona un país"
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {countries.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.name} ({c.isoCode})
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={2} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-3 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="isOrigin"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(v) => field.onChange(v === true)}
                      />
                    </FormControl>
                    <FormLabel className="font-normal">Puerto de origen</FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isDestination"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(v) => field.onChange(v === true)}
                      />
                    </FormControl>
                    <FormLabel className="font-normal">Puerto de destino</FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-2 space-y-0">
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
            </div>
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
