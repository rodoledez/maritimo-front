"use client";

import { useCallback, useMemo, useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { CalendarClock, MoreHorizontal, Plus } from "lucide-react";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
import { useBookings } from "@/lib/hooks/use-bookings";
import { useClients } from "@/lib/hooks/use-clients";
import {
  useDeleteFreeDaysConfig,
  useFreeDaysConfigs,
} from "@/lib/hooks/use-notifications";
import { errorMessage } from "@/lib/utils/errors";
import type { FreeDaysConfig } from "@/types/domain";

import {
  FreeDaysFormDialog,
  type FreeDaysScope,
} from "./free-days-form-dialog";

function formatDays(value: number | null): string {
  if (value === null || value === undefined) return "—";
  return `${value}d`;
}

function formatHours(value: number | null): string {
  if (value === null || value === undefined) return "—";
  return `${value}h`;
}

export default function FreeDaysConfigPage() {
  const { data, isLoading, error, refetch, isFetching } = useFreeDaysConfigs({
    take: 100,
  });
  const { data: clients = [] } = useClients();
  const { data: bookings = [] } = useBookings();
  const deleteMutation = useDeleteFreeDaysConfig();

  const [tab, setTab] = useState<FreeDaysScope>("client");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<FreeDaysConfig | null>(null);
  const [deleting, setDeleting] = useState<FreeDaysConfig | null>(null);

  const clientNameById = useMemo(() => {
    const map = new Map<number, string>();
    for (const c of clients) {
      map.set(Number(c.id), c.name);
    }
    return map;
  }, [clients]);

  const bookingLabelById = useMemo(() => {
    const map = new Map<number, string>();
    for (const b of bookings) {
      const label = b.booking
        ? `${b.booking}${b.Client?.name ? ` · ${b.Client.name}` : ""}`
        : `Booking #${b.id}${b.Client?.name ? ` · ${b.Client.name}` : ""}`;
      map.set(Number(b.id), label);
    }
    return map;
  }, [bookings]);

  const clientRows = useMemo(
    () => (data?.rows ?? []).filter((r) => r.clientId !== null),
    [data]
  );
  const bookingRows = useMemo(
    () => (data?.rows ?? []).filter((r) => r.bookingId !== null),
    [data]
  );

  const onCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const onEdit = useCallback((r: FreeDaysConfig) => {
    setEditing(r);
    setFormOpen(true);
  }, []);
  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await deleteMutation.mutateAsync(deleting.id);
      toast.success("Configuración eliminada");
      setDeleting(null);
    } catch (e) {
      toast.error(errorMessage(e, "No se pudo eliminar la configuración"));
    }
  };

  const scopeColumn = useCallback(
    (
      kind: FreeDaysScope
    ): ColumnDef<FreeDaysConfig> => ({
      accessorKey: kind === "client" ? "clientId" : "bookingId",
      header: kind === "client" ? "Cliente" : "Booking",
      cell: ({ row }) => {
        if (kind === "client") {
          const cid = row.original.clientId;
          if (cid === null) return "—";
          return (
            <span className="text-sm font-medium">
              {clientNameById.get(Number(cid)) ?? `Cliente #${cid}`}
            </span>
          );
        }
        const bid = row.original.bookingId;
        if (bid === null) return "—";
        return (
          <span className="text-sm font-medium">
            {bookingLabelById.get(Number(bid)) ?? `Booking #${bid}`}
          </span>
        );
      },
    }),
    [clientNameById, bookingLabelById]
  );

  const buildColumns = useCallback(
    (kind: FreeDaysScope): ColumnDef<FreeDaysConfig>[] => [
      scopeColumn(kind),
      {
        accessorKey: "demurrageDays",
        header: "Demurrage",
        cell: ({ row }) => (
          <span className="font-mono text-xs">
            {formatDays(row.original.demurrageDays)} ·{" "}
            {formatHours(row.original.demurrageAlertHours)}
          </span>
        ),
      },
      {
        accessorKey: "detentionDays",
        header: "Detention",
        cell: ({ row }) => (
          <span className="font-mono text-xs">
            {formatDays(row.original.detentionDays)} ·{" "}
            {formatHours(row.original.detentionAlertHours)}
          </span>
        ),
      },
      {
        accessorKey: "reeferPlugInDays",
        header: "Reefer",
        cell: ({ row }) => (
          <span className="font-mono text-xs">
            {formatDays(row.original.reeferPlugInDays)} ·{" "}
            {formatHours(row.original.reeferAlertHours)}
          </span>
        ),
      },
      {
        accessorKey: "isActive",
        header: "Estado",
        cell: ({ row }) => <ActiveBadge active={row.original.isActive} />,
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Acciones</span>,
        enableSorting: false,
        cell: ({ row }) => {
          const r = row.original;
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
                  <DropdownMenuItem onClick={() => onEdit(r)}>
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => setDeleting(r)}
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
    [scopeColumn, onEdit]
  );

  const clientColumns = useMemo(() => buildColumns("client"), [buildColumns]);
  const bookingColumns = useMemo(() => buildColumns("booking"), [buildColumns]);

  const toolbarLeft = (
    <Button onClick={onCreate}>
      <Plus className="h-4 w-4" />
      Crear configuración
    </Button>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Free days"
        description="Días libres y frecuencia de alertas (demurrage, detention y reefer plug-in) por cliente o por booking. El booking override gana sobre el default del cliente."
      />

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>No se pudo cargar la configuración</AlertTitle>
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

      <Tabs value={tab} onValueChange={(v) => setTab(v as FreeDaysScope)}>
        <TabsList>
          <TabsTrigger value="client">
            Por cliente ({clientRows.length})
          </TabsTrigger>
          <TabsTrigger value="booking">
            Por booking ({bookingRows.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="client" className="mt-4">
          <DataTable
            columns={clientColumns}
            data={clientRows}
            isLoading={isLoading}
            searchPlaceholder="Buscar por cliente…"
            toolbarLeft={toolbarLeft}
            emptyState={
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <CalendarClock className="h-8 w-8" />
                <p className="text-sm">
                  No hay configuraciones por cliente.
                </p>
                <Button size="sm" onClick={onCreate}>
                  <Plus className="h-4 w-4" />
                  Crear configuración
                </Button>
              </div>
            }
          />
        </TabsContent>
        <TabsContent value="booking" className="mt-4">
          <DataTable
            columns={bookingColumns}
            data={bookingRows}
            isLoading={isLoading}
            searchPlaceholder="Buscar por booking…"
            toolbarLeft={toolbarLeft}
            emptyState={
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <CalendarClock className="h-8 w-8" />
                <p className="text-sm">No hay overrides por booking.</p>
                <Button size="sm" onClick={onCreate}>
                  <Plus className="h-4 w-4" />
                  Crear override
                </Button>
              </div>
            }
          />
        </TabsContent>
      </Tabs>

      <FreeDaysFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        initialScope={tab}
        editing={editing}
      />

      <AlertDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar configuración?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará la configuración de free days
              {deleting?.clientId !== null && deleting
                ? ` para ${clientNameById.get(Number(deleting.clientId)) ?? `cliente #${deleting.clientId}`}`
                : deleting?.bookingId !== null && deleting
                  ? ` para ${bookingLabelById.get(Number(deleting.bookingId)) ?? `booking #${deleting.bookingId}`}`
                  : ""}
              . No se puede deshacer.
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
