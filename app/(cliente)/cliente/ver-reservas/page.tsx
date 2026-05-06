"use client";

import { useMemo, useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { ClipboardList, Eye } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table/data-table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { BookingStatusBadge } from "@/components/booking/status-badge";
import { BookingDetailDialog } from "@/app/(admin)/admin/reservas/booking-detail-dialog";
import { useAuth } from "@/lib/auth/auth-context";
import { useBookingsByClient } from "@/lib/hooks/use-bookings";
import { errorMessage } from "@/lib/utils/errors";
import { formatDate } from "@/lib/utils/format";
import type { Booking } from "@/types/domain";

export default function VerReservasPage() {
  const { user } = useAuth();
  const clientId = user?.Client?.id;
  const { data, isLoading, error, refetch, isFetching } =
    useBookingsByClient(clientId);
  const [detail, setDetail] = useState<Booking | null>(null);

  const columns = useMemo<ColumnDef<Booking>[]>(
    () => [
      { accessorKey: "id", header: "Nº reserva" },
      {
        accessorKey: "Itinerary.weekNo",
        header: "Semana",
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
      {
        accessorKey: "Itinerary.portDestination",
        header: "Pto. Destino",
        cell: ({ row }) => row.original.Itinerary?.portDestination ?? "—",
      },
      {
        accessorKey: "Itinerary.etd",
        header: "ETD",
        cell: ({ row }) => formatDate(row.original.Itinerary?.etd),
      },
      {
        accessorKey: "Itinerary.eta",
        header: "ETA",
        cell: ({ row }) => formatDate(row.original.Itinerary?.eta),
      },
      {
        accessorKey: "status",
        header: "Estado",
        cell: ({ row }) => <BookingStatusBadge status={row.original.status} />,
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Acciones</span>,
        enableSorting: false,
        cell: ({ row }) => (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setDetail(row.original)}
          >
            <Eye className="h-4 w-4" />
            Ver detalle
          </Button>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mis reservas"
        description="Listado de tus solicitudes de reserva."
      />
      {!clientId ? (
        <Alert>
          <AlertTitle>Sin cliente asociado</AlertTitle>
          <AlertDescription>
            Tu usuario no está asociado a un cliente. Contacta a soporte.
          </AlertDescription>
        </Alert>
      ) : null}
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
        searchPlaceholder="Buscar por naviera, viaje…"
        emptyState={
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <ClipboardList className="h-8 w-8" />
            <p className="text-sm">Aún no tienes reservas.</p>
          </div>
        }
      />
      <BookingDetailDialog
        open={!!detail}
        onOpenChange={(open) => !open && setDetail(null)}
        booking={detail}
      />
    </div>
  );
}
