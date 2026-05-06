"use client";

import { AlertTriangle, CheckCircle2, Clock, XCircle } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth/auth-context";
import { pickKpi, useKpis } from "@/lib/hooks/use-kpis";

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
          <div className="text-3xl font-semibold tracking-tight">
            {value ?? "—"}
          </div>
        )}
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const { data, isLoading } = useKpis();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          <span className="text-secondary">Bienvenido</span>
          {user?.name ? `, ${user.name}` : ""}
        </h1>
        <p className="text-sm text-muted-foreground">
          Resumen de reservas marítimas
        </p>
      </div>

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

      <Card>
        <CardHeader>
          <CardTitle>Últimas reservas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Listado de reservas pendiente de implementación. Use el patrón de{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              /admin/clientes
            </code>{" "}
            para construir la tabla.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
