"use client";

import {
  CheckCircle2,
  Circle,
  ExternalLink,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/status-badge";
import { cn } from "@/lib/utils";
import {
  useRefreshShipmentTracking,
  useShipmentTrackingDetail,
} from "@/lib/hooks/use-shipments-tracking";
import { errorMessage } from "@/lib/utils/errors";
import { formatDate, formatDateTime } from "@/lib/utils/format";
import type {
  ShipsgoContainer,
  ShipsgoMovement,
} from "@/types/domain";

import {
  CONTAINER_STATUS_LABEL,
  CONTAINER_STATUS_TONE,
  MOVEMENT_EVENT_LABEL,
  shipmentStatusLabel,
  shipmentStatusTone,
} from "./_status";

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

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="border-b pb-2 text-sm font-semibold text-secondary">
      {children}
    </h3>
  );
}

function MovementRow({ m }: { m: ShipsgoMovement }) {
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
          <span className="font-mono">({m.location.code})</span>
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
    </li>
  );
}

function ContainerCard({ c }: { c: ShipsgoContainer }) {
  return (
    <div className="rounded-lg border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-medium">
            {c.number === "NOT_ASSIGNED" ? "—" : c.number}
          </span>
          {c.size || c.type ? (
            <span className="text-xs text-muted-foreground">
              {[c.size ? `${c.size}'` : null, c.type].filter(Boolean).join(" ")}
            </span>
          ) : null}
        </div>
        <StatusBadge tone={CONTAINER_STATUS_TONE[c.status]} icon={null}>
          {CONTAINER_STATUS_LABEL[c.status]}
        </StatusBadge>
      </div>
      {c.movements.length ? (
        <ol className="mt-2 divide-y">
          {c.movements.map((m, i) => (
            <MovementRow key={`${m.event}-${m.timestamp}-${i}`} m={m} />
          ))}
        </ol>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">Sin movimientos.</p>
      )}
    </div>
  );
}

export function TrackingDetailDialog({
  open,
  onOpenChange,
  bookingId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: number | string | null;
}) {
  const { data, isFetching, isLoading } = useShipmentTrackingDetail(
    bookingId ?? undefined,
    { enabled: open }
  );
  const refreshMutation = useRefreshShipmentTracking();
  const t = data?.tracking;
  const containers = data?.containers ?? [];
  const followers = data?.followers ?? [];

  const onRefresh = async () => {
    if (bookingId === null) return;
    try {
      await refreshMutation.mutateAsync(bookingId);
      toast.success("Tracking actualizado desde ShipsGo");
    } catch (e) {
      toast.error(errorMessage(e, "No se pudo refrescar el tracking"));
    }
  };

  const mapUrl =
    t?.mapToken && t?.shipsgoId
      ? `https://map.shipsgo.com/ocean/shipments/${t.shipsgoId}?token=${t.mapToken}`
      : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            Tracking · Booking #{bookingId ?? "—"}
          </DialogTitle>
          <DialogDescription>
            Datos obtenidos desde ShipsGo.{" "}
            {t?.lastSyncedAt ? (
              <>
                Última sincronización:{" "}
                <span className="text-foreground">
                  {formatDateTime(t.lastSyncedAt)}
                </span>
              </>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        {isLoading || (!t && isFetching) ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : !t ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            Sin datos de tracking.
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <StatusBadge tone={shipmentStatusTone(t.status)} icon={null}>
                {shipmentStatusLabel(t.status)}
              </StatusBadge>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="font-mono">ShipsGo #{t.shipsgoId}</span>
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

            {t.transitPercentage !== null &&
            t.transitPercentage !== undefined ? (
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
                <DetailRow label="Booking N°">
                  {t.bookingNumber ?? "—"}
                </DetailRow>
                <DetailRow label="Referencia">
                  {t.reference ?? "—"}
                </DetailRow>
                <DetailRow label="Carrier (SCAC)">
                  <span className="font-mono">{t.carrierScac ?? "—"}</span>
                </DetailRow>
                <DetailRow label="Contenedor primario">
                  <span className="font-mono">
                    {t.containerNumber ?? "—"}
                  </span>
                </DetailRow>
                <DetailRow label="Total contenedores">
                  {t.containerCount ?? "—"}
                </DetailRow>
                <DetailRow label="CO₂ estimado">
                  {t.co2Emission ? `${t.co2Emission} t` : "—"}
                </DetailRow>
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
                  {t.dateOfLoadingInitial &&
                  t.dateOfLoadingInitial !== t.etd ? (
                    <span className="ml-1 text-xs text-muted-foreground">
                      (inicial: {formatDate(t.dateOfLoadingInitial)})
                    </span>
                  ) : null}
                </DetailRow>
                <DetailRow label="ETA">
                  {formatDate(t.eta)}
                  {t.dateOfDischargeInitial &&
                  t.dateOfDischargeInitial !== t.eta ? (
                    <span className="ml-1 text-xs text-muted-foreground">
                      (inicial: {formatDate(t.dateOfDischargeInitial)})
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
                <DetailRow label="Viaje actual">
                  {t.currentVoyage ?? "—"}
                </DetailRow>
              </div>
            </section>

            {containers.length ? (
              <section className="space-y-3">
                <SectionTitle>
                  Contenedores ({containers.length})
                </SectionTitle>
                <div className="space-y-3">
                  {containers.map((c) => (
                    <ContainerCard key={c.number} c={c} />
                  ))}
                </div>
              </section>
            ) : null}

            {followers.length ? (
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

            {t.checkedAt || t.discardedAt ? (
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
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cerrar
          </Button>
          <Button
            type="button"
            onClick={onRefresh}
            disabled={bookingId === null || refreshMutation.isPending}
          >
            {refreshMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Refrescando…
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Refrescar desde ShipsGo
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
