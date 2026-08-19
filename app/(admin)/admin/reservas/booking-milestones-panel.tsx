"use client";

import { Loader2, MapPin } from "lucide-react";

import { StatusBadge } from "@/components/status-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  eventTypeLabel,
  milestoneNotifyLabel,
  milestoneNotifyTone,
} from "@/lib/notifications/constants";
import { errorMessage } from "@/lib/utils/errors";
import { formatDateTime } from "@/lib/utils/format";
import type { BookingMilestone } from "@/types/domain";

/** Hora local (HH:mm) de `notifiedAt`, para acompañar el badge "Avisado". */
function timeOnly(value: string | null | undefined): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function NotifyBadge({ milestone }: { milestone: BookingMilestone }) {
  const notifiedTime =
    milestone.notifyState === "SENT" ? timeOnly(milestone.notifiedAt) : null;
  const badge = (
    <StatusBadge tone={milestoneNotifyTone(milestone.notifyState)} icon={null}>
      {milestoneNotifyLabel(milestone.notifyState)}
      {notifiedTime ? (
        <span className="font-mono tabular-nums opacity-80">
          {notifiedTime}
        </span>
      ) : null}
    </StatusBadge>
  );

  // El motivo de un hito omitido solo viaja en `notifyNote`.
  if (milestone.notifyState === "SKIPPED" && milestone.notifyNote) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-help">{badge}</span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          {milestone.notifyNote}
        </TooltipContent>
      </Tooltip>
    );
  }

  if (milestone.notifyState === "PENDING") {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-help">{badge}</span>
        </TooltipTrigger>
        <TooltipContent>
          El sistema reintenta el aviso automáticamente.
        </TooltipContent>
      </Tooltip>
    );
  }

  return badge;
}

function MilestoneRow({ milestone }: { milestone: BookingMilestone }) {
  return (
    <li className="group relative flex gap-4 pb-5 last:pb-0">
      {/* Línea del timeline: no se dibuja bajo el último hito. */}
      <span
        aria-hidden
        className="absolute left-[5px] top-3 h-full w-px bg-border group-last:hidden"
      />
      <span
        aria-hidden
        className="relative z-10 mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-primary"
      />
      <div className="flex flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">
              {eventTypeLabel(milestone.eventType)}
            </span>
            {milestone.sequence > 1 ? (
              <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                Transbordo {milestone.sequence}
              </span>
            ) : null}
          </div>
          <span className="font-mono text-xs tabular-nums text-muted-foreground">
            {formatDateTime(milestone.occurredAt)}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-xs text-muted-foreground">
            {milestone.locationName ?? "—"}
          </span>
          {milestone.containerNumber ? (
            <span className="font-mono text-xs text-muted-foreground">
              {milestone.containerNumber}
            </span>
          ) : null}
          <NotifyBadge milestone={milestone} />
        </div>
      </div>
    </li>
  );
}

/**
 * Timeline de hitos informados por ShipsGo para una reserva. La lista llega ya
 * ordenada del hito más antiguo al más reciente y se muestra completa: los
 * hitos sin correo (`PENDING`, `SUPPRESSED_BACKLOG`, `SKIPPED`) también se ven.
 */
export function BookingMilestonesPanel({
  milestones,
  isLoading,
  isFetching,
  error,
  onRetry,
}: {
  milestones: BookingMilestone[];
  isLoading: boolean;
  isFetching: boolean;
  error: unknown;
  onRetry: () => void;
}) {
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>No se pudieron cargar los hitos</AlertTitle>
        <AlertDescription className="flex items-center justify-between gap-3">
          <span>{errorMessage(error, "Error desconocido")}</span>
          <Button
            size="sm"
            variant="outline"
            onClick={onRetry}
            disabled={isFetching}
          >
            Reintentar
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (milestones.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-md border border-dashed bg-muted/30 p-6 text-center text-muted-foreground">
        <MapPin className="h-6 w-6" />
        <p className="text-sm">Sin hitos informados aún.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {isFetching ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Actualizando…
        </div>
      ) : null}
      <ol className="rounded-lg border p-4">
        {milestones.map((m, i) => (
          <MilestoneRow
            key={m.id ?? `${m.eventType}-${m.occurredAt}-${m.sequence}-${i}`}
            milestone={m}
          />
        ))}
      </ol>
    </div>
  );
}
