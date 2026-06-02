"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { type ColumnDef } from "@tanstack/react-table";
import { Bell, ClipboardList, MoreHorizontal, Plus } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table/data-table";
import {
  FilterPopover,
  type FilterOption,
} from "@/components/data-table/filter-popover";
import { IdentityCell } from "@/components/data-table/identity-cell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { BookingStatusBadge } from "@/components/booking/status-badge";
import { useBookings } from "@/lib/hooks/use-bookings";
import { useTriggerBookingNotification } from "@/lib/hooks/use-notifications";
import { errorMessage } from "@/lib/utils/errors";
import type { Booking } from "@/types/domain";

import { BookingCancelDialog } from "./booking-cancel-dialog";
import { BookingConfirmDialog } from "./booking-confirm-dialog";
import { BookingDetailDialog } from "./booking-detail-dialog";
import { BookingEditDialog } from "./booking-edit-dialog";

type BookingFilter = "all" | "Pendiente" | "Confirmado" | "Cancelado";

const BOOKING_FILTER_OPTIONS: FilterOption<BookingFilter>[] = [
  { value: "all", label: "Todas" },
  { value: "Pendiente", label: "Pendientes" },
  { value: "Confirmado", label: "Confirmadas" },
  { value: "Cancelado", label: "Canceladas" },
];

export default function ReservasPage() {
  const { data, isLoading, error, refetch, isFetching } = useBookings();

  const [detail, setDetail] = useState<Booking | null>(null);
  const [editing, setEditing] = useState<Booking | null>(null);
  const [confirming, setConfirming] = useState<Booking | null>(null);
  const [cancelling, setCancelling] = useState<Booking | null>(null);
  const [statusFilter, setStatusFilter] = useState<BookingFilter>("all");

  const triggerMutation = useTriggerBookingNotification();

  const onView = useCallback((b: Booking) => setDetail(b), []);
  const onEdit = useCallback((b: Booking) => setEditing(b), []);
  const onConfirm = useCallback((b: Booking) => setConfirming(b), []);
  const onCancel = useCallback((b: Booking) => setCancelling(b), []);
  const onNotify = useCallback(
    async (b: Booking) => {
      try {
        const result = await triggerMutation.mutateAsync(b.id);
        const summary = `${result.sent} enviadas · ${result.skipped} omitidas · ${result.failed} fallidas`;
        if (result.failed > 0) {
          toast.warning(`Reserva #${b.id}: ${summary}`);
        } else if (result.sent === 0 && result.skipped > 0) {
          toast.info(`Reserva #${b.id}: ${summary}`);
        } else {
          toast.success(`Reserva #${b.id}: ${summary}`);
        }
      } catch (e) {
        toast.error(errorMessage(e, "No se pudo enviar la notificación"));
      }
    },
    [triggerMutation]
  );

  const filteredData = useMemo(() => {
    if (!data) return [];
    if (statusFilter === "all") return data;
    return data.filter((b) => b.status === statusFilter);
  }, [data, statusFilter]);

  const columns = useMemo<ColumnDef<Booking>[]>(
    () => [
      { accessorKey: "id", header: "Nº", meta: { align: "right" } },
      {
        accessorKey: "status",
        header: "Estado",
        cell: ({ row }) => <BookingStatusBadge status={row.original.status} />,
      },
      {
        accessorKey: "Client.name",
        header: "Cliente",
        cell: ({ row }) => <IdentityCell name={row.original.Client?.name} />,
      },
      {
        accessorKey: "Itinerary.weekNo",
        header: "Sem",
        cell: ({ row }) => row.original.Itinerary?.weekNo ?? "—",
        meta: { align: "right" },
      },
      {
        accessorKey: "Itinerary.carrier",
        header: "Naviera",
        cell: ({ row }) => row.original.Itinerary?.carrier ?? "—",
      },
      {
        accessorKey: "Itinerary.containerShip",
        header: "M/N",
        cell: ({ row }) => row.original.Itinerary?.containerShip ?? "—",
      },
      {
        accessorKey: "Itinerary.tripNo",
        header: "Viaje",
        cell: ({ row }) => row.original.Itinerary?.tripNo ?? "—",
      },
      { accessorKey: "specie", header: "Especie" },
      { accessorKey: "qtyContainers", header: "Cont.", meta: { align: "right" } },
      {
        accessorKey: "typeContainer",
        header: "Tipo cont.",
        cell: ({ row }) =>
          row.original.typeContainer ?? row.original.typeContainerEntity ?? "—",
      },
      { accessorKey: "typeFreight", header: "Flete" },
      {
        id: "actions",
        header: () => <span className="sr-only">Acciones</span>,
        enableSorting: false,
        cell: ({ row }) => {
          const b = row.original;
          const isPending = b.status === "Pendiente";
          const isConfirmed = b.status === "Confirmado";
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
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem onClick={() => onView(b)}>
                    Ver detalle
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onEdit(b)}
                    disabled={!isPending}
                  >
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onConfirm(b)}
                    disabled={!isPending}
                    className="text-brand-success focus:text-brand-success"
                  >
                    Confirmar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onCancel(b)}
                    disabled={!isPending}
                    className="text-destructive focus:text-destructive"
                  >
                    Cancelar
                  </DropdownMenuItem>
                  {isConfirmed ? (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onNotify(b)}
                        disabled={triggerMutation.isPending}
                      >
                        <Bell className="h-4 w-4" />
                        Enviar notificación
                      </DropdownMenuItem>
                    </>
                  ) : null}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [onView, onEdit, onConfirm, onCancel, onNotify, triggerMutation.isPending]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reservas"
        description="Gestión de bookings marítimos."
      />
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>No se pudieron cargar las reservas</AlertTitle>
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
        searchPlaceholder="Buscar por cliente, naviera, especie…"
        toolbarLeft={
          <Button asChild>
            <Link href="/admin/reservas/crear">
              <Plus className="h-4 w-4" />
              Crear reserva
            </Link>
          </Button>
        }
        toolbarRight={
          <FilterPopover
            label="Estado"
            value={statusFilter}
            defaultValue="all"
            options={BOOKING_FILTER_OPTIONS}
            onChange={setStatusFilter}
          />
        }
        emptyState={
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <ClipboardList className="h-8 w-8" />
            <p className="text-sm">No hay reservas registradas.</p>
            <Button asChild size="sm">
              <Link href="/admin/reservas/crear">
                <Plus className="h-4 w-4" />
                Crear reserva
              </Link>
            </Button>
          </div>
        }
      />

      <BookingDetailDialog
        open={!!detail}
        onOpenChange={(open) => !open && setDetail(null)}
        booking={detail}
      />
      <BookingEditDialog
        open={!!editing}
        onOpenChange={(open) => !open && setEditing(null)}
        booking={editing}
      />
      <BookingConfirmDialog
        open={!!confirming}
        onOpenChange={(open) => !open && setConfirming(null)}
        booking={confirming}
      />
      <BookingCancelDialog
        open={!!cancelling}
        onOpenChange={(open) => !open && setCancelling(null)}
        booking={cancelling}
      />
    </div>
  );
}
