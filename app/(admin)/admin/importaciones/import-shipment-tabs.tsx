"use client";

import {
  Bell,
  BellRing,
  Info,
  Loader2,
  Mail,
  MailWarning,
  MapPin,
  Phone,
  RefreshCw,
  Ship,
  Smartphone,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useImportShipmentMilestones,
  useIntegrateImportShipmentWithShipsgo,
  useRefreshImportShipmentTracking,
} from "@/lib/hooks/use-import-shipments";
import { useNotificationLogs } from "@/lib/hooks/use-notifications";
import { useShipmentTrackingDetail } from "@/lib/hooks/use-shipments-tracking";
import { cn } from "@/lib/utils";
import { errorMessage } from "@/lib/utils/errors";
import { formatDateTime } from "@/lib/utils/format";
import type { ImportShipment, OdooConsigneeContact } from "@/types/domain";

import { BookingMilestonesPanel } from "../reservas/booking-milestones-panel";
import { BookingNotificationsPanel } from "../reservas/booking-notifications-panel";
import { ShipsgoTrackingPanel } from "../shipments-tracking/shipsgo-tracking-panel";
import { contactEmails, receivesTracking, TRACKING_TAG } from "./_contacts";

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
        {receivesTracking(contact) ? (
          <Badge>
            <BellRing />
            Recibe hitos
          </Badge>
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

function ContactsPanel({ contacts }: { contacts: OdooConsigneeContact[] }) {
  const hasEmail = contactEmails(contacts).length > 0;
  return (
    <div className="space-y-2">
      {!hasEmail ? (
        <Alert variant="destructive">
          <MailWarning className="h-4 w-4" />
          <AlertTitle>Sin email</AlertTitle>
          <AlertDescription>
            Ningún contacto del consignatario tiene email registrado en Odoo.
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
    </div>
  );
}

/**
 * Quiénes reciben los emails automáticos de hitos: los contactos activos del
 * consignatario con la etiqueta `tracking` en Odoo y con email.
 */
function TrackingRecipientsNotice({
  contacts,
}: {
  contacts: OdooConsigneeContact[];
}) {
  const recipients = contacts.filter(
    (c) => c.active && receivesTracking(c) && c.email?.trim()
  );
  return (
    <Alert>
      <Info className="h-4 w-4" />
      <AlertTitle>
        {recipients.length
          ? `Los hitos se avisan a ${recipients.length} ${recipients.length === 1 ? "contacto" : "contactos"}`
          : "Ningún contacto recibe los hitos"}
      </AlertTitle>
      <AlertDescription>
        <p>
          Los emails automáticos de hitos van a los contactos del consignatario
          que tienen la etiqueta «{TRACKING_TAG}» en Odoo.
          {recipients.length
            ? ` (${recipients.map((c) => c.email).join(", ")})`
            : " Mientras ningún contacto con email la tenga, los hitos quedan como omitidos."}
        </p>
        <p>Los hitos con más de 48 h de antigüedad no se envían por email.</p>
      </AlertDescription>
    </Alert>
  );
}

/**
 * Pestañas de la importación: contactos del consignatario y, cuando está
 * integrada con ShipsGo, hitos, tracking y log de notificaciones. Las
 * importaciones no tienen `bookingId`: todo se consulta por el id local de la
 * importación o por su `shipmentTrackingId`.
 */
export function ImportShipmentTabs({
  shipment,
  open,
}: {
  shipment: ImportShipment;
  open: boolean;
}) {
  const trackingId = shipment.shipmentTrackingId ?? undefined;
  const integrated = trackingId !== undefined;
  const hasBooking = !!shipment.booking?.trim();

  const {
    data: trackingDetail,
    isFetching: trackingFetching,
    error: trackingError,
    refetch: refetchTracking,
  } = useShipmentTrackingDetail(trackingId, { enabled: open && integrated });
  const {
    data: milestones = [],
    isLoading: milestonesLoading,
    isFetching: milestonesFetching,
    error: milestonesError,
    refetch: refetchMilestones,
  } = useImportShipmentMilestones(shipment.id, {
    enabled: open && integrated,
  });
  const {
    data: logsPage,
    isLoading: logsLoading,
    isFetching: logsFetching,
    error: logsError,
    refetch: refetchLogs,
  } = useNotificationLogs(
    { shipmentTrackingId: trackingId, take: 100 },
    { enabled: open && integrated }
  );
  const integrateMutation = useIntegrateImportShipmentWithShipsgo();
  const refreshMutation = useRefreshImportShipmentTracking();

  const onIntegrate = async () => {
    try {
      const result = await integrateMutation.mutateAsync(shipment.id);
      toast.success(
        result.message ||
          (result.alreadyIntegrated
            ? "La importación ya estaba integrada con ShipsGo"
            : "Importación integrada con ShipsGo")
      );
    } catch (e) {
      toast.error(errorMessage(e, "No se pudo integrar con ShipsGo"));
    }
  };

  const onRefresh = async () => {
    if (trackingId === undefined) return;
    try {
      await refreshMutation.mutateAsync(trackingId);
      toast.success("Tracking actualizado desde ShipsGo");
    } catch (e) {
      toast.error(errorMessage(e, "No se pudo refrescar el tracking"));
    }
  };

  const contacts = shipment.contacts ?? [];
  const logs = logsPage?.rows ?? [];
  const tracking = trackingDetail?.tracking ?? null;

  const notIntegrated = (
    <div className="flex flex-col items-start gap-3 rounded-md border border-dashed bg-muted/30 p-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Ship className="h-4 w-4" />
        {hasBooking
          ? "Esta importación aún no está integrada con ShipsGo."
          : "Sin booking en Odoo: no se puede integrar con ShipsGo."}
      </div>
      {hasBooking ? (
        <>
          <p className="text-xs text-muted-foreground">
            Se registra en ShipsGo con el booking {shipment.booking}. Consume 1
            crédito de ShipsGo.
          </p>
          <Button
            type="button"
            size="sm"
            onClick={onIntegrate}
            disabled={integrateMutation.isPending}
          >
            {integrateMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Integrando…
              </>
            ) : (
              <>
                <Ship className="h-4 w-4" />
                Integrar con ShipsGo
              </>
            )}
          </Button>
        </>
      ) : null}
    </div>
  );

  return (
    <Tabs defaultValue={integrated ? "milestones" : "contacts"}>
      <TabsList>
        <TabsTrigger value="contacts">
          <Users />
          Contactos ({contacts.length})
        </TabsTrigger>
        <TabsTrigger value="milestones">
          <MapPin />
          Hitos{milestones.length > 0 ? ` (${milestones.length})` : ""}
        </TabsTrigger>
        <TabsTrigger value="tracking">
          <Ship />
          Tracking
        </TabsTrigger>
        <TabsTrigger value="notifications">
          <Bell />
          Notificaciones{logs.length > 0 ? ` (${logs.length})` : ""}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="contacts" className="mt-4">
        <ContactsPanel contacts={contacts} />
      </TabsContent>

      <TabsContent value="milestones" className="mt-4">
        {integrated ? (
          <BookingMilestonesPanel
            milestones={milestones}
            isLoading={milestonesLoading}
            isFetching={milestonesFetching}
            error={milestonesError}
            onRetry={() => refetchMilestones()}
          />
        ) : (
          notIntegrated
        )}
      </TabsContent>

      <TabsContent value="tracking" className="mt-4">
        {!integrated ? (
          notIntegrated
        ) : trackingError && !tracking ? (
          <Alert variant="destructive">
            <AlertTitle>No se pudo cargar el tracking</AlertTitle>
            <AlertDescription className="flex items-center justify-between gap-3">
              <span>{errorMessage(trackingError, "Error desconocido")}</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => refetchTracking()}
                disabled={trackingFetching}
              >
                Reintentar
              </Button>
            </AlertDescription>
          </Alert>
        ) : tracking ? (
          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                {tracking.lastSyncedAt ? (
                  <>
                    Última sincronización:{" "}
                    <span className="text-foreground">
                      {formatDateTime(tracking.lastSyncedAt)}
                    </span>
                  </>
                ) : null}
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={onRefresh}
                disabled={refreshMutation.isPending}
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
            </div>
            <ShipsgoTrackingPanel
              tracking={tracking}
              containers={trackingDetail?.containers ?? []}
              followers={trackingDetail?.followers ?? []}
              isFetching={trackingFetching}
              // Las importaciones no tienen itinerario: no hay nave de respaldo.
              fallbackVessel={{ name: null, voyage: null }}
            />
          </section>
        ) : (
          <div className="flex items-center justify-center py-6 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="ml-2 text-sm">Buscando tracking…</span>
          </div>
        )}
      </TabsContent>

      <TabsContent value="notifications" className="mt-4 space-y-3">
        <TrackingRecipientsNotice contacts={contacts} />
        {integrated ? (
          <BookingNotificationsPanel
            logs={logs}
            isLoading={logsLoading}
            isFetching={logsFetching}
            error={logsError}
            onRetry={() => refetchLogs()}
            emptyMessage="No se han enviado notificaciones para esta importación."
          />
        ) : (
          notIntegrated
        )}
      </TabsContent>
    </Tabs>
  );
}
