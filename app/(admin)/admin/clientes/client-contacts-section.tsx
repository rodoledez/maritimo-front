"use client";

import { useMemo, useState } from "react";
import { MoreHorizontal, Plus, Users } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/status-badge";
import { ActiveBadge } from "@/components/data-table/active-cell";
import { EmailCell } from "@/components/data-table/email-cell";
import { eventTypeLabel } from "@/lib/notifications/constants";
import {
  CONTACT_CATEGORIES,
  contactCategoryLabel,
  contactCategoryTone,
} from "@/lib/contacts/constants";
import {
  useContacts,
  useDeleteContact,
  useToggleContactActive,
} from "@/lib/hooks/use-contacts";
import type { ContactFilters } from "@/lib/api/contacts";
import { isApiError } from "@/types/api";
import type { ClientContact, ContactCategory } from "@/types/domain";

import { ContactFormDialog } from "./contact-form-dialog";

function errorMessage(error: unknown, fallback: string): string {
  if (isApiError(error)) return error.message ?? fallback;
  if (error instanceof Error) return error.message;
  return fallback;
}

type CategoryFilter = ContactCategory | "all";
type ActiveFilter = "all" | "active" | "inactive";

function SubscribedEventsCell({ contact }: { contact: ClientContact }) {
  if (contact.category !== "TRACKING") {
    return <span className="text-muted-foreground">—</span>;
  }
  const events = contact.subscribedEvents ?? [];
  if (events.length === 0) {
    return <span className="text-muted-foreground">Todos</span>;
  }
  const shown = events.slice(0, 2);
  const rest = events.length - shown.length;
  return (
    <span className="flex flex-wrap items-center gap-1">
      {shown.map((event) => (
        <StatusBadge key={event} tone="neutral" icon={null}>
          {eventTypeLabel(event)}
        </StatusBadge>
      ))}
      {rest > 0 && (
        <span className="text-xs text-muted-foreground">+{rest}</span>
      )}
    </span>
  );
}

export function ClientContactsSection({
  clientId,
}: {
  clientId: ClientContact["clientId"];
}) {
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");

  const filters = useMemo<ContactFilters>(
    () => ({
      category: categoryFilter === "all" ? null : categoryFilter,
      active:
        activeFilter === "all" ? null : activeFilter === "active" ? true : false,
    }),
    [categoryFilter, activeFilter]
  );

  const { data, isLoading, error, refetch, isFetching } = useContacts(
    clientId ?? null,
    filters
  );
  const toggleMutation = useToggleContactActive(clientId);
  const deleteMutation = useDeleteContact(clientId);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ClientContact | null>(null);
  const [deleting, setDeleting] = useState<ClientContact | null>(null);

  const onCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const onEdit = (contact: ClientContact) => {
    setEditing(contact);
    setFormOpen(true);
  };

  const onToggle = async (contact: ClientContact) => {
    try {
      await toggleMutation.mutateAsync({
        contactId: contact.id,
        active: contact.active,
      });
      toast.success(
        contact.active ? "Contacto desactivado" : "Contacto activado"
      );
    } catch (err) {
      toast.error(
        errorMessage(err, "No se pudo cambiar el estado del contacto")
      );
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await deleteMutation.mutateAsync(deleting.id);
      toast.success("Contacto eliminado");
      setDeleting(null);
    } catch (err) {
      toast.error(errorMessage(err, "No se pudo eliminar el contacto"));
    }
  };

  const contacts = data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button size="sm" onClick={onCreate}>
          <Plus className="h-4 w-4" />
          Agregar contacto
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={categoryFilter}
            onValueChange={(value) => setCategoryFilter(value as CategoryFilter)}
          >
            <SelectTrigger size="sm" className="w-[170px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {CONTACT_CATEGORIES.map((value) => (
                <SelectItem key={value} value={value}>
                  {contactCategoryLabel(value)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={activeFilter}
            onValueChange={(value) => setActiveFilter(value as ActiveFilter)}
          >
            <SelectTrigger size="sm" className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="active">Activos</SelectItem>
              <SelectItem value="inactive">Inactivos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>No se pudieron cargar los contactos</AlertTitle>
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

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Mail</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Eventos suscritos</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-10 text-right">
                <span className="sr-only">Acciones</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : contacts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10">
                  <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <Users className="h-8 w-8" />
                    <p className="text-sm">
                      No hay contactos que coincidan con el filtro.
                    </p>
                    <Button size="sm" onClick={onCreate}>
                      <Plus className="h-4 w-4" />
                      Agregar contacto
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              contacts.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell className="font-medium">{contact.name}</TableCell>
                  <TableCell>
                    <EmailCell email={contact.email} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      tone={contactCategoryTone(contact.category)}
                      icon={null}
                    >
                      {contactCategoryLabel(contact.category)}
                    </StatusBadge>
                  </TableCell>
                  <TableCell className="whitespace-normal">
                    <SubscribedEventsCell contact={contact} />
                  </TableCell>
                  <TableCell>
                    <ActiveBadge active={contact.active} />
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Acciones</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem onClick={() => onEdit(contact)}>
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onToggle(contact)}>
                          {contact.active ? "Desactivar" : "Activar"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleting(contact)}
                        >
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ContactFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        clientId={clientId}
        editing={editing}
      />

      <AlertDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar contacto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará definitivamente a{" "}
              <span className="font-semibold text-foreground">
                {deleting?.name}
              </span>
              . Si solo quieres que deje de recibir correos, usa
              &ldquo;Desactivar&rdquo;. No se puede deshacer.
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
