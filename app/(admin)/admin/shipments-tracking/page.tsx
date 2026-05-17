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
import { StatusBadge, type StatusTone } from "@/components/status-badge";
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
import type { ShipmentTracking } from "@/types/domain";

import { TrackingDetailDialog } from "./tracking-detail-dialog";
import { TrackingFormDialog } from "./tracking-form-dialog";

type StatusFilter =
  | "all"
  | "Registrado"
  | "EnTransito"
  | "Llegado"
  | "Entregado"
  | "Error";

const STATUS_OPTIONS: FilterOption<StatusFilter>[] = [
  { value: "all", label: "Todos" },
  { value: "Registrado", label: "Registrados" },
  { value: "EnTransito", label: "En tránsito" },
  { value: "Llegado", label: "Llegados" },
  { value: "Entregado", label: "Entregados" },
  { value: "Error", label: "Con error" },
];

function statusTone(status?: string | null): StatusTone {
  switch (status) {
    case "Entregado":
    case "Llegado":
      return "success";
    case "EnTransito":
      return "warning";
    case "Registrado":
      return "pending";
    case "Error":
      return "danger";
    default:
      return "neutral";
  }
}

function statusLabel(status?: string | null): string {
  if (!status) return "—";
  if (status === "EnTransito") return "En tránsito";
  return status;
}

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
      await syncMutation.mutateAsync();
      toast.success("Trackings sincronizados desde ShipsGo");
    } catch (e) {
      toast.error(errorMessage(e, "No se pudo sincronizar con ShipsGo"));
    }
  };

  const onView = useCallback(
    (item: ShipmentTracking) => setDetail(item),
    []
  );

  const onRefresh = useCallback(
    async (item: ShipmentTracking) => {
      try {
        await refreshMutation.mutateAsync(item.bookingId);
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
        accessorKey: "bookingId",
        header: "Booking",
        cell: ({ row }) => {
          const b = row.original.Booking;
          const label =
            row.original.bookingNumber ||
            (b ? `#${b.id}${b.Client?.name ? ` · ${b.Client.name}` : ""}` : `#${row.original.bookingId}`);
          return <IdentityCell name={label} />;
        },
      },
      {
        accessorKey: "carrier",
        header: "Carrier",
        cell: ({ row }) =>
          row.original.carrierName ?? row.original.carrier ?? "—",
      },
      {
        accessorKey: "containerNumber",
        header: "Contenedor",
        cell: ({ row }) => (
          <span className="font-mono text-xs">
            {row.original.containerNumber ?? "—"}
          </span>
        ),
      },
      {
        accessorKey: "vessel",
        header: "M/N · Viaje",
        cell: ({ row }) => {
          const v = row.original.vessel;
          const t = row.original.voyageNo;
          if (!v && !t) return "—";
          return [v, t].filter(Boolean).join(" · ");
        },
      },
      {
        accessorKey: "portOfLoading",
        header: "POL → POD",
        cell: ({ row }) => {
          const pol = row.original.portOfLoading;
          const pod = row.original.portOfDischarge;
          if (!pol && !pod) return "—";
          return `${pol ?? "—"} → ${pod ?? "—"}`;
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
        accessorKey: "status",
        header: "Estado",
        cell: ({ row }) => (
          <StatusBadge tone={statusTone(row.original.status)} icon={null}>
            {statusLabel(row.original.status)}
          </StatusBadge>
        ),
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
                <DropdownMenuContent align="end" className="w-48">
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
        description="Seguimiento de bookings vía ShipsGo (carrier + contenedor + ETA)."
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
        searchPlaceholder="Buscar por contenedor, M/N, booking…"
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
              Se detendrá el seguimiento del booking{" "}
              <span className="font-semibold text-foreground">
                #{deleting?.bookingId}
              </span>{" "}
              y se eliminará el shipment en ShipsGo. Esta acción no se puede
              deshacer.
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
