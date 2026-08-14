"use client";

import { useState } from "react";
import { ChevronDown, Radio } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  NOTIFICATION_EVENT_TYPES,
  eventShipsgoMovement,
  eventTypeLabel,
} from "@/lib/notifications/constants";
import { cn } from "@/lib/utils";

/**
 * Explica que el `eventType` de una regla / plantilla ES el hito de ShipsGo:
 * los 7 valores del enum mapean 1:1 contra los movimientos de la API.
 */
export function ShipsgoEventMap({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Card size="sm" className={className}>
      <CardHeader className="grid-cols-[auto_1fr_auto] items-center gap-3">
        <Radio className="h-4 w-4 text-muted-foreground" />
        <CardTitle className="font-normal">
          El <span className="font-medium">evento</span> de la regla es el hito
          de ShipsGo: los 7 valores mapean 1:1 contra los movimientos que
          devuelve la API de tracking.
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          {open ? "Ocultar" : "Ver equivalencias"}
          <ChevronDown
            className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
          />
        </Button>
      </CardHeader>

      {open ? (
        <CardContent>
          <div className="overflow-x-auto rounded-lg ring-1 ring-foreground/10">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">eventType</th>
                  <th className="px-3 py-2 text-left font-medium">
                    Movimiento ShipsGo
                  </th>
                  <th className="px-3 py-2 text-left font-medium">Significado</th>
                </tr>
              </thead>
              <tbody>
                {NOTIFICATION_EVENT_TYPES.map((evt) => {
                  const movement = eventShipsgoMovement(evt);
                  return (
                    <tr key={evt} className="border-t border-foreground/10">
                      <td className="px-3 py-2">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-mono text-xs">{evt}</span>
                          <span className="text-xs text-muted-foreground">
                            {eventTypeLabel(evt)}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <Badge variant="outline" className="font-mono text-xs">
                          {movement.code}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {movement.description}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            No hay que configurar la equivalencia: al llegar un movimiento desde
            ShipsGo, el dispatcher lo traduce al <code>eventType</code>{" "}
            correspondiente y evalúa las reglas activas de ese evento.
          </p>
        </CardContent>
      ) : null}
    </Card>
  );
}
