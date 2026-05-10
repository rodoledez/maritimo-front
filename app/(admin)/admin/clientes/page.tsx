"use client";

import { useCallback, useMemo, useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import {
  MoreHorizontal,
  Plus,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table/data-table";
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
import { ActiveBadge } from "@/components/data-table/active-cell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  useClients,
  useDeleteClient,
  useToggleClientActive,
} from "@/lib/hooks/use-clients";
import { isApiError } from "@/types/api";
import type { Client } from "@/types/domain";

import { ClientFormDialog } from "./client-form-dialog";

type ActiveFilter = "all" | "active" | "inactive";

const FILTER_OPTIONS: { value: ActiveFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "active", label: "Activos" },
  { value: "inactive", label: "Inactivos" },
];

function errorMessage(error: unknown, fallback: string): string {
  if (isApiError(error)) return error.message ?? fallback;
  if (error instanceof Error) return error.message;
  return fallback;
}

function getInitial(name?: string | null): string {
  return name?.trim().charAt(0).toUpperCase() || "?";
}

export default function ClientesPage() {
  const { data, isLoading, error, refetch, isFetching } = useClients();
  const toggleMutation = useToggleClientActive();
  const deleteMutation = useDeleteClient();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [deleting, setDeleting] = useState<Client | null>(null);
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");

  const onCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const onEdit = useCallback((client: Client) => {
    setEditing(client);
    setFormOpen(true);
  }, []);

  const onToggle = useCallback(
    async (client: Client) => {
      try {
        await toggleMutation.mutateAsync({
          id: client.id,
          active: client.active,
        });
        toast.success(client.active ? "Cliente desactivado" : "Cliente activado");
      } catch (error) {
        toast.error(
          errorMessage(error, "No se pudo cambiar el estado del cliente")
        );
      }
    },
    [toggleMutation]
  );

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await deleteMutation.mutateAsync(deleting.id);
      toast.success("Cliente eliminado");
      setDeleting(null);
    } catch (error) {
      toast.error(errorMessage(error, "No se pudo eliminar el cliente"));
    }
  };

  const filteredData = useMemo(() => {
    if (!data) return [];
    if (activeFilter === "all") return data;
    return data.filter((c) =>
      activeFilter === "active" ? c.active : !c.active
    );
  }, [data, activeFilter]);

  const columns = useMemo<ColumnDef<Client>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Empresa",
        cell: ({ row }) => (
          <div className="flex items-center gap-2.5">
            <Avatar size="sm">
              <AvatarFallback className="bg-brand-celeste text-secondary text-xs font-semibold">
                {getInitial(row.original.name)}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium">{row.original.name}</span>
          </div>
        ),
      },
      { accessorKey: "contactName", header: "Contacto" },
      { accessorKey: "username", header: "Usuario" },
      {
        accessorKey: "contactEmail",
        header: "Email contacto",
        cell: ({ row }) => {
          const email = row.original.contactEmail;
          if (!email) return <span className="text-muted-foreground">—</span>;
          return (
            <a
              href={`mailto:${email}`}
              className="text-primary underline underline-offset-2 hover:text-primary/80"
              onClick={(e) => e.stopPropagation()}
            >
              {email}
            </a>
          );
        },
      },
      {
        accessorKey: "active",
        header: "Estado",
        cell: ({ row }) => <ActiveBadge active={row.original.active} />,
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Acciones</span>,
        enableSorting: false,
        cell: ({ row }) => {
          const client = row.original;
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
                  <DropdownMenuItem onClick={() => onEdit(client)}>
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onToggle(client)}>
                    {client.active ? "Desactivar" : "Activar"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => setDeleting(client)}
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
    [onEdit, onToggle]
  );

  const toolbarLeft = (
    <Button variant="outline" onClick={onCreate}>
      <Plus className="h-4 w-4" />
      Crear cliente
    </Button>
  );

  const toolbarRight = (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="relative"
              aria-label="Filtros"
            >
              <SlidersHorizontal className="h-4 w-4" />
              {activeFilter !== "all" ? (
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
              ) : null}
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>Filtros</TooltipContent>
      </Tooltip>
      <PopoverContent align="end" className="w-56">
        <PopoverHeader>
          <PopoverTitle>Estado</PopoverTitle>
        </PopoverHeader>
        <div className="flex flex-col gap-1">
          {FILTER_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              variant={activeFilter === opt.value ? "secondary" : "ghost"}
              size="sm"
              className="justify-start"
              onClick={() => setActiveFilter(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clientes"
        description="Gestiona los clientes que pueden solicitar reservas."
      />

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>No se pudieron cargar los clientes</AlertTitle>
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
        searchPlaceholder="Buscar por empresa, contacto, usuario…"
        toolbarLeft={toolbarLeft}
        toolbarRight={toolbarRight}
        emptyState={
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Users className="h-8 w-8" />
            <p className="text-sm">No hay clientes registrados.</p>
            <Button size="sm" onClick={onCreate}>
              <Plus className="h-4 w-4" />
              Crear cliente
            </Button>
          </div>
        }
      />

      <ClientFormDialog
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
            <AlertDialogTitle>¿Eliminar cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará a{" "}
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
