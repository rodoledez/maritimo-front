"use client";

import { useCallback, useMemo, useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { ClipboardList, MoreHorizontal } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table/data-table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BookingStatusBadge } from "@/components/booking/status-badge";
import { useBookings } from "@/lib/hooks/use-bookings";
import { errorMessage } from "@/lib/utils/errors";
import type { Booking } from "@/types/domain";

import { BookingCancelDialog } from "./booking-cancel-dialog";
import { BookingConfirmDialog } from "./booking-confirm-dialog";
import { BookingDetailDialog } from "./booking-detail-dialog";
import { BookingEditDialog } from "./booking-edit-dialog";

export default function ReservasPage() {
  const { data, isLoading, error, refetch, isFetching } = useBookings();

  const [detail, setDetail] = useState<Booking | null>(null);
  const [editing, setEditing] = useState<Booking | null>(null);
  const [confirming, setConfirming] = useState<Booking | null>(null);
  const [cancelling, setCancelling] = useState<Booking | null>(null);

  const onView = useCallback((b: Booking) => setDetail(b), []);
  const onEdit = useCallback((b: Booking) => setEditing(b), []);
  const onConfirm = useCallback((b: Booking) => setConfirming(b), []);
  const onCancel = useCallback((b: Booking) => setCancelling(b), []);

  const columns = useMemo<ColumnDef<Booking>[]>(
    () => [
      { accessorKey: "id", header: "Nº" },
      {
        accessorKey: "status",
        header: "Estado",
        cell: ({ row }) => <BookingStatusBadge status={row.original.status} />,
      },
      {
        accessorKey: "Client.name",
        header: "Cliente",
        cell: ({ row }) => row.original.Client?.name ?? "—",
      },
      {
        accessorKey: "Itinerary.weekNo",
        header: "Sem",
        cell: ({ row }) => row.original.Itinerary?.weekNo ?? "—",
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
      { accessorKey: "qtyContainers", header: "Cont." },
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
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    [onView, onEdit, onConfirm, onCancel]
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
        data={data ?? []}
        isLoading={isLoading}
        searchPlaceholder="Buscar por cliente, naviera, especie…"
        emptyState={
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <ClipboardList className="h-8 w-8" />
            <p className="text-sm">No hay reservas registradas.</p>
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
