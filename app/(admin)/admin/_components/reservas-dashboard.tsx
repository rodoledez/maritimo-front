"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Inbox,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookingStatusBadge } from "@/components/booking/status-badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { pickKpi, useKpis } from "@/lib/hooks/use-kpis";
import { useRecentReservas } from "@/lib/hooks/use-reservas";
import type { Booking } from "@/types/domain";

type Tone = "warning" | "success" | "danger" | "muted";

const TONE_CLASS: Record<Tone, string> = {
  warning: "bg-brand-warning/10 text-brand-warning",
  success: "bg-brand-success/10 text-brand-success",
  danger: "bg-brand-danger/10 text-brand-danger",
  muted: "bg-muted text-muted-foreground",
};

function StatCard({
  title,
  subtitle,
  value,
  icon: Icon,
  tone,
  loading,
}: {
  title: string;
  subtitle: string;
  value: number | null;
  icon: typeof Clock;
  tone: Tone;
  loading: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <span
          className={`flex h-9 w-9 items-center justify-center rounded-full ${TONE_CLASS[tone]}`}
        >
          <Icon className="h-4 w-4" />
        </span>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-9 w-20" />
        ) : (
          <div className="text-3xl font-semibold tracking-tight tabular-nums">
            {formatNumber(value)}
          </div>
        )}
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

const dateFormatter = new Intl.DateTimeFormat("es-CL", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const numberFormatter = new Intl.NumberFormat("es-CL");

function formatNumber(value: number | null) {
  return value === null ? "—" : numberFormatter.format(value);
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return dateFormatter.format(date);
}

function RecentReservasCard() {
  const { data, isPending, isError, refetch } = useRecentReservas(10);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Últimas reservas</CardTitle>
        <Button asChild variant="ghost" size="sm" className="gap-1">
          <Link href="/admin/reservas">
            Ver todas
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="w-[100px]">Nro.</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="hidden md:table-cell">Naviera</TableHead>
                <TableHead className="hidden lg:table-cell">M/N</TableHead>
                <TableHead className="text-right tabular-nums">ETD</TableHead>
                <TableHead className="text-right tabular-nums">ETA</TableHead>
                <TableHead className="w-[120px]">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isPending ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((__, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center">
                    <p className="text-sm text-muted-foreground">
                      No se pudieron cargar las reservas.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => refetch()}
                    >
                      Reintentar
                    </Button>
                  </TableCell>
                </TableRow>
              ) : data && data.length > 0 ? (
                data.map((booking: Booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-mono text-xs">
                      {booking.id}
                    </TableCell>
                    <TableCell className="max-w-[220px] truncate">
                      {booking.Client?.name ?? "—"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {booking.Itinerary?.carrier ?? "—"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {booking.Itinerary?.containerShip ?? "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatDate(booking.Itinerary?.etd)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatDate(booking.Itinerary?.eta)}
                    </TableCell>
                    <TableCell>
                      <BookingStatusBadge status={booking.status} />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center">
                    <Inbox className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      No hay reservas registradas.
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

export function ReservasDashboard() {
  const { data, isLoading } = useKpis();

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Reservas pendientes"
          subtitle="Hoy"
          value={pickKpi(data, "Today", "Pendiente")}
          icon={AlertTriangle}
          tone="warning"
          loading={isLoading}
        />
        <StatCard
          title="Reservas confirmadas"
          subtitle="Hoy"
          value={pickKpi(data, "Today", "Confirmado")}
          icon={CheckCircle2}
          tone="success"
          loading={isLoading}
        />
        <StatCard
          title="Reservas pendientes"
          subtitle="Total"
          value={pickKpi(data, "Total", "Pendiente")}
          icon={Clock}
          tone="muted"
          loading={isLoading}
        />
        <StatCard
          title="Reservas canceladas"
          subtitle="Total"
          value={pickKpi(data, "Total", "Cancelado")}
          icon={XCircle}
          tone="danger"
          loading={isLoading}
        />
      </section>

      <RecentReservasCard />
    </div>
  );
}
