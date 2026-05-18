"use client";

import { useCallback, useMemo, useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Loader2, MapPin, MoreHorizontal, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table/data-table";
import {
  FilterPopover,
  type FilterOption,
} from "@/components/data-table/filter-popover";
import { IdentityCell } from "@/components/data-table/identity-cell";
import { StatusBadge } from "@/components/status-badge";
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
import {
  useDeleteShipmentTracking,
  useRefreshShipmentTracking,
  useShipmentsTracking,
  useSyncShipmentsTracking,
} from "@/lib/hooks/use-shipments-tracking";
import { errorMessage } from "@/lib/utils/errors";
import { formatDate } from "@/lib/utils/format";
import type { ShipmentTracking, ShipmentTrackingStatus } from "@/types/domain";

import {
  shipmentStatusLabel,
  shipmentStatusTone,
} from "./_status";
import { TrackingDetailDialog } from "./tracking-detail-dialog";
import { TrackingFormDialog } from "./tracking-form-dialog";

type StatusFilter = "all" | ShipmentTrackingStatus;

const STATUS_OPTIONS: FilterOption<StatusFilter>[] = [
  { value: "all", label: "Todos" },
  { value: "NEW", label: "Nuevos" },
  { value: "INPROGRESS", label: "En proceso" },
  { value: "BOOKED", label: "Reservados" },
  { value: "LOADED", label: "Cargados" },
  { value: "SAILING", label: "Navegando" },
  { value: "ARRIVED", label: "Llegados" },
  { value: "DISCHARGED", label: "Descargados" },
  { value: "UNTRACKED", label: "Sin tracking" },
];

export default function ShipmentsTrackingPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const { data, isLoading, error, refetch, isFetching } = useShipmentsTracking(
    statusFilter === "all" ? {} : { status: statusFilter }
  );
  const refreshMutation = useRefreshShipmentTracking();
  const deleteMutation = useDeleteShipmentTracking();
  const syncMutation = useSyncShipmentsTracking();

  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<ShipmentTracking | null>(null);
  const [detail, setDetail] = useState<ShipmentTracking | null>(null);

  const onCreate = () => setFormOpen(true);

  const onSync = async () => {
    try {
      const result = await syncMutation.mutateAsync();
      toast.success(
        `Sincronización: ${result.fetched} traídos · ${result.created} creados · ${result.updated} actualizados`
      );
    } catch (e) {
      toast.error(errorMessage(e, "No se pudo sincronizar con ShipsGo"));
    }
  };

  const onView = useCallback((item: ShipmentTracking) => {
    setDetail(item);
  }, []);

  const onRefresh = useCallback(
    async (item: ShipmentTracking) => {
      try {
        await refreshMutation.mutateAsync(item.id);
        toast.success("Tracking actualizado desde ShipsGo");
      } catch (e) {
        toast.error(errorMessage(e, "No se pudo refrescar el tracking"));
      }
    },
    [refreshMutation]
  );

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await deleteMutation.mutateAsync(deleting.id);
      toast.success("Tracking eliminado");
      setDeleting(null);
    } catch (e) {
      toast.error(errorMessage(e, "No se pudo eliminar el tracking"));
    }
  };

  const columns = useMemo<ColumnDef<ShipmentTracking>[]>(
    () => [
      { accessorKey: "id", header: "ID", meta: { align: "right" } },
      {
        accessorKey: "reference",
        header: "Referencia",
        cell: ({ row }) => {
          const t = row.original;
          const label =
            t.reference ||
            t.bookingNumber ||
            (t.bookingId !== null ? `Booking #${t.bookingId}` : `ShipsGo ${t.shipsgoId}`);
          return (
            <div className="flex flex-col gap-0.5">
              <IdentityCell name={label} />
              {t.bookingId === null ? (
                <span className="ml-9 text-xs text-muted-foreground">
                  Sin booking local
                </span>
              ) : null}
            </div>
          );
        },
      },
      {
        accessorKey: "carrierScac",
        header: "SCAC",
        cell: ({ row }) => (
          <span className="font-mono text-xs">
            {row.original.carrierScac ?? "—"}
          </span>
        ),
      },
      {
        accessorKey: "containerNumber",
        header: "Contenedor",
        cell: ({ row }) => {
          const t = row.original;
          if (!t.containerNumber) return "—";
          return (
            <div className="flex items-center gap-1">
              <span className="font-mono text-xs">{t.containerNumber}</span>
              {t.containerCount && t.containerCount > 1 ? (
                <span className="text-xs text-muted-foreground">
                  +{t.containerCount - 1}
                </span>
              ) : null}
            </div>
          );
        },
      },
      {
        accessorKey: "currentVessel",
        header: "M/N · Viaje",
        cell: ({ row }) => {
          const t = row.original;
          if (!t.currentVessel && !t.currentVoyage) return "—";
          return [t.currentVessel, t.currentVoyage].filter(Boolean).join(" · ");
        },
      },
      {
        accessorKey: "portOfLoading",
        header: "POL → POD",
        cell: ({ row }) => {
          const t = row.original;
          const pol = t.polCode ?? t.portOfLoading;
          const pod = t.podCode ?? t.portOfDischarge;
          if (!pol && !pod) return "—";
          return (
            <span className="font-mono text-xs">
              {pol ?? "—"} → {pod ?? "—"}
            </span>
          );
        },
      },
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
        accessorKey: "transitPercentage",
        header: "Progreso",
        cell: ({ row }) => {
          const p = row.original.transitPercentage;
          if (p === null || p === undefined) return "—";
          return (
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary"
                  style={{ width: `${Math.min(100, Math.max(0, p))}%` }}
                />
              </div>
              <span className="tabular-nums text-xs text-muted-foreground">
                {Math.round(p)}%
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Estado",
        cell: ({ row }) => (
          <StatusBadge tone={shipmentStatusTone(row.original.status)} icon={null}>
            {shipmentStatusLabel(row.original.status)}
          </StatusBadge>
        ),
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Acciones</span>,
        enableSorting: false,
        cell: ({ row }) => {
          const item = row.original;
          const mapUrl =
            item.mapToken && item.shipsgoId
              ? `https://map.shipsgo.com/ocean/shipments/${item.shipsgoId}?token=${item.mapToken}`
              : null;
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
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => onView(item)}>
                    Ver detalle
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onRefresh(item)}
                    disabled={refreshMutation.isPending}
                  >
                    <RefreshCw className="h-4 w-4" />
                    Refrescar desde ShipsGo
                  </DropdownMenuItem>
                  {mapUrl ? (
                    <DropdownMenuItem asChild>
                      <a
                        href={mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <MapPin className="h-4 w-4" />
                        Ver mapa en ShipsGo
                      </a>
                    </DropdownMenuItem>
                  ) : null}
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
    [onView, onRefresh, refreshMutation.isPending]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tracking de envíos"
        description="Seguimiento de bookings vía ShipsGo (carrier · contenedor · ETA · vessel)."
      />

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>No se pudo cargar el tracking</AlertTitle>
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
        data={data ?? []}
        isLoading={isLoading}
        searchPlaceholder="Buscar por referencia, contenedor, M/N…"
        toolbarLeft={
          <>
            <Button onClick={onCreate}>
              <Plus className="h-4 w-4" />
              Registrar tracking
            </Button>
            <Button
              variant="outline"
              onClick={onSync}
              disabled={syncMutation.isPending}
            >
              {syncMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sincronizando…
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Sincronizar ShipsGo
                </>
              )}
            </Button>
          </>
        }
        toolbarRight={
          <FilterPopover
            label="Estado"
            value={statusFilter}
            defaultValue="all"
            options={STATUS_OPTIONS}
            onChange={setStatusFilter}
          />
        }
        emptyState={
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <MapPin className="h-8 w-8" />
            <p className="text-sm">No hay envíos en tracking.</p>
            <Button size="sm" onClick={onCreate}>
              <Plus className="h-4 w-4" />
              Registrar tracking
            </Button>
          </div>
        }
      />

      <TrackingFormDialog open={formOpen} onOpenChange={setFormOpen} />

      <TrackingDetailDialog
        open={!!detail}
        onOpenChange={(open) => !open && setDetail(null)}
        tracking={detail}
      />

      <AlertDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar tracking?</AlertDialogTitle>
            <AlertDialogDescription>
              Se detendrá el seguimiento del shipment{" "}
              <span className="font-semibold text-foreground">
                ShipsGo #{deleting?.shipsgoId}
              </span>{" "}
              {deleting?.bookingId !== null && deleting?.bookingId !== undefined
                ? `(booking #${deleting.bookingId}) `
                : ""}
              y se eliminará en ShipsGo. Esta acción no se puede deshacer.
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
