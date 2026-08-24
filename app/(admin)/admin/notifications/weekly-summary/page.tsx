"use client";

import { useCallback, useMemo, useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { CalendarClock, Info, MoreHorizontal, Play, Plus } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table/data-table";
import {
  FilterPopover,
  type FilterOption,
} from "@/components/data-table/filter-popover";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useClients } from "@/lib/hooks/use-clients";
import {
  useDeleteWeeklySummarySchedule,
  useSendWeeklySummary,
  useUpdateWeeklySummarySchedule,
  useWeeklySummarySchedules,
} from "@/lib/hooks/use-weekly-summary";
import {
  parseLastResult,
  scheduleSlotLabel,
  weeklySummaryStatusLabel,
  weeklySummaryStatusTone,
} from "@/lib/notifications/weekly-summary";
import { errorMessage } from "@/lib/utils/errors";
import { formatDateTimeInZone } from "@/lib/utils/format";
import type { WeeklySummarySchedule } from "@/types/domain";

import { WeeklySummaryPreviewDialog } from "./preview-dialog";
import { RunTickDialog } from "./run-tick-dialog";
import { ScheduleFormDialog } from "./schedule-form-dialog";

type StateFilter = "all" | "active" | "paused";

const STATE_OPTIONS: FilterOption<StateFilter>[] = [
  { value: "all", label: "Todas" },
  { value: "active", label: "Activas" },
  { value: "paused", label: "Pausadas" },
];

/** `lastResult` es texto libre; se muestra completo, no truncado. */
function LastResultCell({ value }: { value: string | null }) {
  if (!value) return <span className="text-muted-foreground">—</span>;
  const parsed = parseLastResult(value);
  if (!parsed) {
    return <span className="text-sm whitespace-normal">{value}</span>;
  }
  return (
    <div className="flex flex-col items-start gap-1">
      <StatusBadge tone={weeklySummaryStatusTone(parsed.status)} icon={null}>
        {weeklySummaryStatusLabel(parsed.status)}
      </StatusBadge>
      {parsed.reason ? (
        <span className="text-xs whitespace-normal text-muted-foreground">
          {parsed.reason}
        </span>
      ) : null}
    </div>
  );
}

