"use client";

import { useCallback, useMemo, useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Plus, Users } from "lucide-react";
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
import { ActiveBadge } from "@/components/data-table/active-cell";
import { EmailCell } from "@/components/data-table/email-cell";
import {
  ACTIVE_FILTER_OPTIONS,
  FilterPopover,
  matchesActiveFilter,
  type ActiveFilter,
} from "@/components/data-table/filter-popover";
import { IdentityCell } from "@/components/data-table/identity-cell";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");

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
        toast.success(client.active ? "Cliente desactivado" : "Cliente activado");
      } catch (error) {
        toast.error(
          errorMessage(error, "No se pudo cambiar el estado del cliente")
        );
      }
    },
    [toggleMutation]
  );

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await deleteMutation.mutateAsync(deleting.id);
      toast.success("Cliente eliminado");
      setDeleting(null);
    } catch (error) {
      toast.error(errorMessage(error, "No se pudo eliminar el cliente"));
    }
  };

  const filteredData = useMemo(() => {
    if (!data) return [];
    return data.filter((c) => matchesActiveFilter(activeFilter, c.active));
  }, [data, activeFilter]);

  const columns = useMemo<ColumnDef<Client>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Empresa",
        cell: ({ row }) => <IdentityCell name={row.original.name} />,
      },
      { accessorKey: "contactName", header: "Contacto" },
      { accessorKey: "username", header: "Usuario" },
      {
        accessorKey: "contactEmail",
        header: "Email contacto",
        cell: ({ row }) => <EmailCell email={row.original.contactEmail} />,
      },
      {
        accessorKey: "active",
        header: "Estado",
        cell: ({ row }) => <ActiveBadge active={row.original.active} />,
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
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Acciones</span>
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent>Acciones</TooltipContent>
                </Tooltip>
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

  const toolbarLeft = (
    <Button onClick={onCreate}>
      <Plus className="h-4 w-4" />
      Crear cliente
    </Button>
  );

  const toolbarRight = (
    <FilterPopover
      label="Estado"
      value={activeFilter}
      defaultValue="all"
      options={ACTIVE_FILTER_OPTIONS}
      onChange={setActiveFilter}
    />
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clientes"
        description="Gestiona los clientes que pueden solicitar reservas."
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

      <DataTable
        columns={columns}
        data={filteredData}
        isLoading={isLoading}
        searchPlaceholder="Buscar por empresa, contacto, usuario…"
        exportable
        exportFileName="clientes"
        toolbarLeft={toolbarLeft}
        toolbarRight={toolbarRight}
        emptyState={
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Users className="h-8 w-8" />
            <p className="text-sm">No hay clientes registrados.</p>
            <Button size="sm" onClick={onCreate}>
              <Plus className="h-4 w-4" />
              Crear cliente
            </Button>
          </div>
        }
      />

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
            <AlertDialogTitle>¿Eliminar cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará a{" "}
              <span className="font-semibold text-foreground">
                {deleting?.name}
              </span>
              . No se puede deshacer.
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
