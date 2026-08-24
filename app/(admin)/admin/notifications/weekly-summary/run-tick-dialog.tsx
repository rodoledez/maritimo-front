"use client";

import { useState } from "react";
import { AlertTriangle, Loader2, Play } from "lucide-react";
import { toast } from "sonner";

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
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRunWeeklySummaryTick } from "@/lib/hooks/use-weekly-summary";
import {
  weeklySummaryStatusLabel,
  weeklySummaryStatusTone,
} from "@/lib/notifications/weekly-summary";
import { errorMessage } from "@/lib/utils/errors";
import type { WeeklySummaryTickResult } from "@/types/domain";

const COUNTERS: Array<{ key: keyof WeeklySummaryTickResult; label: string }> = [
  { key: "schedules", label: "Programaciones" },
  { key: "due", label: "Corresponde enviar" },
  { key: "notDue", label: "Fuera de horario" },
  { key: "stale", label: "Vencidas" },
  { key: "sent", label: "Enviadas" },
  { key: "skipped", label: "Omitidas" },
  { key: "failed", label: "Fallidas" },
];

/**
 * `POST /weekly-summary/run-tick`. El dry run informa qué mandaría sin escribir
 * ni enviar — es la herramienta para verificar antes de encender la feature.
 * Sin dry run **envía correos de verdad**, por eso el switch arranca activado.
 */
export function RunTickDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/*
        El cuerpo va aparte porque `DialogContent` se desmonta al cerrar: así el
        estado (dry run, confirmación, resultado) arranca limpio en cada apertura
        sin resetearlo desde un efecto.
      */}
      <RunTickBody onClose={() => onOpenChange(false)} />
    </Dialog>
  );
}

function RunTickBody({ onClose }: { onClose: () => void }) {
  const [dryRun, setDryRun] = useState(true);
  const [confirmingReal, setConfirmingReal] = useState(false);
  const [result, setResult] = useState<WeeklySummaryTickResult | null>(null);
  const mutation = useRunWeeklySummaryTick();

  const run = async () => {
    if (!dryRun && !confirmingReal) {
      setConfirmingReal(true);
      return;
    }
    try {
      const data = await mutation.mutateAsync(dryRun);
      setResult(data);
      setConfirmingReal(false);
      toast.success(
        dryRun
          ? `Simulación: ${data.due} programación(es) corresponden ahora`
          : `Tick ejecutado: ${data.sent} enviadas · ${data.skipped} omitidas · ${data.failed} fallidas`
      );
    } catch (e) {
      toast.error(errorMessage(e, "No se pudo correr el tick"));
    }
  };

  const details = result?.details ?? [];

  return (
    <DialogContent className="max-w-4xl">
      <DialogHeader>
        <DialogTitle>Diagnóstico del envío semanal</DialogTitle>
        <DialogDescription>
          Evalúa todas las programaciones e informa cuáles corresponden ahora.
        </DialogDescription>
      </DialogHeader>

      <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
        <div className="space-y-1">
          <p className="text-sm font-medium">Simulación (dry run)</p>
          <p className="text-xs text-muted-foreground">
            Activado no escribe ni envía nada. Desactivado envía los correos
            de verdad a los clientes que correspondan.
          </p>
        </div>
        <Switch
          checked={dryRun}
          onCheckedChange={(v) => {
            setDryRun(v);
            setConfirmingReal(false);
          }}
          aria-label="Simulación"
        />
      </div>

      {!dryRun ? (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Se enviarán correos reales</AlertTitle>
          <AlertDescription>
            {confirmingReal
              ? "Vuelve a presionar «Correr tick» para confirmar."
              : "Todas las programaciones activas cuyo horario ya pasó recibirán su resumen."}
          </AlertDescription>
        </Alert>
      ) : null}

      {result ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {COUNTERS.map(({ key, label }) => (
              <div key={key} className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-lg font-semibold tabular-nums">
                  {Number(result[key] ?? 0)}
                </p>
              </div>
            ))}
          </div>

          {details.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="px-3">Cliente</TableHead>
                    <TableHead className="px-3">Estado</TableHead>
                    <TableHead className="px-3 text-right">
                      Embarques
                    </TableHead>
                    <TableHead className="px-3">Asunto / motivo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {details.map((d, i) => (
                    <TableRow key={`${d.scheduleId ?? d.clientId ?? i}`}>
                      <TableCell className="px-3 py-2 text-sm">
                        {d.clientName ??
                          (d.clientId ? `Cliente #${d.clientId}` : "—")}
                      </TableCell>
                      <TableCell className="px-3 py-2">
                        <StatusBadge
                          tone={weeklySummaryStatusTone(d.status)}
                          icon={null}
                        >
                          {weeklySummaryStatusLabel(d.status)}
                        </StatusBadge>
                      </TableCell>
                      <TableCell className="px-3 py-2 text-right text-sm tabular-nums">
                        {d.shipments ?? "—"}
                      </TableCell>
                      <TableCell className="px-3 py-2 text-sm text-muted-foreground">
                        {d.reason || d.subject || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No hay programaciones evaluadas en esta corrida.
            </p>
          )}
        </div>
      ) : null}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cerrar
        </Button>
        <Button
          type="button"
          onClick={run}
          disabled={mutation.isPending}
          variant={!dryRun && confirmingReal ? "destructive" : "default"}
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Corriendo…
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              {!dryRun && confirmingReal ? "Confirmar envío" : "Correr tick"}
            </>
          )}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