export default function WeeklySummaryPage() {
  const { data, isLoading, error, refetch, isFetching } =
    useWeeklySummarySchedules({ take: 100 });
  const { data: clients = [] } = useClients();
  const updateMutation = useUpdateWeeklySummarySchedule();
  const deleteMutation = useDeleteWeeklySummarySchedule();
  const sendMutation = useSendWeeklySummary();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<WeeklySummarySchedule | null>(null);
  const [deleting, setDeleting] = useState<WeeklySummarySchedule | null>(null);
  const [sending, setSending] = useState<WeeklySummarySchedule | null>(null);
  const [previewClient, setPreviewClient] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [tickOpen, setTickOpen] = useState(false);
  const [stateFilter, setStateFilter] = useState<StateFilter>("all");

  const rows = useMemo(() => data?.rows ?? [], [data]);

  const clientNameById = useMemo(() => {
    const map = new Map<number, string>();
    for (const c of clients) map.set(Number(c.id), c.name);
    return map;
  }, [clients]);

  const clientNameOf = useCallback(
    (s: WeeklySummarySchedule) =>
      s.client?.name ??
      clientNameById.get(Number(s.clientId)) ??
      `Cliente #${s.clientId}`,
    [clientNameById]
  );

  const takenClientIds = useMemo(
    () => rows.map((r) => Number(r.clientId)),
    [rows]
  );

  const filteredRows = useMemo(() => {
    if (stateFilter === "all") return rows;
    return rows.filter((r) =>
      stateFilter === "active" ? r.isActive : !r.isActive
    );
  }, [rows, stateFilter]);

  const onCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const onEdit = useCallback((s: WeeklySummarySchedule) => {
    setEditing(s);
    setFormOpen(true);
  }, []);

  /** 409: el cliente ya tenía programación → llevamos al usuario a editarla. */
  const onConflict = useCallback(
    (clientId: number) => {
      const existing = rows.find((r) => Number(r.clientId) === clientId);
      if (existing) {
        toast.info(
          `${clientNameOf(existing)} ya tenía una programación. Abriendo para editarla.`
        );
        setEditing(existing);
        setFormOpen(true);
      } else {
        toast.error("Este cliente ya tiene una programación. Actualiza la página.");
        refetch();
      }
    },
    [rows, clientNameOf, refetch]
  );

  const onToggle = useCallback(
    async (s: WeeklySummarySchedule) => {
      try {
        await updateMutation.mutateAsync({
          id: s.id,
          payload: { isActive: !s.isActive },
        });
        toast.success(s.isActive ? "Programación pausada" : "Programación activada");
      } catch (e) {
        toast.error(errorMessage(e, "No se pudo cambiar el estado"));
      }
    },
    [updateMutation]
  );

  const onPreview = useCallback(
    (s: WeeklySummarySchedule) => {
      setPreviewClient({ id: Number(s.clientId), name: clientNameOf(s) });
    },
    [clientNameOf]
  );

  const confirmSend = async () => {
    if (!sending) return;
    const target = sending;
    setSending(null);
    try {
      const result = await sendMutation.mutateAsync(Number(target.clientId));
      const name = clientNameOf(target);
      if (result.status === "SENT") {
        toast.success(`Resumen enviado a ${name}`);
      } else if (result.status === "FAILED") {
        toast.error(`${name}: ${result.reason ?? "el envío falló"}`);
      } else {
        toast.info(`${name}: ${result.reason ?? "no se envió"}`);
      }
    } catch (e) {
      toast.error(errorMessage(e, "No se pudo enviar el resumen"));
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await deleteMutation.mutateAsync(deleting.id);
      toast.success("Programación eliminada");
      setDeleting(null);
    } catch (e) {
      toast.error(errorMessage(e, "No se pudo eliminar la programación"));
    }
  };

  const columns = useMemo<ColumnDef<WeeklySummarySchedule>[]>(
    () => [
      {
        id: "client",
        accessorFn: (row) => clientNameOf(row),
        header: "Cliente",
        cell: ({ row }) => (
          <span className="font-medium">{clientNameOf(row.original)}</span>
        ),
      },
      {
        id: "slot",
        accessorFn: (row) => scheduleSlotLabel(row),
        header: "Cuándo",
        // `timeOfDay` es hora de pared: se muestra tal cual, nunca convertida.
        cell: ({ row }) => (
          <span className="text-sm">{scheduleSlotLabel(row.original)}</span>
        ),
      },
      {
        accessorKey: "isActive",
        header: "Estado",
        cell: ({ row }) => (
          <StatusBadge
            tone={row.original.isActive ? "success" : "neutral"}
            icon={null}
          >
            {row.original.isActive ? "Activa" : "Pausada"}
          </StatusBadge>
        ),
      },
      {
        accessorKey: "nextSlotAt",
        header: "Próximo envío",
        cell: ({ row }) => (
          <span className="text-xs tabular-nums text-muted-foreground">
            {/* Instante UTC formateado en la zona de la programación. */}
            {formatDateTimeInZone(
              row.original.nextSlotAt,
              row.original.timezone
            )}
          </span>
        ),
      },
      {
        accessorKey: "lastSentAt",
        header: "Último envío",
        cell: ({ row }) => (
          <span className="text-xs tabular-nums text-muted-foreground">
            {formatDateTimeInZone(
              row.original.lastSentAt,
              row.original.timezone
            )}
          </span>
        ),
      },
      {
        accessorKey: "lastResult",
        header: "Último resultado",
        cell: ({ row }) => <LastResultCell value={row.original.lastResult} />,
      },
      {
        id: "template",
        accessorFn: (row) => row.template?.subject ?? "",
        header: "Plantilla",
        cell: ({ row }) => {
          const template = row.original.template;
          if (!template) {
            return (
              <Badge variant="outline" className="font-normal">
                Global
              </Badge>
            );
          }
          return (
            <span className="block max-w-xs truncate text-sm">
              {template.subject}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Acciones</span>,
        enableSorting: false,
        cell: ({ row }) => {
          const s = row.original;
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
                  <DropdownMenuItem onClick={() => onEdit(s)}>
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onPreview(s)}>
                    Ver previa
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setSending(s)}
                    disabled={sendMutation.isPending}
                  >
                    Enviar ahora
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onToggle(s)}>
                    {s.isActive ? "Pausar" : "Activar"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => setDeleting(s)}
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
    [clientNameOf, onEdit, onPreview, onToggle, sendMutation.isPending]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Resumen semanal"
        description="Un correo semanal por cliente con todos sus embarques en curso y el último estado de ShipsGo. Hay a lo más una programación por cliente."
      />

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>El envío automático depende del backend</AlertTitle>
        <AlertDescription>
          Mientras la feature esté apagada por configuración, el cron no corre.
          La vista previa y el envío manual funcionan igual, así que se puede
          probar sin riesgo de que salgan correos automáticos.
        </AlertDescription>
      </Alert>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>No se pudieron cargar las programaciones</AlertTitle>
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
        data={filteredRows}
        isLoading={isLoading}
        searchPlaceholder="Buscar por cliente, plantilla…"
        toolbarLeft={
          <Button onClick={onCreate}>
            <Plus className="h-4 w-4" />
            Programar resumen
          </Button>
        }
        toolbarRight={
          <>
            <FilterPopover
              label="Estado"
              value={stateFilter}
              defaultValue="all"
              options={STATE_OPTIONS}
              onChange={setStateFilter}
              triggerLabel="Filtrar estado"
            />
            <Button variant="outline" onClick={() => setTickOpen(true)}>
              <Play className="h-4 w-4" />
              Diagnóstico
            </Button>
          </>
        }
        emptyState={
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <CalendarClock className="h-8 w-8" />
            <p className="text-sm">No hay resúmenes programados.</p>
            <Button size="sm" onClick={onCreate}>
              <Plus className="h-4 w-4" />
              Programar resumen
            </Button>
          </div>
        }
      />

      <ScheduleFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editing={editing}
        takenClientIds={takenClientIds}
        onConflict={onConflict}
      />

      <WeeklySummaryPreviewDialog
        open={previewClient !== null}
        onOpenChange={(open) => !open && setPreviewClient(null)}
        clientId={previewClient?.id ?? null}
        clientName={previewClient?.name}
        onSend={(clientId) => {
          const target = rows.find((r) => Number(r.clientId) === clientId);
          setPreviewClient(null);
          if (target) setSending(target);
        }}
      />

      <RunTickDialog open={tickOpen} onOpenChange={setTickOpen} />

      <AlertDialog
        open={!!sending}
        onOpenChange={(open) => !open && setSending(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Enviar el resumen ahora?</AlertDialogTitle>
            <AlertDialogDescription>
              Se enviará un correo real a los destinatarios de{" "}
              <span className="font-semibold text-foreground">
                {sending ? clientNameOf(sending) : ""}
              </span>
              . Este envío va sin clave de dedupe, así que se manda aunque el
              cliente ya haya recibido el resumen de esta semana. No cambia la
              programación.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSend}>Enviar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar la programación?</AlertDialogTitle>
            <AlertDialogDescription>
              El cliente{" "}
              <span className="font-semibold text-foreground">
                {deleting ? clientNameOf(deleting) : ""}
              </span>{" "}
              dejará de recibir el resumen semanal. Si sólo quieres detenerlo
              temporalmente, usa &ldquo;Pausar&rdquo;. No se puede deshacer.
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
