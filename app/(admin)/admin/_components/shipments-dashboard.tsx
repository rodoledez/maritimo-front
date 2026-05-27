"use client";

import { useMemo, useState } from "react";
import {
  ArrowDownAZ,
  ArrowUpAZ,
  ClipboardList,
  Clock,
  Loader2,
  MoreHorizontal,
  PackageCheck,
  PackageOpen,
  RefreshCw,
  Search,
  Ship,
} from "lucide-react";
import { toast } from "sonner";

import { StatusBadge, type StatusTone } from "@/components/status-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useClients } from "@/lib/hooks/use-clients";
import { useShippingCompanies } from "@/lib/hooks/use-shipping-companies";
import {
  useActiveShipments,
  useDashboardKpis,
  useSyncShipmentsTracking,
} from "@/lib/hooks/use-shipments-tracking";
import { errorMessage } from "@/lib/utils/errors";
import { formatDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import type {
  ActiveShipmentRow,
  AlertLevel,
  ShipmentTracking,
  ShipmentTrackingStatus,
} from "@/types/domain";

import {
  shipmentStatusLabel,
  shipmentStatusTone,
} from "../shipments-tracking/_status";
import { TrackingDetailDialog } from "../shipments-tracking/tracking-detail-dialog";

function rowToTrackingStub(row: ActiveShipmentRow): ShipmentTracking {
  return {
    id: row.trackingId,
    bookingId: null,
    shipsgoId: "",
    reference: null,
    bookingNumber: row.bookingNumber,
    carrierScac: null,
    containerNumber: null,
    containerCount: row.numberOfContainers,
    status: row.lastStatus.code as ShipmentTrackingStatus,
    portOfLoading: row.origin,
    polCode: null,
    portOfDischarge: row.destination,
    podCode: null,
    etd: null,
    eta: row.etaVsPlan.eta,
    dateOfLoadingInitial: null,
    dateOfDischargeInitial: row.etaVsPlan.dateOfDischargeInitial,
    transitTime: null,
    transitPercentage: row.etaVsPlan.transitPercentage,
    co2Emission: null,
    mapToken: null,
    currentVessel: row.vessel,
    currentVesselImo: row.vesselImo,
    currentVoyage: row.voyage,
    checkedAt: row.lastStatus.checkedAt,
    discardedAt: null,
    lastPayload: null,
    lastSyncedAt: null,
  };
}

type OrderBy = "updatedAt" | "eta" | "status";
type OrderDir = "ASC" | "DESC";

const STATUS_VALUES: ShipmentTrackingStatus[] = [
  "NEW",
  "INPROGRESS",
  "BOOKED",
  "LOADED",
  "SAILING",
  "ARRIVED",
  "DISCHARGED",
  "UNTRACKED",
];

const ALERT_OPTIONS: { value: AlertLevel | "all"; label: string }[] = [
  { value: "all", label: "Todas las alertas" },
  { value: "CRITICAL", label: "Crítica" },
  { value: "DELAYED", label: "Retrasada" },
  { value: "NORMAL", label: "Normal" },
];

const PAGE_SIZES = [10, 25, 50, 100] as const;

function alertTone(level: AlertLevel): StatusTone {
  switch (level) {
    case "CRITICAL":
      return "danger";
    case "DELAYED":
      return "warning";
    case "NORMAL":
      return "success";
  }
}

function alertLabel(level: AlertLevel): string {
  switch (level) {
    case "CRITICAL":
      return "Crítica";
    case "DELAYED":
      return "Retrasada";
    case "NORMAL":
      return "Normal";
  }
}

function freeDaysBg(days: number | null): string {
  if (days === null || days === undefined) return "bg-muted text-muted-foreground";
  if (days <= 0) return "bg-brand-danger/15 text-brand-danger";
  if (days <= 3) return "bg-brand-warning/15 text-brand-warning";
  return "bg-brand-success/15 text-brand-success";
}

function KpiCard({
  icon: Icon,
  iconClass,
  value,
  label,
  isLoading,
}: {
  icon: React.ComponentType<{ className?: string }>;
  iconClass: string;
  value: number | undefined;
  label: string;
  isLoading: boolean;
}) {
  return (
    <Card size="sm">
      <CardContent className="flex items-center gap-3">
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-full",
            iconClass
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
        <div className="flex flex-col">
          {isLoading ? (
            <Skeleton className="h-8 w-12" />
          ) : (
            <span className="text-3xl font-semibold tabular-nums leading-none">
              {value ?? 0}
            </span>
          )}
          <span className="mt-1 text-xs text-muted-foreground">{label}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function EtaVsPlanCell({ row }: { row: ActiveShipmentRow }) {
  const { transitPercentage, deltaDays } = row.etaVsPlan;
  if (transitPercentage === null || transitPercentage === undefined) {
    return <span className="text-muted-foreground">—</span>;
  }
  const slipped = deltaDays !== null && deltaDays > 0;
  const earlier = deltaDays !== null && deltaDays < 0;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full",
              slipped ? "bg-brand-danger" : "bg-brand-success"
            )}
            style={{
              width: `${Math.min(100, Math.max(0, transitPercentage))}%`,
            }}
          />
        </div>
        <span className="tabular-nums text-xs text-muted-foreground">
          {Math.round(transitPercentage)}%
        </span>
      </div>
      {slipped ? (
        <span className="text-xs text-brand-danger">
          +{deltaDays}d vs plan
        </span>
      ) : earlier ? (
        <span className="text-xs text-brand-success">
          {deltaDays}d vs plan
        </span>
      ) : null}
    </div>
  );
}

