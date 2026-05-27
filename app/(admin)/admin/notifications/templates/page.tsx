"use client";

import { useCallback, useMemo, useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { BookOpen, MoreHorizontal, Plus } from "lucide-react";
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
  useDeleteNotificationTemplate,
  useNotificationTemplates,
  useUpdateNotificationTemplate,
} from "@/lib/hooks/use-notifications";
import {
  NOTIFICATION_EVENT_TYPES,
  eventTypeLabel,
} from "@/lib/notifications/constants";
import { errorMessage } from "@/lib/utils/errors";
import type {
  NotificationEventType,
  NotificationTemplate,
} from "@/types/domain";

import { TemplateFormDialog } from "./template-form-dialog";

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

export default function NotificationTemplatesPage() {
  const { data, isLoading, error, refetch, isFetching } =
    useNotificationTemplates({ take: 100 });
  const { data: clients = [] } = useClients();
  const updateMutation = useUpdateNotificationTemplate();
  const deleteMutation = useDeleteNotificationTemplate();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<NotificationTemplate | null>(null);
  const [deleting, setDeleting] = useState<NotificationTemplate | null>(null);
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
    return rows.filter((t) => {
      if (eventFilter !== "all" && t.eventType !== eventFilter) return false;
      if (scopeFilter === "global" && t.clientId !== null) return false;
      if (scopeFilter === "client" && t.clientId === null) return false;
      return true;
    });
  }, [data, eventFilter, scopeFilter]);

  const onCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const onEdit = useCallback((t: NotificationTemplate) => {
    setEditing(t);
    setFormOpen(true);
  }, []);
  const onToggle = useCallback(
    async (t: NotificationTemplate) => {
      try {
        await updateMutation.mutateAsync({
          id: t.id,
          payload: { isActive: !t.isActive },
        });
        toast.success(t.isActive ? "Plantilla desactivada" : "Plantilla activada");
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
      toast.success("Plantilla eliminada");
      setDeleting(null);
    } catch (e) {
      toast.error(errorMessage(e, "No se pudo eliminar la plantilla"));
    }
  };

  const columns = useMemo<ColumnDef<NotificationTemplate>[]>(
    () => [
      {
        accessorKey: "eventType",
        header: "Evento",
        cell: ({ row }) => (
          <div className="flex flex-col gap-0.5">
            <span className="font-medium">
              {eventTypeLabel(row.original.eventType)}
            </span>
            <span className="font-mono text-xs text-muted-foreground">
              {row.original.eventType}
            </span>
          </div>
        ),
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
        accessorKey: "subject",
        header: "Asunto",
        cell: ({ row }) => (
          <span className="block max-w-md truncate text-sm">
            {row.original.subject}
          </span>
        ),
      },
      {
        accessorKey: "description",
        header: "Descripción",
        cell: ({ row }) => (
          <span className="block max-w-xs truncate text-sm text-muted-foreground">
            {row.original.description ?? "—"}
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
          const t = row.original;
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
                  <DropdownMenuItem onClick={() => onEdit(t)}>
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onToggle(t)}>
                    {t.isActive ? "Desactivar" : "Activar"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => setDeleting(t)}
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
        title="Plantillas de notificación"
        description="Asuntos y cuerpos Handlebars usados al enviar correos de tracking. Las plantillas globales aplican a todos los clientes salvo que exista una override específica."
      />

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>No se pudieron cargar las plantillas</AlertTitle>
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
        searchPlaceholder="Buscar por asunto, descripción…"
        toolbarLeft={
          <Button onClick={onCreate}>
            <Plus className="h-4 w-4" />
            Crear plantilla
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
            <BookOpen className="h-8 w-8" />
            <p className="text-sm">No hay plantillas registradas.</p>
            <Button size="sm" onClick={onCreate}>
              <Plus className="h-4 w-4" />
              Crear plantilla
            </Button>
          </div>
        }
      />

      <TemplateFormDialog
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
            <AlertDialogTitle>¿Eliminar plantilla?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará la plantilla del evento{" "}
              <span className="font-semibold text-foreground">
                {deleting ? eventTypeLabel(deleting.eventType) : ""}
              </span>
              {deleting?.clientId !== null && deleting
                ? ` para ${clientNameById.get(Number(deleting.clientId)) ?? `Cliente #${deleting.clientId}`}`
                : " (global)"}
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
