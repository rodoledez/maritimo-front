"use client";

import { useCallback, useMemo, useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Plus, Warehouse } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table/data-table";
import { ActiveBadge } from "@/components/data-table/active-cell";
import {
  ACTIVE_FILTER_OPTIONS,
  FilterPopover,
  type FilterOption,
  matchesActiveFilter,
  type ActiveFilter,
} from "@/components/data-table/filter-popover";
import { IdentityCell } from "@/components/data-table/identity-cell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useFacilities,
  useUpdateFacility,
} from "@/lib/hooks/use-facilities";
import { errorMessage } from "@/lib/utils/errors";
import type { Facility, FacilityType } from "@/types/domain";

import {
  FACILITY_TYPE_LABELS,
  FacilityFormDialog,
} from "./facility-form-dialog";

type TypeFilter = "all" | FacilityType;

const TYPE_FILTER_OPTIONS: FilterOption<TypeFilter>[] = [
  { value: "all", label: "Todos" },
  { value: "TERMINAL", label: FACILITY_TYPE_LABELS.TERMINAL },
  { value: "DEPOT", label: FACILITY_TYPE_LABELS.DEPOT },
];

export default function FacilitiesPage() {
  const { data, isLoading, error, refetch, isFetching } = useFacilities();
  const updateMutation = useUpdateFacility();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Facility | null>(null);
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");

  const filteredData = useMemo(() => {
    if (!data) return [];
    return data.filter((f) => {
      if (!matchesActiveFilter(activeFilter, f.active)) return false;
      if (typeFilter !== "all" && f.type !== typeFilter) return false;
      return true;
    });
  }, [data, activeFilter, typeFilter]);

  const onCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const onEdit = useCallback((item: Facility) => {
    setEditing(item);
    setFormOpen(true);
  }, []);
  const onToggle = useCallback(
    async (item: Facility) => {
      try {
        await updateMutation.mutateAsync({
          id: item.id,
          payload: { active: !item.active },
        });
        toast.success(
          item.active ? "Instalación desactivada" : "Instalación activada"
        );
      } catch (e) {
        toast.error(errorMessage(e, "No se pudo cambiar el estado"));
      }
    },
    [updateMutation]
  );

  const columns = useMemo<ColumnDef<Facility>[]>(
    () => [
      { accessorKey: "id", header: "ID", meta: { align: "right" } },
      {
        accessorKey: "name",
        header: "Nombre",
        cell: ({ row }) => <IdentityCell name={row.original.name} />,
      },
      {
        accessorKey: "type",
        header: "Tipo",
        cell: ({ row }) => (
          <Badge variant="outline" className="font-normal">
            {FACILITY_TYPE_LABELS[row.original.type] ?? row.original.type}
          </Badge>
        ),
      },
      {
        accessorKey: "city",
        header: "Ciudad",
        cell: ({ row }) => row.original.city ?? "—",
      },
      {
        accessorKey: "region",
        header: "Región",
        cell: ({ row }) => row.original.region ?? "—",
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
                  <DropdownMenuItem onClick={() => onEdit(item)}>
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onToggle(item)}>
                    {item.active ? "Desactivar" : "Activar"}
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
        title="Depósitos y terminales"
        description="Catálogo maestro de instalaciones usadas en Tracking, Booking y Operaciones. Las inactivas se ocultan de los nuevos ingresos pero se conservan en el historial."
      />
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>No se pudo cargar el catálogo</AlertTitle>
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
        searchPlaceholder="Buscar por nombre, ciudad, región…"
        toolbarLeft={
          <Button onClick={onCreate}>
            <Plus className="h-4 w-4" />
            Crear instalación
          </Button>
        }
        toolbarRight={
          <>
            <FilterPopover
              label="Tipo"
              value={typeFilter}
              defaultValue="all"
              options={TYPE_FILTER_OPTIONS}
              onChange={setTypeFilter}
              triggerLabel="Filtrar tipo"
            />
            <FilterPopover
              label="Estado"
              value={activeFilter}
              defaultValue="all"
              options={ACTIVE_FILTER_OPTIONS}
              onChange={setActiveFilter}
              triggerLabel="Filtrar estado"
            />
          </>
        }
        emptyState={
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Warehouse className="h-8 w-8" />
            <p className="text-sm">No hay instalaciones registradas.</p>
            <Button size="sm" onClick={onCreate}>
              <Plus className="h-4 w-4" />
              Crear instalación
            </Button>
          </div>
        }
      />
      <FacilityFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editing={editing}
      />
    </div>
  );
}
