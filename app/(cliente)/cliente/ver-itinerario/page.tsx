"use client";

import { useMemo } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { CalendarRange } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table/data-table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useItineraries } from "@/lib/hooks/use-itineraries";
import { errorMessage } from "@/lib/utils/errors";
import { assocLabel, formatDate } from "@/lib/utils/format";
import type { Itinerary } from "@/types/domain";

export default function VerItinerarioPage() {
  const { data, isLoading, error, refetch, isFetching } = useItineraries({
    vigent: "Y",
  });

  const columns = useMemo<ColumnDef<Itinerary>[]>(
    () => [
      { accessorKey: "weekNo", header: "Semana" },
      { accessorKey: "carrier", header: "Naviera" },
      { accessorKey: "containerShip", header: "M/N" },
      { accessorKey: "tripNo", header: "Viaje" },
      {
        id: "portDeparture",
        header: "Pto. Zarpe",
        accessorFn: (row) => assocLabel(row.portDeparture),
      },
      {
        id: "portDestination",
        header: "Pto. Destino",
        accessorFn: (row) => assocLabel(row.portDestination),
      },
      {
        id: "countryDestination",
        header: "País destino",
        accessorFn: (row) => assocLabel(row.countryDestination),
      },
      {
        accessorKey: "etd",
        header: "ETD",
        cell: ({ row }) => formatDate(row.original.etd),
      },
      {
        accessorKey: "eta",
        header: "ETA",
        cell: ({ row }) => formatDate(row.original.eta),
      },
      {
        accessorKey: "transitTime",
        header: "Tránsito",
        cell: ({ row }) =>
          typeof row.original.transitTime === "number"
            ? `${row.original.transitTime} días`
            : "—",
      },
      { accessorKey: "stacking", header: "Stacking" },
      { accessorKey: "documentClosure", header: "Corte doc." },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ver itinerario"
        description="Itinerarios marítimos vigentes."
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
        data={data ?? []}
        isLoading={isLoading}
        searchPlaceholder="Buscar por naviera, M/N, puerto…"
        emptyState={
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <CalendarRange className="h-8 w-8" />
            <p className="text-sm">No hay itinerarios disponibles.</p>
          </div>
        }
      />
    </div>
  );
}
