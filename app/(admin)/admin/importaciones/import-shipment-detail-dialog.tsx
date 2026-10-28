"use client";

import { Loader2, Mail, MailWarning, Phone, Smartphone } from "lucide-react";

import { StatusBadge } from "@/components/status-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
import type { ImportShipment, OdooConsigneeContact } from "@/types/domain";

import { contactEmails } from "./_contacts";

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

function ContactCard({ contact }: { contact: OdooConsigneeContact }) {
  return (
    <li
      className={cn(
        "space-y-1.5 rounded-lg border p-3",
        !contact.active && "opacity-60"
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">{contact.name || "Sin nombre"}</span>
        {contact.isConsignee ? (
          <Badge variant="secondary">Consignatario</Badge>
        ) : null}
        {!contact.active ? <Badge variant="outline">Archivado</Badge> : null}
        {contact.typeLabel ? (
          <span className="text-xs text-muted-foreground">
            {contact.typeLabel}
          </span>
        ) : null}
      </div>
      {contact.jobTitle ? (
        <p className="text-xs text-muted-foreground">{contact.jobTitle}</p>
      ) : null}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
        {contact.email ? (
          <a
            href={`mailto:${contact.email}`}
            className="inline-flex items-center gap-1 break-all text-primary hover:underline"
          >
            <Mail className="h-3.5 w-3.5 shrink-0" />
            {contact.email}
          </a>
        ) : (
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <Mail className="h-3.5 w-3.5" />
            Sin email
          </span>
        )}
        {contact.phone ? (
          <a
            href={`tel:${contact.phone}`}
            className="inline-flex items-center gap-1 hover:underline"
          >
            <Phone className="h-3.5 w-3.5" />
            {contact.phone}
          </a>
        ) : null}
        {contact.mobile ? (
          <a
            href={`tel:${contact.mobile}`}
            className="inline-flex items-center gap-1 hover:underline"
          >
            <Smartphone className="h-3.5 w-3.5" />
            {contact.mobile}
          </a>
        ) : null}
      </div>
      {contact.tags.length ? (
        <div className="flex flex-wrap gap-1">
          {contact.tags.map((tag) => (
            <Badge key={tag.id} variant="outline">
              {tag.name}
            </Badge>
          ))}
        </div>
      ) : null}
    </li>
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
  const contacts = s?.contacts ?? [];
  const hasEmail = contactEmails(contacts).length > 0;
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

            <section className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Contactos del consignatario ({contacts.length})
              </h3>
              {!hasEmail ? (
                <Alert variant="destructive">
                  <MailWarning className="h-4 w-4" />
                  <AlertTitle>Sin email</AlertTitle>
                  <AlertDescription>
                    Ningún contacto del consignatario tiene email registrado en
                    Odoo.
                  </AlertDescription>
                </Alert>
              ) : null}
              {contacts.length ? (
                <ul className="grid gap-2 sm:grid-cols-2">
                  {contacts.map((contact) => (
                    <ContactCard key={contact.id} contact={contact} />
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  El consignatario no tiene contactos sincronizados.
                </p>
              )}
            </section>
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
