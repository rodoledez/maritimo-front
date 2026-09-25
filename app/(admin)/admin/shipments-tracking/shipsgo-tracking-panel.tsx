"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Circle,
  ExternalLink,
  Hash,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { StatusBadge } from "@/components/status-badge";
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
import {
  useDeleteManualContainer,
  useDeleteManualMovement,
} from "@/lib/hooks/use-shipments-tracking";
import { cn } from "@/lib/utils";
import { errorMessage } from "@/lib/utils/errors";
import { formatDate, formatDateTime } from "@/lib/utils/format";
import type {
  ShipmentTracking,
  ShipsgoContainer,
  ShipsgoFollower,
  ShipsgoMovement,
} from "@/types/domain";

import {
  CONTAINER_STATUS_LABEL,
  CONTAINER_STATUS_TONE,
  MOVEMENT_EVENT_LABEL,
  NOT_ASSIGNED_CONTAINER,
  containerNumberLabel,
  isManualTracking,
  shipmentStatusLabel,
  shipmentStatusTone,
} from "./_status";
import { ManualContainerDialog } from "./manual-container-dialog";
import {
  ManualMovementFormDialog,
  type MovementDialogTarget,
} from "./manual-movement-form-dialog";
import { ManualTrackingFormDialog } from "./manual-tracking-form-dialog";

type EditableMovement = ShipsgoMovement & { id: string };

type DeleteTarget =
  | { kind: "container"; container: ShipsgoContainer }
  | { kind: "movement"; movement: EditableMovement; containerNumber: string };

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="text-sm">{children}</div>
    </div>
  );
}

function SectionTitle({
  children,
  action,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-2 border-b pb-2">
      <h3 className="text-sm font-semibold text-secondary">{children}</h3>
      {action}
    </div>
  );
}

