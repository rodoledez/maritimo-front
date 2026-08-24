"use client";

import { AlertTriangle, Loader2, Send } from "lucide-react";

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
import { Skeleton } from "@/components/ui/skeleton";
import { useWeeklySummaryPreview } from "@/lib/hooks/use-weekly-summary";
import { scheduleSlotLabel } from "@/lib/notifications/weekly-summary";
import { errorMessage } from "@/lib/utils/errors";
import { formatDateTimeInZone } from "@/lib/utils/format";

function RecipientList({ label, emails }: { label: string; emails: string[] }) {
  return (
    <div className="space-y-1">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      {emails.length === 0 ? (
        <p className="text-sm text-muted-foreground">—</p>
      ) : (
        <div className="flex flex-wrap gap-1">
          {emails.map((email) => (
            <Badge key={email} variant="outline" className="font-normal">
              {email}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * `GET /weekly-summary/preview/:clientId` — renderiza el correo sin enviarlo ni
 * escribir nada, y funciona aunque el cliente no tenga programación.
 */
export function WeeklySummaryPreviewDialog({
  open,
  onOpenChange,
  clientId,
  clientName,
  onSend,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: number | null;
  clientName?: string | null;
  onSend?: (clientId: number) => void;
}) {
  const { data, isLoading, error, refetch, isFetching } =
    useWeeklySummaryPreview(clientId, { enabled: open });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>
            Vista previa · {data?.clientName ?? clientName ?? "Cliente"}
          </DialogTitle>
          <DialogDescription>
            Así se vería el correo ahora mismo. No se envía ni se registra nada.
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <Alert variant="destructive">
            <AlertTitle>No se pudo generar la vista previa</AlertTitle>
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

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-[45vh] w-full" />
          </div>
        ) : data ? (
          <div className="space-y-4">
            {/* Los destinatarios van arriba: es la duda real antes de programar. */}
            <section className="grid gap-4 rounded-lg border bg-muted/30 p-4 sm:grid-cols-2">
              <RecipientList label="Para" emails={data.recipients.to} />
              <RecipientList label="Copia" emails={data.recipients.cc} />
            </section>

            <section className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              <span>
                <span className="text-muted-foreground">Embarques: </span>
                <span className="font-medium tabular-nums">
                  {data.shipmentCount}
                </span>
              </span>
              <span>
                <span className="text-muted-foreground">Contenedores: </span>
                <span className="font-medium tabular-nums">
                  {data.containerCount}
                </span>
              </span>
              <span>
                <span className="text-muted-foreground">Plantilla: </span>
                <span className="font-mono text-xs">
                  {data.templateId !== null ? `#${data.templateId}` : "global"}
                </span>
              </span>
              {data.schedule ? (
                <span>
                  <span className="text-muted-foreground">Programación: </span>
                  <span className="font-medium">
                    {scheduleSlotLabel(data.schedule)}
                  </span>
                  {data.schedule.nextSlotAt ? (
                    <span className="text-muted-foreground">
                      {" · próximo "}
                      {formatDateTimeInZone(
                        data.schedule.nextSlotAt,
                        data.schedule.timezone
                      )}
                    </span>
                  ) : null}
                </span>
              ) : (
                <Badge variant="outline" className="font-normal">
                  Sin programación
                </Badge>
              )}
            </section>

            {data.truncated ? (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>El correo muestra sólo parte de la lista</AlertTitle>
                <AlertDescription>
                  El cliente tiene {data.shipmentCount} embarques en curso; por
                  el tope de peso del correo se incluyen sólo los primeros.
                </AlertDescription>
              </Alert>
            ) : null}

            <section className="space-y-2">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Asunto
              </p>
              <p className="text-sm font-medium">{data.subject}</p>
            </section>

            {/*
              `html` es un documento completo con su propio <style>: va en un
              iframe aislado para que el CSS del correo no se derrame sobre el
              admin.
            */}
            <iframe
              title="Vista previa del correo"
              srcDoc={data.html}
              sandbox=""
              className="h-[50vh] w-full rounded-lg border bg-white"
            />
          </div>
        ) : null}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cerrar
          </Button>
          {onSend && clientId !== null ? (
            <Button
              type="button"
              onClick={() => onSend(clientId)}
              disabled={isLoading || !!error}
            >
              {isFetching && !isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Enviar ahora
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
