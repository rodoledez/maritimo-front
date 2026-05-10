"use client";

import { useCallback, useMemo, useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Anchor, Check, MoreHorizontal, Plus, X } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table/data-table";
import { ActiveBadge } from "@/components/data-table/active-cell";
import {
  ACTIVE_FILTER_OPTIONS,
  FilterPopover,
  matchesActiveFilter,
  type ActiveFilter,
} from "@/components/data-table/filter-popover";
import { IdentityCell } from "@/components/data-table/identity-cell";
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
import { useCountries } from "@/lib/hooks/use-countries";
import {
  useDeletePort,
  usePorts,
  useUpdatePort,
} from "@/lib/hooks/use-ports";
import { errorMessage } from "@/lib/utils/errors";
import type { Port } from "@/types/domain";

import { PortFormDialog } from "./port-form-dialog";

function BoolIcon({ value }: { value: boolean }) {
  return value ? (
    <Check className="h-4 w-4 text-brand-success" />
  ) : (
    <X className="h-4 w-4 text-muted-foreground" />
  );
}

export default function PortsPage() {
  const { data, isLoading, error, refetch, isFetching } = usePorts();
  const { data: countries = [] } = useCountries();
  const updateMutation = useUpdatePort();
  const deleteMutation = useDeletePort();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Port | null>(null);
  const [deleting, setDeleting] = useState<Port | null>(null);
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");

  const filteredData = useMemo(() => {
    if (!data) return [];
    return data.filter((p) => matchesActiveFilter(activeFilter, p.active));
  }, [data, activeFilter]);

  const countryById = useMemo(
    () => new Map(countries.map((c) => [String(c.id), c.name])),
    [countries]
  );

  const onCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const onEdit = useCallback((item: Port) => {
    setEditing(item);
    setFormOpen(true);
  }, []);
  const onToggle = useCallback(
    async (item: Port) => {
      try {
        await updateMutation.mutateAsync({
          id: item.id,
          payload: { active: !item.active },
        });
        toast.success(item.active ? "Puerto desactivado" : "Puerto activado");
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
      toast.success("Puerto eliminado");
      setDeleting(null);
    } catch (e) {
      toast.error(errorMessage(e, "No se pudo eliminar"));
    }
  };

  const columns = useMemo<ColumnDef<Port>[]>(
    () => [
      { accessorKey: "id", header: "ID" },
      {
        accessorKey: "name",
        header: "Nombre",
        cell: ({ row }) => <IdentityCell name={row.original.name} />,
      },
      {
        accessorKey: "countryId",
        header: "País",
        cell: ({ row }) => {
          const fromRel = row.original.Country?.name;
          const fromMap = row.original.countryId
            ? countryById.get(String(row.original.countryId))
            : null;
          return fromRel ?? fromMap ?? "—";
        },
      },
      {
        accessorKey: "isOrigin",
        header: "Origen",
        cell: ({ row }) => <BoolIcon value={!!row.original.isOrigin} />,
      },
      {
        accessorKey: "isDestination",
        header: "Destino",
        cell: ({ row }) => <BoolIcon value={!!row.original.isDestination} />,
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
          const item = row.original;
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
    [onEdit, onToggle, countryById]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Puertos"
        description="Catálogo de puertos de origen y destino."
      />
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>No se pudieron cargar los puertos</AlertTitle>
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
        data={filteredData}
        isLoading={isLoading}
        searchPlaceholder="Buscar por nombre…"
        toolbarLeft={
          <Button onClick={onCreate}>
            <Plus className="h-4 w-4" />
            Crear puerto
          </Button>
        }
        toolbarRight={
          <FilterPopover
            label="Estado"
            value={activeFilter}
            defaultValue="all"
            options={ACTIVE_FILTER_OPTIONS}
            onChange={setActiveFilter}
          />
        }
        emptyState={
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Anchor className="h-8 w-8" />
            <p className="text-sm">No hay puertos registrados.</p>
            <Button size="sm" onClick={onCreate}>
              <Plus className="h-4 w-4" />
              Crear puerto
            </Button>
          </div>
        }
      />
      <PortFormDialog
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
            <AlertDialogTitle>¿Eliminar puerto?</AlertDialogTitle>
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
