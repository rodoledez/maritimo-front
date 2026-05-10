"use client";

import { useCallback, useMemo, useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { CalendarRange, FileSpreadsheet, MoreHorizontal, Plus } from "lucide-react";
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
import { StatusBadge } from "@/components/status-badge";
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
  useDeleteItinerary,
  useItineraries,
  useToggleItineraryActive,
  useConfirmItinerary,
} from "@/lib/hooks/use-itineraries";
import { errorMessage } from "@/lib/utils/errors";
import { formatDate } from "@/lib/utils/format";
import type { Itinerary } from "@/types/domain";

import { ItineraryFormDialog } from "./itinerary-form-dialog";
import { ItineraryImportDialog } from "./itinerary-import-dialog";

function ItineraryStatusBadge({ status }: { status?: Itinerary["status"] | null }) {
  if (status === "CO") {
    return <StatusBadge tone="success">Confirmado</StatusBadge>;
  }
  return <StatusBadge tone="pending">Por confirmar</StatusBadge>;
}

export default function ItinerariosPage() {
  const { data, isLoading, error, refetch, isFetching } = useItineraries();
  const toggleMutation = useToggleItineraryActive();
  const confirmMutation = useConfirmItinerary();
  const deleteMutation = useDeleteItinerary();

  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editing, setEditing] = useState<Itinerary | null>(null);
  const [deleting, setDeleting] = useState<Itinerary | null>(null);
  const [confirming, setConfirming] = useState<Itinerary | null>(null);
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");

  const filteredData = useMemo(() => {
    if (!data) return [];
    return data.filter((i) => matchesActiveFilter(activeFilter, i.active ?? true));
  }, [data, activeFilter]);

  const onCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const onEdit = useCallback((item: Itinerary) => {
    setEditing(item);
    setFormOpen(true);
  }, []);
  const onToggle = useCallback(
    async (item: Itinerary) => {
      try {
        await toggleMutation.mutateAsync({
          id: item.id,
          active: item.active ?? true,
        });
        toast.success(
          item.active ? "Itinerario desactivado" : "Itinerario activado"
        );
      } catch (e) {
        toast.error(errorMessage(e, "No se pudo cambiar el estado"));
      }
    },
    [toggleMutation]
  );
  const confirmConfirm = async () => {
    if (!confirming) return;
    try {
      await confirmMutation.mutateAsync(confirming.id);
      toast.success("Itinerario confirmado");
      setConfirming(null);
    } catch (e) {
      toast.error(errorMessage(e, "No se pudo confirmar"));
    }
  };
  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await deleteMutation.mutateAsync(deleting.id);
      toast.success("Itinerario eliminado");
      setDeleting(null);
    } catch (e) {
      toast.error(errorMessage(e, "No se pudo eliminar"));
    }
  };

  const columns = useMemo<ColumnDef<Itinerary>[]>(
    () => [
      { accessorKey: "id", header: "ID", meta: { align: "right" } },
      { accessorKey: "weekNo", header: "Sem", meta: { align: "right" } },
      { accessorKey: "carrier", header: "Naviera" },
      { accessorKey: "containerShip", header: "M/N" },
      { accessorKey: "tripNo", header: "Viaje" },
      { accessorKey: "portDeparture", header: "Pto. Zarpe" },
      { accessorKey: "portDestination", header: "Pto. Destino" },
      { accessorKey: "countryDestination", header: "País" },
      {
        accessorKey: "etd",
        header: "ETD",
        cell: ({ row }) => formatDate(row.original.etd),
        meta: { align: "right" },
      },
      {
        accessorKey: "eta",
        header: "ETA",
        cell: ({ row }) => formatDate(row.original.eta),
        meta: { align: "right" },
      },
      {
        accessorKey: "transitTime",
        header: "Tránsito",
        cell: ({ row }) =>
          typeof row.original.transitTime === "number"
            ? `${row.original.transitTime} días`
            : "—",
        meta: { align: "right" },
      },
      {
        accessorKey: "active",
        header: "Activo",
        cell: ({ row }) => <ActiveBadge active={row.original.active} />,
      },
      {
        accessorKey: "status",
        header: "Estado",
        cell: ({ row }) => <ItineraryStatusBadge status={row.original.status} />,
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Acciones</span>,
        enableSorting: false,
        cell: ({ row }) => {
          const item = row.original;
          const canConfirm = item.status !== "CO";
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
                  <DropdownMenuItem
                    onClick={() => setConfirming(item)}
                    disabled={!canConfirm}
                    className="text-brand-success focus:text-brand-success"
                  >
                    Confirmar
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
        title="Itinerarios"
        description="Catálogo de viajes marítimos por semana."
      />
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>No se pudieron cargar los itinerarios</AlertTitle>
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
        searchPlaceholder="Buscar por naviera, M/N, puerto…"
        toolbarLeft={
          <>
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              <FileSpreadsheet className="h-4 w-4" />
              Importar Excel
            </Button>
            <Button onClick={onCreate}>
              <Plus className="h-4 w-4" />
              Crear itinerario
            </Button>
          </>
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
            <CalendarRange className="h-8 w-8" />
            <p className="text-sm">No hay itinerarios registrados.</p>
            <Button size="sm" onClick={onCreate}>
              <Plus className="h-4 w-4" />
              Crear itinerario
            </Button>
          </div>
        }
      />

      <ItineraryFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editing={editing}
      />
      <ItineraryImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
      />

      <AlertDialog
        open={!!confirming}
        onOpenChange={(open) => !open && setConfirming(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar itinerario?</AlertDialogTitle>
            <AlertDialogDescription>
              Se confirmará el itinerario de la semana {confirming?.weekNo} (
              {confirming?.carrier}).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmConfirm}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar itinerario?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará el itinerario sem {deleting?.weekNo} (
              {deleting?.carrier}).
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