function MovementRow({
  m,
  onEdit,
  onDelete,
}: {
  m: ShipsgoMovement;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const isActual = m.status === "ACT";
  const Icon = isActual ? CheckCircle2 : Circle;
  return (
    <li className="flex gap-3 py-2">
      <Icon
        className={cn(
          "mt-0.5 h-4 w-4 shrink-0",
          isActual ? "text-brand-success" : "text-muted-foreground"
        )}
      />
      <div className="flex flex-1 flex-col gap-0.5">
        <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
          <span className="font-medium">
            {MOVEMENT_EVENT_LABEL[m.event] ?? m.event}
          </span>
          <span className="font-mono text-xs text-muted-foreground">
            {formatDateTime(m.timestamp)}
          </span>
        </div>
        <div className="text-xs text-muted-foreground">
          {m.location.name}{" "}
          {m.location.code ? (
            <span className="font-mono">({m.location.code})</span>
          ) : null}
          {m.vessel ? (
            <>
              {" · "}
              <span className="text-foreground">{m.vessel.name}</span>
              {m.voyage ? ` · ${m.voyage}` : ""}
            </>
          ) : null}
          {!isActual ? " · estimado" : ""}
        </div>
      </div>
      {onEdit || onDelete ? (
        <div className="flex shrink-0 items-start gap-0.5">
          {onEdit ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={onEdit}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  <span className="sr-only">Editar movimiento</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Editar</TooltipContent>
            </Tooltip>
          ) : null}
          {onDelete ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={onDelete}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span className="sr-only">Eliminar movimiento</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Eliminar</TooltipContent>
            </Tooltip>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

function ContainerCard({
  c,
  editable,
  onAddMovement,
  onEditContainer,
  onDeleteContainer,
  onEditMovement,
  onDeleteMovement,
}: {
  c: ShipsgoContainer;
  editable: boolean;
  onAddMovement: () => void;
  onEditContainer: () => void;
  onDeleteContainer: () => void;
  onEditMovement: (m: EditableMovement) => void;
  onDeleteMovement: (m: EditableMovement) => void;
}) {
  const notAssigned = c.number === NOT_ASSIGNED_CONTAINER;
  return (
    <div className="rounded-lg border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-sm font-medium",
              notAssigned ? "italic text-muted-foreground" : "font-mono"
            )}
          >
            {containerNumberLabel(c.number)}
          </span>
          {c.size || c.type ? (
            <span className="text-xs text-muted-foreground">
              {[c.size ? `${c.size}'` : null, c.type].filter(Boolean).join(" ")}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-1">
          <StatusBadge tone={CONTAINER_STATUS_TONE[c.status]} icon={null}>
            {CONTAINER_STATUS_LABEL[c.status]}
          </StatusBadge>
          {editable ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                >
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Acciones del contenedor</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem onClick={onAddMovement}>
                  <Plus className="h-4 w-4" />
                  Registrar movimiento
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onEditContainer}>
                  {notAssigned ? (
                    <>
                      <Hash className="h-4 w-4" />
                      Asignar número
                    </>
                  ) : (
                    <>
                      <Pencil className="h-4 w-4" />
                      Editar contenedor
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={onDeleteContainer}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  Eliminar contenedor
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      </div>
      {editable && notAssigned ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={onEditContainer}
        >
          <Hash className="h-4 w-4" />
          Asignar número
        </Button>
      ) : null}
      {c.movements.length ? (
        <ol className="mt-2 divide-y">
          {c.movements.map((m, i) => {
            const editableMovement =
              editable && m.id ? (m as EditableMovement) : null;
            return (
              <MovementRow
                key={m.id ?? `${m.event}-${m.timestamp}-${i}`}
                m={m}
                onEdit={
                  editableMovement
                    ? () => onEditMovement(editableMovement)
                    : undefined
                }
                onDelete={
                  editableMovement
                    ? () => onDeleteMovement(editableMovement)
                    : undefined
                }
              />
            );
          })}
        </ol>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">Sin movimientos.</p>
      )}
    </div>
  );
}

/**
 * Cuerpo presentacional de un tracking (estado, progreso, ruta, contenedores y
 * seguidores). Compartido por el diálogo de detalle de shipments-tracking y
 * por el detalle de una reserva. Si el tracking es MANUAL agrega las acciones
 * de edición (seguimiento, contenedores y movimientos).
 */
export function ShipsgoTrackingPanel({
  tracking,
  containers,
  followers,
  isFetching,
  fallbackVessel,
}: {
  tracking: ShipmentTracking;
  containers: ShipsgoContainer[];
  followers: ShipsgoFollower[];
  isFetching?: boolean;
  /** Nave/viaje del itinerario de la reserva, para precargar movimientos. */
  fallbackVessel?: { name?: string | null; voyage?: string | null } | null;
}) {
  const t = tracking;
  const manual = isManualTracking(t);
  const manualTracking = manual ? t : null;
  const mapUrl =
    !manual && t.mapToken && t.shipsgoId
      ? `https://map.shipsgo.com/ocean/shipments/${t.shipsgoId}?token=${t.mapToken}`
      : null;

  const [editOpen, setEditOpen] = useState(false);
  const [movementTarget, setMovementTarget] =
    useState<MovementDialogTarget | null>(null);
  const [containerTarget, setContainerTarget] =
    useState<ShipsgoContainer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const deleteContainerMutation = useDeleteManualContainer();
  const deleteMovementMutation = useDeleteManualMovement();

  const confirmDelete = async () => {
    const target = deleteTarget;
    setDeleteTarget(null);
    if (!target || !manualTracking) return;
    try {
      if (target.kind === "container") {
        await deleteContainerMutation.mutateAsync({
          shipmentId: manualTracking.id,
          containerNumber: target.container.number,
        });
        toast.success("Contenedor eliminado");
      } else {
        await deleteMovementMutation.mutateAsync({
          shipmentId: manualTracking.id,
          movementId: target.movement.id,
        });
        toast.success("Movimiento eliminado");
      }
    } catch (e) {
      toast.error(
        errorMessage(
          e,
          target.kind === "container"
            ? "No se pudo eliminar el contenedor"
            : "No se pudo eliminar el movimiento"
        )
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <StatusBadge tone={shipmentStatusTone(t.status)} icon={null}>
            {shipmentStatusLabel(t.status)}
          </StatusBadge>
          {manual ? (
            <StatusBadge tone="neutral" icon={Pencil}>
              Seguimiento manual
            </StatusBadge>
          ) : null}
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {manual ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditOpen(true)}
              >
                <Pencil className="h-4 w-4" />
                Editar seguimiento
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() =>
                  setMovementTarget({ mode: "create", containerNumber: null })
                }
              >
                <Plus className="h-4 w-4" />
                Registrar movimiento
              </Button>
            </>
          ) : (
            <span className="font-mono">ShipsGo #{t.shipsgoId}</span>
          )}
          {mapUrl ? (
            <a
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary underline underline-offset-2 hover:text-primary/80"
            >
              Ver mapa
              <ExternalLink className="h-3 w-3" />
            </a>
          ) : null}
        </div>
      </div>

      {t.transitPercentage !== null && t.transitPercentage !== undefined ? (
        <div className="space-y-1">
          <div className="flex items-baseline justify-between text-xs text-muted-foreground">
            <span>Progreso del tránsito</span>
            <span className="font-mono tabular-nums text-foreground">
              {Math.round(t.transitPercentage)}%
              {t.transitTime ? ` · ${t.transitTime} días` : ""}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary"
              style={{
                width: `${Math.min(100, Math.max(0, t.transitPercentage))}%`,
              }}
            />
          </div>
        </div>
      ) : null}

      <section className="space-y-3">
        <SectionTitle>Booking y carga</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-3">
          <DetailRow label="Booking N°">{t.bookingNumber ?? "—"}</DetailRow>
          <DetailRow label="Referencia">{t.reference ?? "—"}</DetailRow>
          {!manual ? (
            <DetailRow label="Carrier (SCAC)">
              <span className="font-mono">{t.carrierScac ?? "—"}</span>
            </DetailRow>
          ) : null}
          <DetailRow label="Contenedor primario">
            <span className="font-mono">
              {t.containerNumber ? containerNumberLabel(t.containerNumber) : "—"}
            </span>
          </DetailRow>
          <DetailRow label="Total contenedores">
            {t.containerCount ?? "—"}
          </DetailRow>
          {!manual ? (
            <DetailRow label="CO₂ estimado">
              {t.co2Emission ? `${t.co2Emission} t` : "—"}
            </DetailRow>
          ) : null}
        </div>
      </section>

      <section className="space-y-3">
        <SectionTitle>Ruta y fechas</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <DetailRow label="Puerto de zarpe (POL)">
            {t.portOfLoading ?? "—"}
            {t.polCode ? (
              <span className="ml-1 font-mono text-xs text-muted-foreground">
                ({t.polCode})
              </span>
            ) : null}
          </DetailRow>
          <DetailRow label="Puerto de destino (POD)">
            {t.portOfDischarge ?? "—"}
            {t.podCode ? (
              <span className="ml-1 font-mono text-xs text-muted-foreground">
                ({t.podCode})
              </span>
            ) : null}
          </DetailRow>
          <DetailRow label="ETD">
            {formatDate(t.etd)}
            {t.dateOfLoadingInitial && t.dateOfLoadingInitial !== t.etd ? (
              <span className="ml-1 text-xs text-muted-foreground">
                ({manual ? "planificado" : "inicial"}:{" "}
                {formatDate(t.dateOfLoadingInitial)})
              </span>
            ) : null}
          </DetailRow>
          <DetailRow label="ETA">
            {formatDate(t.eta)}
            {t.dateOfDischargeInitial && t.dateOfDischargeInitial !== t.eta ? (
              <span className="ml-1 text-xs text-muted-foreground">
                ({manual ? "planificado" : "inicial"}:{" "}
                {formatDate(t.dateOfDischargeInitial)})
              </span>
            ) : null}
          </DetailRow>
          <DetailRow label="Motonave actual">
            {t.currentVessel ?? "—"}
            {t.currentVesselImo ? (
              <span className="ml-1 font-mono text-xs text-muted-foreground">
                (IMO {t.currentVesselImo})
              </span>
            ) : null}
          </DetailRow>
          <DetailRow label="Viaje actual">{t.currentVoyage ?? "—"}</DetailRow>
        </div>
      </section>

      {isFetching && !containers.length ? (
        <div className="flex items-center justify-center py-6 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="ml-2 text-sm">Cargando contenedores…</span>
        </div>
      ) : null}

      {containers.length ? (
        <section className="space-y-3">
          <SectionTitle>Contenedores ({containers.length})</SectionTitle>
          {manual ? (
            <p className="text-xs text-muted-foreground">
              Un movimiento registrado para todo el embarque se copia a cada
              contenedor: editarlo o eliminarlo aquí afecta sólo la copia de
              ese contenedor.
            </p>
          ) : null}
          <div className="space-y-3">
            {containers.map((c) => (
              <ContainerCard
                key={c.number}
                c={c}
                editable={manual}
                onAddMovement={() =>
                  setMovementTarget({
                    mode: "create",
                    containerNumber: c.number,
                  })
                }
                onEditContainer={() => setContainerTarget(c)}
                onDeleteContainer={() =>
                  setDeleteTarget({ kind: "container", container: c })
                }
                onEditMovement={(m) =>
                  setMovementTarget({
                    mode: "edit",
                    movement: m,
                    containerNumber: c.number,
                  })
                }
                onDeleteMovement={(m) =>
                  setDeleteTarget({
                    kind: "movement",
                    movement: m,
                    containerNumber: c.number,
                  })
                }
              />
            ))}
          </div>
        </section>
      ) : manual && !isFetching ? (
        <section className="space-y-3">
          <SectionTitle>Contenedores</SectionTitle>
          <p className="text-xs text-muted-foreground">
            Sin contenedores. Agrégalos desde &quot;Editar seguimiento&quot;, o
            registra un movimiento: el primero crea un contenedor &quot;Sin
            asignar&quot;.
          </p>
        </section>
      ) : null}

      {!manual && followers.length ? (
        <section className="space-y-3">
          <SectionTitle>Seguidores ShipsGo</SectionTitle>
          <div className="flex flex-wrap gap-1.5">
            {followers.map((f) => (
              <span
                key={f.id}
                className="rounded-md bg-muted px-2 py-0.5 text-xs"
              >
                {f.email}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      {!manual && (t.checkedAt || t.discardedAt) ? (
        <section className="space-y-3">
          <SectionTitle>Metadata ShipsGo</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <DetailRow label="Último poll de ShipsGo">
              {t.checkedAt ? formatDateTime(t.checkedAt) : "—"}
            </DetailRow>
            <DetailRow label="Descartado">
              {t.discardedAt ? formatDateTime(t.discardedAt) : "—"}
            </DetailRow>
          </div>
        </section>
      ) : null}

      {manualTracking ? (
        <>
          <ManualTrackingFormDialog
            open={editOpen}
            onOpenChange={setEditOpen}
            tracking={manualTracking}
            existingContainers={containers}
          />
          <ManualMovementFormDialog
            open={!!movementTarget}
            onOpenChange={(o) => !o && setMovementTarget(null)}
            tracking={manualTracking}
            containers={containers}
            target={movementTarget}
            fallbackVessel={fallbackVessel}
          />
          <ManualContainerDialog
            open={!!containerTarget}
            onOpenChange={(o) => !o && setContainerTarget(null)}
            tracking={manualTracking}
            container={containerTarget}
          />
          <AlertDialog
            open={!!deleteTarget}
            onOpenChange={(o) => !o && setDeleteTarget(null)}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {deleteTarget?.kind === "container"
                    ? "¿Eliminar contenedor?"
                    : "¿Eliminar movimiento?"}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {deleteTarget?.kind === "container" ? (
                    <>
                      Se eliminará el contenedor{" "}
                      <span className="font-semibold text-foreground">
                        {containerNumberLabel(deleteTarget.container.number)}
                      </span>{" "}
                      y todos sus movimientos.
                    </>
                  ) : deleteTarget?.kind === "movement" ? (
                    <>
                      Se eliminará el movimiento{" "}
                      <span className="font-semibold text-foreground">
                        {MOVEMENT_EVENT_LABEL[deleteTarget.movement.event]}
                      </span>{" "}
                      del contenedor{" "}
                      {containerNumberLabel(deleteTarget.containerNumber)}{" "}
                      (sólo esta copia).
                    </>
                  ) : null}{" "}
                  Los hitos ya notificados no se reenvían ni se revierten; sólo
                  se recalculan los pendientes.
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
        </>
      ) : null}
    </div>
  );
}
