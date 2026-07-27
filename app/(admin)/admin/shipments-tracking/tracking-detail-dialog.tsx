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
import {
  useRefreshShipmentTracking,
  useShipmentTrackingDetail,
} from "@/lib/hooks/use-shipments-tracking";
import { errorMessage } from "@/lib/utils/errors";
import { formatDateTime } from "@/lib/utils/format";
import type { ShipmentTracking } from "@/types/domain";

import { ShipsgoTrackingPanel } from "./shipsgo-tracking-panel";

export function TrackingDetailDialog({
  open,
  onOpenChange,
  tracking,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tracking: ShipmentTracking | null;
}) {
  const shipmentId = tracking?.id ?? null;
  const { data, isFetching } = useShipmentTrackingDetail(
    shipmentId ?? undefined,
    { enabled: open && shipmentId !== null }
  );
  const refreshMutation = useRefreshShipmentTracking();
  const t = data?.tracking ?? tracking;
  const containers = data?.containers ?? [];
  const followers = data?.followers ?? [];

  const onRefresh = async () => {
    if (shipmentId === null) return;
    try {
      await refreshMutation.mutateAsync(shipmentId);
      toast.success("Tracking actualizado desde ShipsGo");
    } catch (e) {
      toast.error(errorMessage(e, "No se pudo refrescar el tracking"));
    }
  };

  const title = t
    ? `Tracking · ShipsGo #${t.shipsgoId}${t.bookingId !== null ? ` · Booking #${t.bookingId}` : ""}`
    : "Tracking";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
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
            {t && t.bookingId === null ? (
              <span className="ml-1 text-muted-foreground">
                · Sin booking local asociado.
              </span>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        {!t ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            Sin datos de tracking.
          </div>
        ) : (
          <ShipsgoTrackingPanel
            tracking={t}
            containers={containers}
            followers={followers}
            isFetching={isFetching}
          />
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
            disabled={shipmentId === null || refreshMutation.isPending}
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
