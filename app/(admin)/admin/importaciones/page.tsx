"use client";

import { useMemo, useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Eye, MailWarning, PackageOpen } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table/data-table";
import { StatusBadge } from "@/components/status-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import {
  useImportShipments,
  useImportShipmentSubStates,
} from "@/lib/hooks/use-import-shipments";
import { errorMessage } from "@/lib/utils/errors";
import { formatDate } from "@/lib/utils/format";
import type { ImportShipment } from "@/types/domain";

import {
  shipmentStatusLabel,
  shipmentStatusTone,
} from "../shipments-tracking/_status";
import { contactEmails } from "./_contacts";
import { ImportShipmentDetailDialog } from "./import-shipment-detail-dialog";

const DEFAULT_PAGE_SIZE = 25;

function ContactsCell({ shipment }: { shipment: ImportShipment }) {
  const contacts = shipment.contacts ?? [];
  const emails = contactEmails(contacts).length;
  if (contacts.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }
  return (
    <div className="flex flex-col items-end gap-0.5">
      <span className="tabular-nums">
        {contacts.length} {contacts.length === 1 ? "contacto" : "contactos"}
      </span>
      {emails ? (
        <span className="text-xs tabular-nums text-muted-foreground">
          {emails} {emails === 1 ? "email" : "emails"}
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 text-xs text-brand-danger">
          <MailWarning className="h-3 w-3" />
          Sin email
        </span>
      )}
    </div>
  );
}

export default function ImportacionesPage() {
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [searchRaw, setSearchRaw] = useState("");
  const search = useDebouncedValue(searchRaw.trim(), 350);
  const [subState, setSubState] = useState("all");
  const [selected, setSelected] = useState<ImportShipment | null>(null);

  const { data, isLoading, error, refetch, isFetching } = useImportShipments({
    skip: pageIndex * pageSize,
    take: pageSize,
    search: search || undefined,
    subState: subState === "all" ? undefined : subState,
  });
  const { data: subStates = [] } = useImportShipmentSubStates();

  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;

  const columns = useMemo<ColumnDef<ImportShipment>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Operación",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.name ?? "—"}</span>
        ),
      },
      {
        accessorKey: "hbl",
        header: "HBL",
        cell: ({ row }) => row.original.hbl ?? "—",
      },
      {
        accessorKey: "booking",
        header: "Booking",
        cell: ({ row }) => row.original.booking ?? "—",
      },
      {
        accessorKey: "consigneeName",
        header: "Consignatario",
        cell: ({ row }) => row.original.consigneeName ?? "—",
      },
      {
        id: "route",
        header: "Origen → Destino",
        accessorFn: (row) =>
          `${row.portOrigin ?? "—"} → ${row.portDestination ?? "—"}`,
      },
      {
        accessorKey: "etd",
        header: "ETD",
        cell: ({ row }) => formatDate(row.original.etd),
        meta: { align: "right" },
      },
      {
        accessorKey: "eta",
        header: "ETA",
        cell: ({ row }) => formatDate(row.original.eta),
        meta: { align: "right" },
      },
      {
        accessorKey: "subStateLabel",
        header: "Estado",
        cell: ({ row }) =>
          row.original.subStateLabel ? (
            <StatusBadge tone="neutral" icon={null}>
              {row.original.subStateLabel}
            </StatusBadge>
          ) : (
            "—"
          ),
      },
      {
        accessorKey: "shipsgoStatus",
        header: "ShipsGo",
        cell: ({ row }) => {
          const status = row.original.shipsgoStatus;
          if (!status) return <span className="text-muted-foreground">—</span>;
          return (
            <StatusBadge tone={shipmentStatusTone(status)} icon={null}>
              {shipmentStatusLabel(status)}
            </StatusBadge>
          );
        },
      },
      {
        id: "contacts",
        header: "Contactos",
        cell: ({ row }) => <ContactsCell shipment={row.original} />,
        meta: { align: "right" },
      },
      {
        id: "actions",
        header: () => <span className="sr-only">Acciones</span>,
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setSelected(row.original)}
                >
                  <Eye className="h-4 w-4" />
                  <span className="sr-only">Ver detalle</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Ver detalle</TooltipContent>
            </Tooltip>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Embarques de importación"
        description="Importaciones sincronizadas desde Odoo, con los contactos del consignatario."
      />
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>No se pudieron cargar las importaciones</AlertTitle>
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
      <DataTable
        columns={columns}
        data={rows}
        isLoading={isLoading}
        searchPlaceholder="Buscar por operación, HBL, booking, consignatario…"
        serverSearch={{
          value: searchRaw,
          onChange: (value) => {
            setSearchRaw(value);
            setPageIndex(0);
          },
        }}
        serverPagination={{
          pageIndex,
          pageSize,
          total,
          onPageChange: setPageIndex,
          onPageSizeChange: (size) => {
            setPageSize(size);
            setPageIndex(0);
          },
          isFetching,
        }}
        toolbarLeft={
          <Select
            value={subState}
            onValueChange={(v) => {
              setSubState(v);
              setPageIndex(0);
            }}
          >
            <SelectTrigger className="w-56" aria-label="Estado de operación">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              {subStates.map((s) => (
                <SelectItem key={s.key} value={s.key}>
                  {s.label ?? s.key}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
        emptyState={
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <PackageOpen className="h-8 w-8" />
            <p className="text-sm">No hay embarques de importación.</p>
          </div>
        }
      />

      <ImportShipmentDetailDialog
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(null)}
        shipment={selected}
      />
    </div>
  );
}
