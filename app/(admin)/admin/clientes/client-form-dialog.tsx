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
import {
  useCreateClient,
  useUpdateClient,
} from "@/lib/hooks/use-clients";
import type { ClientPayload } from "@/lib/api/clients";
import { isApiError } from "@/types/api";
import type { Client } from "@/types/domain";

const clientSchema = z.object({
  name: z.string().min(1, "Debe ingresar nombre empresa"),
  username: z
    .string()
    .min(1, "Debe ingresar nombre usuario (e-mail)")
    .email("E-mail inválido"),
  contactName: z.string().min(1, "Debe ingresar nombre contacto"),
  contactEmail: z
    .string()
    .min(1, "Debe ingresar e-mail contacto")
    .email("E-mail inválido"),
  contactEmail2: z
    .string()
    .email("E-mail inválido")
    .optional()
    .or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
});

type ClientFormValues = z.infer<typeof clientSchema>;

const emptyValues: ClientFormValues = {
  name: "",
  username: "",
  contactName: "",
  contactEmail: "",
  contactEmail2: "",
  phone: "",
};

function explainError(error: unknown, fallback: string): string {
  if (!isApiError(error)) return fallback;
  const data = error.data as
    | { name?: string; message?: string; errors?: Array<{ path?: string; message?: string; type?: string }> }
    | undefined;
  if (data?.name === "SequelizeUniqueConstraintError") {
    const usernameError = data.errors?.find(
      (e) => e.path === "username" || e.message?.includes("username")
    );
    return usernameError
      ? "Nombre de usuario ya creado"
      : "Ya existe un registro con estos datos";
  }
  if (
    error.status === 400 &&
    (data?.message?.includes("username") ||
      data?.message?.includes("unique") ||
      JSON.stringify(data ?? {}).includes("username must be unique"))
  ) {
    return "Nombre de usuario ya creado";
  }
  return data?.message ?? error.message ?? fallback;
}

export function ClientFormDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: Client | null;
}) {
  const isEditing = editing !== null;
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: emptyValues,
    mode: "onBlur",
  });
  const createMutation = useCreateClient();
  const updateMutation = useUpdateClient();

  useEffect(() => {
    if (open) {
      form.reset(
        editing
          ? {
              name: editing.name ?? "",
              username: editing.username ?? "",
              contactName: editing.contactName ?? "",
              contactEmail: editing.contactEmail ?? "",
              contactEmail2: editing.contactEmail2 ?? "",
              phone: editing.phone ?? "",
            }
          : emptyValues
      );
    }
  }, [open, editing, form]);

  const onSubmit = async (values: ClientFormValues) => {
    const payload: ClientPayload = {
      name: values.name,
      username: values.username,
      contactName: values.contactName,
      contactEmail: values.contactEmail,
      contactEmail2: values.contactEmail2 || null,
      phone: values.phone || null,
    };

    try {
      if (isEditing && editing) {
        await updateMutation.mutateAsync({ id: editing.id, payload });
        toast.success("Cliente actualizado");
      } else {
        await createMutation.mutateAsync(payload);
        toast.success("Cliente creado");
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(
        explainError(
          error,
          isEditing
            ? "No se pudo actualizar el cliente"
            : "No se pudo crear el cliente"
        )
      );
    }
  };

  const isSubmitting = form.formState.isSubmitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar cliente" : "Crear cliente"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifica los datos del cliente."
              : "Completa los datos para crear un nuevo cliente."}
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
                  <FormLabel>Empresa *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Ingrese el nombre de la empresa"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Usuario (email) *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="usuario@empresa.com"
                        disabled={isEditing}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contactEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email contacto *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="contacto@empresa.com"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="contactName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre contacto *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Nombre del contacto" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contactEmail2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email adicional</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="opcional"
                      />
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
                Cancelar
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
