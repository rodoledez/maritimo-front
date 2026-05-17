"use client";

import { Loader2, RefreshCw } from "lucide-react";
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
import { StatusBadge, type StatusTone } from "@/components/status-badge";
import {
  useRefreshShipmentTracking,
  useShipmentTracking,
} from "@/lib/hooks/use-shipments-tracking";
import { errorMessage } from "@/lib/utils/errors";
import { formatDate, formatDateTime } from "@/lib/utils/format";
import type { ShipmentTracking } from "@/types/domain";

function statusTone(status?: string | null): StatusTone {
  switch (status) {
    case "Entregado":
    case "Llegado":
      return "success";
    case "EnTransito":
      return "warning";
    case "Registrado":
      return "pending";
    case "Error":
      return "danger";
    default:
      return "neutral";
  }
}

function statusLabel(status?: string | null): string {
  if (!status) return "—";
  if (status === "EnTransito") return "En tránsito";
  return status;
}

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
    <h3 className="text-sm font-semibold text-secondary">{children}</h3>
  );
}

export function TrackingDetailDialog({
  open,
  onOpenChange,
  tracking,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tracking: ShipmentTracking | null;
}) {
  const bookingId = tracking?.bookingId;
  const { data: fresh, isFetching } = useShipmentTracking(
    open ? bookingId : undefined
  );
  const refreshMutation = useRefreshShipmentTracking();
  const t = fresh ?? tracking;

  const onRefresh = async () => {
    if (!t) return;
    try {
      await refreshMutation.mutateAsync(t.bookingId);
      toast.success("Tracking actualizado desde ShipsGo");
    } catch (e) {
      toast.error(errorMessage(e, "No se pudo refrescar el tracking"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            Tracking · Booking #{t?.bookingId ?? "—"}
          </DialogTitle>
          <DialogDescription>
            Datos obtenidos desde ShipsGo.{" "}
            {t?.lastUpdated ? (
              <>
                Última actualización:{" "}
                <span className="text-foreground">
                  {formatDateTime(t.lastUpdated)}
                </span>
              </>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        {!t ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            {isFetching ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <span className="text-sm">Sin datos de tracking.</span>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-3">
              <StatusBadge tone={statusTone(t.status)} icon={null}>
                {statusLabel(t.status)}
              </StatusBadge>
              {t.shipsgoId ? (
                <span className="font-mono text-xs text-muted-foreground">
                  ShipsGo ID: {t.shipsgoId}
                </span>
              ) : null}
            </div>

            <section className="space-y-3">
              <SectionTitle>Booking y carga</SectionTitle>
              <div className="grid gap-4 sm:grid-cols-3">
                <DetailRow label="Booking N°">
                  {t.bookingNumber ?? `#${t.bookingId}`}
                </DetailRow>
                <DetailRow label="BL">
                  {t.bl ?? "—"}
                </DetailRow>
                <DetailRow label="Contenedor">
                  <span className="font-mono">
                    {t.containerNumber ?? "—"}
                  </span>
                </DetailRow>
                <DetailRow label="Carrier">
                  {t.carrierName ?? t.carrier ?? "—"}
                </DetailRow>
                <DetailRow label="Motonave">{t.vessel ?? "—"}</DetailRow>
                <DetailRow label="Viaje">{t.voyageNo ?? "—"}</DetailRow>
              </div>
            </section>

            <section className="space-y-3">
              <SectionTitle>Ruta y fechas</SectionTitle>
              <div className="grid gap-4 sm:grid-cols-2">
                <DetailRow label="Puerto de zarpe (POL)">
                  {t.portOfLoading ?? "—"}
                </DetailRow>
                <DetailRow label="Puerto de destino (POD)">
                  {t.portOfDischarge ?? "—"}
                </DetailRow>
                <DetailRow label="ETD">{formatDate(t.etd)}</DetailRow>
                <DetailRow label="ETA">{formatDate(t.eta)}</DetailRow>
              </div>
            </section>

            {(t.followers?.length || t.tags?.length) ? (
              <section className="space-y-3">
                <SectionTitle>ShipsGo</SectionTitle>
                <div className="grid gap-4 sm:grid-cols-2">
                  {t.followers?.length ? (
                    <DetailRow label="Seguidores">
                      <div className="flex flex-wrap gap-1.5">
                        {t.followers.map((f) => (
                          <span
                            key={f}
                            className="rounded-md bg-muted px-2 py-0.5 text-xs"
                          >
                            {f}
                          </span>
                        ))}
                      </div>
                    </DetailRow>
                  ) : null}
                  {t.tags?.length ? (
                    <DetailRow label="Tags">
                      <div className="flex flex-wrap gap-1.5">
                        {t.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-md bg-brand-celeste px-2 py-0.5 text-xs text-secondary"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </DetailRow>
                  ) : null}
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
            disabled={!t || refreshMutation.isPending}
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
