"use client";

import { useCallback, useMemo, useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Plus, Ship } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useDeleteShippingCompany,
  useShippingCompanies,
  useUpdateShippingCompany,
} from "@/lib/hooks/use-shipping-companies";
import { errorMessage } from "@/lib/utils/errors";
import type { ShippingCompany } from "@/types/domain";

import { ShippingCompanyFormDialog } from "./shipping-company-form-dialog";

export default function ShippingCompaniesPage() {
  const { data, isLoading, error, refetch, isFetching } = useShippingCompanies();
  const updateMutation = useUpdateShippingCompany();
  const deleteMutation = useDeleteShippingCompany();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ShippingCompany | null>(null);
  const [deleting, setDeleting] = useState<ShippingCompany | null>(null);

  const onCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const onEdit = useCallback((item: ShippingCompany) => {
    setEditing(item);
    setFormOpen(true);
  }, []);
  const onToggle = useCallback(
    async (item: ShippingCompany) => {
      try {
        await updateMutation.mutateAsync({
          id: item.id,
          payload: { active: !item.active },
        });
        toast.success(item.active ? "Naviera desactivada" : "Naviera activada");
      } catch (e) {
        toast.error(errorMessage(e, "No se pudo cambiar el estado"));
      }
    },
    [updateMutation]
  );
  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await deleteMutation.mutateAsync(deleting.id);
      toast.success("Naviera eliminada");
      setDeleting(null);
    } catch (e) {
      toast.error(errorMessage(e, "No se pudo eliminar"));
    }
  };

  const columns = useMemo<ColumnDef<ShippingCompany>[]>(
    () => [
      { accessorKey: "id", header: "ID" },
      {
        accessorKey: "name",
        header: "Nombre",
        cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
      },
      { accessorKey: "email", header: "Email" },
      { accessorKey: "phone", header: "Teléfono" },
      { accessorKey: "contactPerson", header: "Persona de contacto" },
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
          const item = row.original;
          return (
            <div className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem onClick={() => onEdit(item)}>Editar</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onToggle(item)}>
                    {item.active ? "Desactivar" : "Activar"}
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
        title="Navieras"
        description="Catálogo de líneas navieras."
        actions={
          <Button onClick={onCreate}>
            <Plus className="h-4 w-4" />
            Crear naviera
          </Button>
        }
      />
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>No se pudieron cargar las navieras</AlertTitle>
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
        searchPlaceholder="Buscar por nombre, contacto, email…"
        emptyState={
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Ship className="h-8 w-8" />
            <p className="text-sm">No hay navieras registradas.</p>
            <Button size="sm" onClick={onCreate}>
              <Plus className="h-4 w-4" />
              Crear naviera
            </Button>
          </div>
        }
      />
      <ShippingCompanyFormDialog
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
            <AlertDialogTitle>¿Eliminar naviera?</AlertDialogTitle>
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
