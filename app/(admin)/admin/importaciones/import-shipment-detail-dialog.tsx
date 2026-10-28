"use client";

import { Loader2 } from "lucide-react";

import { StatusBadge } from "@/components/status-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useImportShipment } from "@/lib/hooks/use-import-shipments";
import { cn } from "@/lib/utils";
import { formatDate, formatDateTime } from "@/lib/utils/format";
import type { ImportShipment } from "@/types/domain";

import {
  shipmentStatusLabel,
  shipmentStatusTone,
} from "../shipments-tracking/_status";
import { ImportShipmentTabs } from "./import-shipment-tabs";

const usd = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});
const num = new Intl.NumberFormat("es-CL", { maximumFractionDigits: 2 });

function formatUsd(value: number | null): string {
  return value === null || value === undefined ? "—" : usd.format(value);
}

function formatNum(value: number | null, suffix = ""): string {
  return value === null || value === undefined
    ? "—"
    : `${num.format(value)}${suffix}`;
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium break-words">{value || "—"}</p>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
        {children}
      </div>
    </section>
  );
}

export function ImportShipmentDetailDialog({
  open,
  onOpenChange,
  shipment,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shipment: ImportShipment | null;
}) {
  // La fila del listado ya trae todo; el detalle sólo refresca en segundo plano.
  const { data, isFetching } = useImportShipment(shipment?.id, {
    enabled: open,
  });
  const s = data ?? shipment;
  const salesExecutive = s?.salesExecutiveName || s?.salesExecutiveText;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {s?.name ? `Importación ${s.name}` : "Importación"}
            {isFetching ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : null}
          </DialogTitle>
          <DialogDescription>
            Datos sincronizados desde Odoo.
            {s?.syncedAt ? (
              <>
                {" "}
                Última sincronización:{" "}
                <span className="text-foreground">
                  {formatDateTime(s.syncedAt)}
                </span>
              </>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        {!s ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            Sin datos.
          </div>
        ) : (
          <div className="min-w-0 space-y-5">
            {s.alertMessage ? (
              <Alert>
                <AlertTitle>Alerta</AlertTitle>
                <AlertDescription>{s.alertMessage}</AlertDescription>
              </Alert>
            ) : null}

            <Section title="Embarque">
              <Field label="Operación" value={s.name} />
              <Field label="HBL" value={s.hbl} />
              <Field label="Booking" value={s.booking} />
              <Field
                label="ShipsGo"
                value={
                  s.shipsgoStatus ? (
                    <StatusBadge
                      tone={shipmentStatusTone(s.shipsgoStatus)}
                      icon={null}
                    >
                      {shipmentStatusLabel(s.shipsgoStatus)}
                    </StatusBadge>
                  ) : (
                    "No integrada"
                  )
                }
              />
              <Field
                label="Estado"
                value={
                  s.subStateLabel ? (
                    <StatusBadge tone="neutral" icon={null}>
                      {s.subStateLabel}
                    </StatusBadge>
                  ) : null
                }
              />
              <Field label="Naviera" value={s.carrierName} />
              <Field label="Puerto origen" value={s.portOrigin} />
              <Field label="Puerto destino" value={s.portDestination} />
              <Field label="ETD" value={formatDate(s.etd)} />
              <Field label="ETA" value={formatDate(s.eta)} />
              <Field label="Tipo de embarque" value={s.shipmentTypeLabel} />
              <Field label="Tipo de servicio" value={s.serviceTypeLabel} />
              <Field label="Tipo de contenedor" value={s.containerTypeLabel} />
              <Field label="Emisión BL" value={s.blIssuePlaceLabel} />
            </Section>

            <Separator />

            <Section title="Comercial">
              <Field label="Consignatario" value={s.consigneeName} />
              <Field label="Compañía" value={s.companyName} />
              <Field label="Responsable" value={s.responsibleName} />
              <Field label="Ejecutivo comercial" value={salesExecutive} />
              <Field
                label="Vigencia tarifa"
                value={
                  s.rateValidityDate ? (
                    <span
                      className={cn(s.rateExpired && "text-brand-danger")}
                    >
                      {formatDate(s.rateValidityDate)}
                      {s.rateExpired ? " (vencida)" : ""}
                    </span>
                  ) : null
                }
              />
              <Field label="Mes contable" value={s.accountingMonthLabel} />
            </Section>

            <Separator />

            <Section title="Costeo y carga">
              <Field label="Ingreso total" value={formatUsd(s.totalIncome)} />
              <Field label="Costo total" value={formatUsd(s.totalCost)} />
              <Field
                label="Margen proyectado"
                value={formatUsd(s.projectedMargin)}
              />
              <Field
                label="Costeo"
                value={
                  s.costingLocked
                    ? `Cerrado${s.costingLockedAt ? ` · ${formatDate(s.costingLockedAt)}` : ""}`
                    : "Abierto"
                }
              />
              <Field label="Cuenta analítica" value={s.analyticAccountName} />
              <Field label="Cant. cotizada" value={formatNum(s.quotedQty)} />
              <Field label="Cant. real" value={formatNum(s.realQty)} />
              <Field label="Diferencia" value={formatNum(s.qtyDeltaPct, "%")} />
              <Field
                label="Peso bruto"
                value={formatNum(s.grossWeightKg, " kg")}
              />
            </Section>

            <Separator />

            <ImportShipmentTabs shipment={s} open={open} />
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
