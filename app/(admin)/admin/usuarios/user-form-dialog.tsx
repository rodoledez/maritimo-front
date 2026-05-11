"use client";

import { useEffect } from "react";
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

const FORM_ID = "user-form";

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
      <DialogContent className="max-w-2xl">
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

        <form
          id={FORM_ID}
          onSubmit={form.handleSubmit(onSubmit)}
          noValidate
        >
          <FieldGroup>
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="user-name">
                    Nombre <FieldRequiredMark />
                  </FieldLabel>
                  <Input
                    {...field}
                    id="user-name"
                    aria-invalid={fieldState.invalid}
                    placeholder="Nombre completo"
                    autoComplete="off"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <div className="grid gap-6 sm:grid-cols-2">
              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="user-email">
                      E-mail (usuario) <FieldRequiredMark />
                    </FieldLabel>
                    <Input
                      {...field}
                      id="user-email"
                      type="email"
                      aria-invalid={fieldState.invalid}
                      placeholder="usuario@empresa.com"
                      disabled={isEditing}
                      autoComplete="off"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="phone"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="user-phone">Teléfono</FieldLabel>
                    <Input
                      {...field}
                      id="user-phone"
                      aria-invalid={fieldState.invalid}
                      autoComplete="off"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </div>
            <Controller
              name="isClient"
              control={form.control}
              render={({ field }) => (
                <Field
                  orientation="horizontal"
                  className="justify-between rounded-lg border p-3"
                >
                  <div className="space-y-1">
                    <FieldLabel htmlFor="user-is-client">Cliente</FieldLabel>
                    <FieldDescription>
                      Activado: el usuario es un cliente. Desactivado:
                      administrador.
                    </FieldDescription>
                  </div>
                  <Switch
                    id="user-is-client"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
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
            Cerrar
          </Button>
          <Button type="submit" form={FORM_ID} disabled={isSubmitting}>
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
      </DialogContent>
    </Dialog>
  );
}