function LastStatusCell({ row }: { row: ActiveShipmentRow }) {
  const { code, checkedAt } = row.lastStatus;
  const status = code as ShipmentTrackingStatus;
  return (
    <div className="flex flex-col gap-1">
      <StatusBadge tone={shipmentStatusTone(status)} icon={null}>
        {shipmentStatusLabel(status)}
      </StatusBadge>
      {checkedAt ? (
        <span className="text-xs text-muted-foreground">
          {formatDate(checkedAt)}
        </span>
      ) : null}
    </div>
  );
}

export function ShipmentsDashboard() {
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState<number>(25);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    ShipmentTrackingStatus | "all"
  >("all");
  const [alertFilter, setAlertFilter] = useState<AlertLevel | "all">("all");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [shippingFilter, setShippingFilter] = useState<string>("all");
  const [includeDiscarded, setIncludeDiscarded] = useState(false);
  const [orderBy, setOrderBy] = useState<OrderBy>("updatedAt");
  const [orderDir, setOrderDir] = useState<OrderDir>("DESC");
  const [selectedRow, setSelectedRow] = useState<ActiveShipmentRow | null>(
    null
  );

  const query = useMemo(
    () => ({
      skip: pageIndex * pageSize,
      take: pageSize,
      orderBy,
      orderDir,
      search: search.trim() || undefined,
      status: statusFilter === "all" ? undefined : statusFilter,
      alertLevel: alertFilter === "all" ? undefined : alertFilter,
      clientId: clientFilter === "all" ? undefined : Number(clientFilter),
      shippingCompanyId:
        shippingFilter === "all" ? undefined : Number(shippingFilter),
      includeDiscarded: includeDiscarded || undefined,
    }),
    [
      pageIndex,
      pageSize,
      orderBy,
      orderDir,
      search,
      statusFilter,
      alertFilter,
      clientFilter,
      shippingFilter,
      includeDiscarded,
    ]
  );

  const { data: kpis, isLoading: kpisLoading } = useDashboardKpis();
  const {
    data: active,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useActiveShipments(query);
  const { data: clients = [] } = useClients();
  const { data: companies = [] } = useShippingCompanies();
  const syncMutation = useSyncShipmentsTracking();

  const rows = active?.rows ?? [];
  const total = active?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const rangeStart = total === 0 ? 0 : pageIndex * pageSize + 1;
  const rangeEnd = Math.min((pageIndex + 1) * pageSize, total);

  const onSync = async () => {
    try {
      const result = await syncMutation.mutateAsync();
      toast.success(
        `Sincronización: ${result.fetched} traídos · ${result.created} creados · ${result.updated} actualizados`
      );
    } catch (e) {
      toast.error(errorMessage(e, "No se pudo sincronizar con ShipsGo"));
    }
  };

  const toggleOrder = (column: OrderBy) => {
    if (orderBy === column) {
      setOrderDir((d) => (d === "ASC" ? "DESC" : "ASC"));
    } else {
      setOrderBy(column);
      setOrderDir("DESC");
    }
    setPageIndex(0);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Monitoreo operacional de embarques activos (ShipsGo).
        </p>
        <Button
          variant="outline"
          onClick={onSync}
          disabled={syncMutation.isPending}
        >
          {syncMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sincronizando…
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              Sincronizar ShipsGo
            </>
          )}
        </Button>
      </div>

      {/* Filter bar */}
      <Card size="sm">
        <CardContent className="flex flex-wrap items-end gap-3">
          <div className="flex flex-1 min-w-[200px] flex-col gap-1">
            <label
              htmlFor="dashboard-search"
              className="text-xs font-medium text-muted-foreground"
            >
              Buscar
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="dashboard-search"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPageIndex(0);
                }}
                placeholder="Booking, cliente, motonave…"
                className="pl-9"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">
              Naviera
            </label>
            <Select
              value={shippingFilter}
              onValueChange={(v) => {
                setShippingFilter(v);
                setPageIndex(0);
              }}
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {companies
                  .filter((c) => c.active)
                  .map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">
              Cliente
            </label>
            <Select
              value={clientFilter}
              onValueChange={(v) => {
                setClientFilter(v);
                setPageIndex(0);
              }}
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {clients
                  .filter((c) => c.active)
                  .map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">
              Status
            </label>
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v as ShipmentTrackingStatus | "all");
                setPageIndex(0);
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {STATUS_VALUES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {shipmentStatusLabel(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">
              Alerta
            </label>
            <Select
              value={alertFilter}
              onValueChange={(v) => {
                setAlertFilter(v as AlertLevel | "all");
                setPageIndex(0);
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALERT_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 self-end pb-2">
            <Checkbox
              id="include-discarded"
              checked={includeDiscarded}
              onCheckedChange={(v) => {
                setIncludeDiscarded(v === true);
                setPageIndex(0);
              }}
            />
            <label
              htmlFor="include-discarded"
              className="text-sm text-muted-foreground"
            >
              Incluir descartados
            </label>
          </div>
        </CardContent>
      </Card>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={Ship}
          iconClass="bg-primary/10 text-primary"
          value={kpis?.transit}
          label="En tránsito"
          isLoading={kpisLoading}
        />
        <KpiCard
          icon={PackageCheck}
          iconClass="bg-brand-success/10 text-brand-success"
          value={kpis?.deliveryToCnee}
          label="Entregados a consignatario"
          isLoading={kpisLoading}
        />
        <KpiCard
          icon={PackageOpen}
          iconClass="bg-brand-celeste text-secondary"
          value={kpis?.emptyReturn}
          label="Vacíos retornados"
          isLoading={kpisLoading}
        />
        <KpiCard
          icon={Clock}
          iconClass="bg-brand-danger/10 text-brand-danger"
          value={kpis?.delay}
          label="Demoradas"
          isLoading={kpisLoading}
        />
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>No se pudo cargar el dashboard</AlertTitle>
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

      {/* Active shipments table */}
      <Card>
        <CardContent className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold text-secondary">
              Monitoreo operacional · Embarques activos
            </h2>
            <span className="text-xs text-muted-foreground tabular-nums">
              {total === 0
                ? "Sin resultados"
                : `${rangeStart}–${rangeEnd} de ${total}`}
            </span>
          </div>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHead label="OP Number" active={false} />
                  <TableHead className="px-3">Naviera</TableHead>
                  <TableHead className="px-3">Cliente</TableHead>
                  <TableHead className="px-3">Booking</TableHead>
                  <TableHead className="px-3 text-right">Cont.</TableHead>
                  <TableHead className="px-3">Origen</TableHead>
                  <TableHead className="px-3">Destino</TableHead>
                  <TableHead className="px-3">M/N · IMO</TableHead>
                  <TableHead className="px-3">Viaje</TableHead>
                  <SortableHead
                    label="Último estado"
                    active={orderBy === "status"}
                    dir={orderBy === "status" ? orderDir : undefined}
                    onClick={() => toggleOrder("status")}
                  />
                  <TableHead className="px-3">Trasbordo</TableHead>
                  <TableHead className="px-3">Próx. puerto</TableHead>
                  <TableHead className="px-3">Ubicación cont.</TableHead>
                  <TableHead className="px-3">ETA vs plan</TableHead>
                  <SortableHead
                    label="ETA"
                    active={orderBy === "eta"}
                    dir={orderBy === "eta" ? orderDir : undefined}
                    onClick={() => toggleOrder("eta")}
                    align="right"
                  />
                  <TableHead className="px-3 text-right">Free days</TableHead>
                  <TableHead className="px-3 text-right sr-only">
                    Acciones
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={`s-${i}`}>
                      {Array.from({ length: 17 }).map((__, j) => (
                        <TableCell key={j} className="px-3 py-2">
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={17} className="py-12 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <ClipboardList className="h-8 w-8" />
                        <p className="text-sm">No hay embarques activos.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => (
                    <TableRow
                      key={row.trackingId}
                      className={cn(
                        row.alertLevel === "CRITICAL" &&
                          "bg-brand-danger/5 hover:bg-brand-danger/10",
                        row.alertLevel === "DELAYED" &&
                          "bg-brand-warning/5 hover:bg-brand-warning/10"
                      )}
                    >
                      <TableCell className="px-3 py-2 font-mono text-xs">
                        {row.opNumber ?? "—"}
                      </TableCell>
                      <TableCell className="px-3 py-2">
                        {row.shippingLine ?? "—"}
                      </TableCell>
                      <TableCell className="px-3 py-2">
                        {row.client ?? "—"}
                      </TableCell>
                      <TableCell className="px-3 py-2 font-mono text-xs">
                        {row.bookingNumber ?? "—"}
                      </TableCell>
                      <TableCell className="px-3 py-2 text-right tabular-nums">
                        {row.numberOfContainers ?? "—"}
                      </TableCell>
                      <TableCell className="px-3 py-2">
                        {row.origin ?? "—"}
                      </TableCell>
                      <TableCell className="px-3 py-2">
                        {row.destination ?? "—"}
                      </TableCell>
                      <TableCell className="px-3 py-2">
                        {row.vessel ? (
                          <div className="flex flex-col">
                            <span>{row.vessel}</span>
                            {row.vesselImo ? (
                              <span className="font-mono text-xs text-muted-foreground">
                                IMO {row.vesselImo}
                              </span>
                            ) : null}
                          </div>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="px-3 py-2 font-mono text-xs">
                        {row.voyage ?? "—"}
                      </TableCell>
                      <TableCell className="px-3 py-2">
                        <LastStatusCell row={row} />
                      </TableCell>
                      <TableCell className="px-3 py-2">
                        {row.lastTransshipmentPort ?? "—"}
                      </TableCell>
                      <TableCell className="px-3 py-2">
                        {row.nextPort ?? "—"}
                      </TableCell>
                      <TableCell className="px-3 py-2">
                        {row.currentContainerLocation ?? "—"}
                      </TableCell>
                      <TableCell className="px-3 py-2">
                        <EtaVsPlanCell row={row} />
                      </TableCell>
                      <TableCell className="px-3 py-2 text-right tabular-nums">
                        {formatDate(row.dischargeDate)}
                      </TableCell>
                      <TableCell className="px-3 py-2 text-right">
                        <span
                          className={cn(
                            "inline-flex min-w-7 justify-center rounded-md px-2 py-0.5 text-xs font-semibold tabular-nums",
                            freeDaysBg(row.freeDaysRemaining)
                          )}
                        >
                          {row.freeDaysRemaining ?? "—"}
                        </span>
                      </TableCell>
                      <TableCell className="px-3 py-2 text-right">
                        <DropdownMenu>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Acciones</span>
                                </Button>
                              </DropdownMenuTrigger>
                            </TooltipTrigger>
                            <TooltipContent>Acciones</TooltipContent>
                          </Tooltip>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                              onClick={() => setSelectedRow(row)}
                            >
                              Ver detalle
                            </DropdownMenuItem>
                            {row.alertLevel !== "NORMAL" ? (
                              <DropdownMenuItem disabled>
                                <StatusBadge
                                  tone={alertTone(row.alertLevel)}
                                  icon={null}
                                >
                                  {alertLabel(row.alertLevel)}
                                </StatusBadge>
                              </DropdownMenuItem>
                            ) : null}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <TrackingDetailDialog
            open={!!selectedRow}
            onOpenChange={(open) => !open && setSelectedRow(null)}
            tracking={selectedRow ? rowToTrackingStub(selectedRow) : null}
          />

          {/* Pagination */}
          <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <span>Filas por página</span>
              <Select
                value={String(pageSize)}
                onValueChange={(v) => {
                  setPageSize(Number(v));
                  setPageIndex(0);
                }}
              >
                <SelectTrigger className="h-8 w-[72px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZES.map((s) => (
                    <SelectItem key={s} value={String(s)}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <span className="tabular-nums">
                Página {pageIndex + 1} de {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pageIndex === 0 || isFetching}
                  onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
                >
                  Anterior
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pageIndex + 1 >= totalPages || isFetching}
                  onClick={() => setPageIndex((p) => p + 1)}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SortableHead({
  label,
  active,
  dir,
  onClick,
  align,
}: {
  label: string;
  active?: boolean;
  dir?: OrderDir;
  onClick?: () => void;
  align?: "right";
}) {
  if (!onClick) {
    return (
      <TableHead
        className={cn("px-3", align === "right" && "text-right")}
      >
        {label}
      </TableHead>
    );
  }
  const Icon = dir === "ASC" ? ArrowUpAZ : ArrowDownAZ;
  return (
    <TableHead className={cn("px-3", align === "right" && "text-right")}>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "inline-flex items-center gap-1 text-left text-xs font-semibold uppercase tracking-wide",
          active ? "text-foreground" : "text-muted-foreground"
        )}
      >
        {label}
        {active ? <Icon className="h-3 w-3" /> : null}
      </button>
    </TableHead>
  );
}
