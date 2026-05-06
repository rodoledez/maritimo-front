"use client";

import { useCallback, useMemo, useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { KeyRound, MoreHorizontal, Plus, UserCog } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table/data-table";
import { ActiveBadge } from "@/components/data-table/active-cell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useDeleteUser,
  useToggleUserActive,
  useUsers,
} from "@/lib/hooks/use-users";
import { errorMessage } from "@/lib/utils/errors";
import { formatDate } from "@/lib/utils/format";
import type { User } from "@/types/domain";

import { ChangePasswordDialog } from "./change-password-dialog";
import { UserFormDialog } from "./user-form-dialog";

export default function UsuariosPage() {
  const { data, isLoading, error, refetch, isFetching } = useUsers();
  const toggleMutation = useToggleUserActive();
  const deleteMutation = useDeleteUser();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [deleting, setDeleting] = useState<User | null>(null);
  const [passwordTarget, setPasswordTarget] = useState<User | null>(null);

  const onCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const onEdit = useCallback((item: User) => {
    setEditing(item);
    setFormOpen(true);
  }, []);
  const onToggle = useCallback(
    async (item: User) => {
      try {
        await toggleMutation.mutateAsync({
          id: item.id,
          active: item.active ?? true,
        });
        toast.success(
          item.active ? "Usuario desactivado" : "Usuario activado"
        );
      } catch (e) {
        toast.error(errorMessage(e, "No se pudo cambiar el estado"));
      }
    },
    [toggleMutation]
  );
  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await deleteMutation.mutateAsync(deleting.id);
      toast.success("Usuario eliminado");
      setDeleting(null);
    } catch (e) {
      toast.error(errorMessage(e, "No se pudo eliminar"));
    }
  };

  const columns = useMemo<ColumnDef<User>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Nombre",
        cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
      },
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => row.original.email ?? row.original.username,
      },
      {
        accessorKey: "isClient",
        header: "Tipo",
        cell: ({ row }) => (
          <Badge variant="outline" className="font-normal">
            {row.original.isClient ? "Cliente" : "Administrador"}
          </Badge>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Creado",
        cell: ({ row }) => formatDate(row.original.createdAt),
      },
      {
        accessorKey: "active",
        header: "Estado",
        cell: ({ row }) => <ActiveBadge active={row.original.active ?? true} />,
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Acciones</span>,
        enableSorting: false,
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => onEdit(item)}>
                    Modificar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onToggle(item)}>
                    {item.active ? "Desactivar" : "Activar"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setPasswordTarget(item)}>
                    <KeyRound className="h-4 w-4" />
                    Cambiar contraseña
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => setDeleting(item)}
                  >
                    Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [onEdit, onToggle]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Usuarios"
        description="Administra cuentas de usuarios y clientes."
        actions={
          <Button onClick={onCreate}>
            <Plus className="h-4 w-4" />
            Crear usuario
          </Button>
        }
      />
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>No se pudieron cargar los usuarios</AlertTitle>
          <AlertDescription className="flex items-center justify-between gap-3">
            <span>{errorMessage(error, "Error desconocido")}</span>
            <Button size="sm" variant="outline" onClick={() => refetch()} disabled={isFetching}>
              Reintentar
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}
      <DataTable
        columns={columns}
        data={data ?? []}
        isLoading={isLoading}
        searchPlaceholder="Buscar por nombre, email…"
        emptyState={
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <UserCog className="h-8 w-8" />
            <p className="text-sm">No hay usuarios registrados.</p>
            <Button size="sm" onClick={onCreate}>
              <Plus className="h-4 w-4" />
              Crear usuario
            </Button>
          </div>
        }
      />
      <UserFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editing={editing}
      />
      <ChangePasswordDialog
        open={!!passwordTarget}
        onOpenChange={(open) => !open && setPasswordTarget(null)}
        user={passwordTarget}
      />
      <AlertDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará{" "}
              <span className="font-semibold text-foreground">
                {deleting?.name}
              </span>
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
