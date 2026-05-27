"use client";

import { useCallback, useMemo, useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Bell, MoreHorizontal, Plus } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table/data-table";
import { ActiveBadge } from "@/components/data-table/active-cell";
import {
  FilterPopover,
  type FilterOption,
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useClients } from "@/lib/hooks/use-clients";
import {
  useDeleteNotificationRule,
  useNotificationRules,
  useUpdateNotificationRule,
} from "@/lib/hooks/use-notifications";
import {
  NOTIFICATION_EVENT_TYPES,
  eventTypeLabel,
  referenceFieldLabel,
  triggerTypeLabel,
} from "@/lib/notifications/constants";
import { errorMessage } from "@/lib/utils/errors";
import type {
  NotificationEventType,
  NotificationRule,
} from "@/types/domain";

import { RuleFormDialog } from "./rule-form-dialog";

type EventFilter = "all" | NotificationEventType;
type ScopeFilter = "all" | "global" | "client";

const EVENT_OPTIONS: FilterOption<EventFilter>[] = [
  { value: "all", label: "Todos" },
  ...NOTIFICATION_EVENT_TYPES.map<FilterOption<EventFilter>>((evt) => ({
    value: evt,
    label: eventTypeLabel(evt),
  })),
];

const SCOPE_OPTIONS: FilterOption<ScopeFilter>[] = [
  { value: "all", label: "Todos" },
  { value: "global", label: "Globales" },
  { value: "client", label: "Por cliente" },
];

function triggerSummary(rule: NotificationRule): string {
  switch (rule.triggerType) {
    case "BEFORE_REFERENCE":
      return `${rule.offsetHours ?? "?"}h antes de ${
        rule.referenceField ? referenceFieldLabel(rule.referenceField) : "—"
      }`;
    case "AFTER_REFERENCE":
      return `${rule.offsetHours ?? "?"}h después de ${
        rule.referenceField ? referenceFieldLabel(rule.referenceField) : "—"
      }`;
    case "AT_TIME_OF_DAY":
      return `Cada día a las ${rule.atTimeOfDay ?? "—"}`;
    case "PERIODIC": {
      const base = `Cada ${rule.recurrenceHours ?? "?"}h`;
      return rule.maxRecurrences
        ? `${base} (máx ${rule.maxRecurrences})`
        : base;
    }
    case "ON_EVENT":
      return "Al ocurrir el evento";
    default:
      return triggerTypeLabel(rule.triggerType);
  }
}

export default function NotificationRulesPage() {
  const { data, isLoading, error, refetch, isFetching } = useNotificationRules({
    take: 100,
  });
  const { data: clients = [] } = useClients();
  const updateMutation = useUpdateNotificationRule();
  const deleteMutation = useDeleteNotificationRule();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<NotificationRule | null>(null);
  const [deleting, setDeleting] = useState<NotificationRule | null>(null);
  const [eventFilter, setEventFilter] = useState<EventFilter>("all");
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>("all");

  const clientNameById = useMemo(() => {
    const map = new Map<number, string>();
    for (const c of clients) {
      map.set(Number(c.id), c.name);
    }
    return map;
  }, [clients]);

  const filteredData = useMemo(() => {
    const rows = data?.rows ?? [];
    return rows.filter((r) => {
      if (eventFilter !== "all" && r.eventType !== eventFilter) return false;
      if (scopeFilter === "global" && r.clientId !== null) return false;
      if (scopeFilter === "client" && r.clientId === null) return false;
      return true;
    });
  }, [data, eventFilter, scopeFilter]);

  const onCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const onEdit = useCallback((r: NotificationRule) => {
    setEditing(r);
    setFormOpen(true);
  }, []);
  const onToggle = useCallback(
    async (r: NotificationRule) => {
      try {
        await updateMutation.mutateAsync({
          id: r.id,
          payload: { isActive: !r.isActive },
        });
        toast.success(r.isActive ? "Regla desactivada" : "Regla activada");
      } catch (e) {
        toast.error(errorMessage(e, "No se pudo cambiar el estado"));
      }
    },
    [updateMutation]
  );
  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await deleteMutation.mutateAsync(deleting.id);
      toast.success("Regla eliminada");
      setDeleting(null);
    } catch (e) {
      toast.error(errorMessage(e, "No se pudo eliminar la regla"));
    }
  };

  const columns = useMemo<ColumnDef<NotificationRule>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Nombre",
        cell: ({ row }) => (
          <div className="flex flex-col gap-0.5">
            <span className="font-medium">{row.original.name}</span>
            {row.original.description ? (
              <span className="text-xs text-muted-foreground">
                {row.original.description}
              </span>
            ) : null}
          </div>
        ),
      },
      {
        accessorKey: "eventType",
        header: "Evento",
        cell: ({ row }) => eventTypeLabel(row.original.eventType),
      },
      {
        accessorKey: "clientId",
        header: "Alcance",
        cell: ({ row }) => {
          const cid = row.original.clientId;
          if (cid === null) {
            return (
              <Badge variant="outline" className="font-normal">
                Global
              </Badge>
            );
          }
          return (
            <span className="text-sm">
              {clientNameById.get(Number(cid)) ?? `Cliente #${cid}`}
            </span>
          );
        },
      },
      {
        accessorKey: "triggerType",
        header: "Disparo",
        cell: ({ row }) => (
          <div className="flex flex-col gap-0.5">
            <span className="text-sm">{triggerSummary(row.original)}</span>
            <span className="font-mono text-xs text-muted-foreground">
              {row.original.triggerType}
            </span>
          </div>
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
                  <DropdownMenuItem onClick={() => onToggle(r)}>
                    {r.isActive ? "Desactivar" : "Activar"}
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
    [clientNameById, onEdit, onToggle]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reglas de notificación"
        description="Cuándo y con qué frecuencia se disparan las notificaciones por evento. Si existen reglas por cliente, las globales no aplican para ese cliente."
      />

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>No se pudieron cargar las reglas</AlertTitle>
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
        searchPlaceholder="Buscar por nombre, descripción…"
        toolbarLeft={
          <Button onClick={onCreate}>
            <Plus className="h-4 w-4" />
            Crear regla
          </Button>
        }
        toolbarRight={
          <>
            <FilterPopover
              label="Evento"
              value={eventFilter}
              defaultValue="all"
              options={EVENT_OPTIONS}
              onChange={setEventFilter}
              triggerLabel="Filtrar evento"
            />
            <FilterPopover
              label="Alcance"
              value={scopeFilter}
              defaultValue="all"
              options={SCOPE_OPTIONS}
              onChange={setScopeFilter}
              triggerLabel="Filtrar alcance"
            />
          </>
        }
        emptyState={
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Bell className="h-8 w-8" />
            <p className="text-sm">No hay reglas configuradas.</p>
            <Button size="sm" onClick={onCreate}>
              <Plus className="h-4 w-4" />
              Crear regla
            </Button>
          </div>
        }
      />

      <RuleFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editing={editing}
      />

      <AlertDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar regla?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará la regla{" "}
              <span className="font-semibold text-foreground">
                {deleting?.name}
              </span>
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
