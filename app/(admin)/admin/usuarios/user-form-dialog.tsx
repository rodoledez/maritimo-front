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
import { Switch } from "@/components/ui/switch";
import {
  useCreateUser,
  useUpdateUser,
} from "@/lib/hooks/use-users";
import { explainSequelizeError } from "@/lib/utils/errors";
import type { User } from "@/types/domain";

const schema = z.object({
  name: z.string().min(2, "Debe ingresar nombre"),
  email: z
    .string()
    .min(1, "Debe ingresar e-mail")
    .email("E-mail inválido"),
  phone: z.string().optional().or(z.literal("")),
  isClient: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

const empty: FormValues = {
  name: "",
  email: "",
  phone: "",
  isClient: false,
};

export function UserFormDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: User | null;
}) {
  const isEditing = editing !== null;
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: empty,
    mode: "onBlur",
  });
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();

  useEffect(() => {
    if (open) {
      form.reset(
        editing
          ? {
              name: editing.name ?? "",
              email: editing.email ?? editing.username ?? "",
              phone: editing.phone ?? "",
              isClient: editing.isClient ?? false,
            }
          : empty
      );
    }
  }, [open, editing, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      if (isEditing && editing) {
        await updateMutation.mutateAsync({
          id: editing.id,
          payload: {
            name: values.name,
            email: values.email,
            phone: values.phone || null,
            isClient: values.isClient,
          },
        });
        toast.success("Usuario actualizado");
      } else {
        await createMutation.mutateAsync({
          name: values.name,
          username: values.email,
          email: values.email,
          phone: values.phone || null,
          isClient: values.isClient,
          password: "4321",
        });
        toast.success("Usuario creado (contraseña inicial: 4321)");
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
          <DialogTitle>
            {isEditing ? "Editar usuario" : "Crear usuario"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifica los datos del usuario."
              : "El usuario podrá iniciar sesión con la contraseña inicial 4321."}
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
                    <Input {...field} placeholder="Nombre completo" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail (usuario) *</FormLabel>
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
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="isClient"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Cliente</FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Activado: el usuario es un cliente. Desactivado: administrador.
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
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
