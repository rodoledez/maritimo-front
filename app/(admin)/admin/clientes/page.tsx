"use client";

import { useCallback, useMemo, useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Plus } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table/data-table";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  useClients,
  useDeleteClient,
  useToggleClientActive,
} from "@/lib/hooks/use-clients";
import { isApiError } from "@/types/api";
import type { Client } from "@/types/domain";

import { ClientFormDialog } from "./client-form-dialog";

function errorMessage(error: unknown, fallback: string): string {
  if (isApiError(error)) return error.message ?? fallback;
  if (error instanceof Error) return error.message;
  return fallback;
}

export default function ClientesPage() {
  const { data, isLoading, error, refetch, isFetching } = useClients();
  const toggleMutation = useToggleClientActive();
  const deleteMutation = useDeleteClient();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [deleting, setDeleting] = useState<Client | null>(null);

  const onCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const onEdit = useCallback((client: Client) => {
    setEditing(client);
    setFormOpen(true);
  }, []);

  const onToggle = useCallback(
    async (client: Client) => {
      try {
        await toggleMutation.mutateAsync({
          id: client.id,
          active: client.active,
        });
        toast.success(
          `Cliente ${client.active ? "desactivado" : "activado"} exitosamente`
        );
      } catch (error) {
        toast.error(
          errorMessage(error, "Error al cambiar el estado del cliente")
        );
      }
    },
    [toggleMutation]
  );

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await deleteMutation.mutateAsync(deleting.id);
      toast.success("Cliente eliminado exitosamente");
      setDeleting(null);
    } catch (error) {
      toast.error(errorMessage(error, "Error al eliminar cliente"));
    }
  };

  const columns = useMemo<ColumnDef<Client>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Nombre Empresa",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.name}</span>
        ),
      },
      { accessorKey: "contactName", header: "Contacto" },
      { accessorKey: "username", header: "Usuario" },
      { accessorKey: "contactEmail", header: "E-mail contacto" },
      {
        accessorKey: "active",
        header: "Estado",
        cell: ({ row }) => (
          <Badge
            variant={row.original.active ? "default" : "destructive"}
            className={
              row.original.active
                ? "bg-brand-success/15 text-brand-success hover:bg-brand-success/20"
                : "bg-brand-danger/15 text-brand-danger hover:bg-brand-danger/20"
            }
          >
            {row.original.active ? "Activo" : "Inactivo"}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Acciones</span>,
        enableSorting: false,
        cell: ({ row }) => {
          const client = row.original;
          return (
            <div className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Acciones</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem onClick={() => onEdit(client)}>
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onToggle(client)}>
                    {client.active ? "Desactivar" : "Activar"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => setDeleting(client)}
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
        title="Mantenedor de clientes"
        description="Gestiona los clientes que pueden solicitar reservas."
        actions={
          <Button onClick={onCreate}>
            <Plus className="h-4 w-4" />
            Crear cliente
          </Button>
        }
      />

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>No se pudieron cargar los clientes</AlertTitle>
          <AlertDescription className="flex items-center justify-between gap-3">
            <span>{errorMessage(error, "Error desconocido")}</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              Reintentar
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-9 w-full max-w-xs" />
          <Skeleton className="h-72 w-full" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={data ?? []}
          searchPlaceholder="Buscar por empresa, contacto, usuario…"
          emptyMessage="No hay clientes registrados"
        />
      )}

      <ClientFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editing={editing}
      />

      <AlertDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar cliente</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Está seguro de eliminar el cliente{" "}
              <span className="font-semibold text-foreground">
                {deleting?.name}
              </span>
              ? Esta acción no se puede deshacer.
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
