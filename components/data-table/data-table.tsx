"use client";

import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowUpDown, Download, Inbox, Search } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";
import { downloadCsv } from "@/lib/utils/export-csv";
import { Button } from "@/components/ui/button";
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

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

type ColumnAlign = "right" | "center";
type ColumnMeta = { align?: ColumnAlign };

function readAlign(meta: unknown): ColumnAlign | undefined {
  return (meta as ColumnMeta | undefined)?.align;
}

/**
 * Paginación server-side. Cuando se pasa, la tabla NO pagina/filtra en cliente:
 * `data` ya es la página actual y los controles delegan en estos callbacks.
 */
type ServerPagination = {
  pageIndex: number; // 0-based
  pageSize: number;
  total: number;
  onPageChange: (pageIndex: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  isFetching?: boolean;
};

/** Búsqueda server-side controlada (reemplaza el filtro global en cliente). */
type ServerSearch = {
  value: string;
  onChange: (value: string) => void;
};

type DataTableProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchPlaceholder?: string;
  searchKey?: keyof TData & string;
  toolbarLeft?: React.ReactNode;
  toolbarRight?: React.ReactNode;
  emptyMessage?: string;
  emptyState?: React.ReactNode;
  isLoading?: boolean;
  skeletonRows?: number;
  exportable?: boolean;
  exportFileName?: string;
  serverPagination?: ServerPagination;
  serverSearch?: ServerSearch;
};

export function DataTable<TData, TValue>({
  columns,
  data,
  searchPlaceholder = "Buscar…",
  searchKey,
  toolbarLeft,
  toolbarRight,
  emptyMessage = "Sin resultados",
  emptyState,
  isLoading = false,
  skeletonRows = 6,
  exportable = false,
  exportFileName = "export",
  serverPagination,
  serverSearch,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const isServer = !!serverPagination;

  const table = useReactTable({
    data,
    columns,
    // En modo server la búsqueda vive fuera: no filtramos en cliente.
    state: { sorting, globalFilter: serverSearch ? "" : globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    // La ordenación por columna sólo afectaría a la página actual, así que la
    // deshabilitamos en modo server para no confundir.
    enableSorting: !isServer,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    // En modo server `data` ya es la página: sin row model de paginación.
    ...(isServer ? {} : { getPaginationRowModel: getPaginationRowModel() }),
    globalFilterFn: searchKey
      ? (row, _columnId, filterValue) => {
          const cell = row.getValue<unknown>(searchKey);
          return String(cell ?? "")
            .toLowerCase()
            .includes(String(filterValue ?? "").toLowerCase());
        }
      : "includesString",
    initialState: { pagination: { pageSize: 10 } },
  });

  const totalRows = isServer
    ? serverPagination.total
    : table.getFilteredRowModel().rows.length;
  const pageIndex = isServer
    ? serverPagination.pageIndex
    : table.getState().pagination.pageIndex;
  const pageSize = isServer
    ? serverPagination.pageSize
    : table.getState().pagination.pageSize;
  const pageCount = isServer
    ? Math.max(1, Math.ceil(totalRows / pageSize))
    : table.getPageCount() || 1;
  const canPrev = isServer
    ? pageIndex > 0 && !serverPagination.isFetching
    : table.getCanPreviousPage();
  const canNext = isServer
    ? pageIndex + 1 < pageCount && !serverPagination.isFetching
    : table.getCanNextPage();
  const goPrev = () =>
    isServer ? serverPagination.onPageChange(pageIndex - 1) : table.previousPage();
  const goNext = () =>
    isServer ? serverPagination.onPageChange(pageIndex + 1) : table.nextPage();
  const changePageSize = (v: number) =>
    isServer ? serverPagination.onPageSizeChange(v) : table.setPageSize(v);
  const searchValue = serverSearch ? serverSearch.value : globalFilter;
  const onSearchChange = (v: string) =>
    serverSearch ? serverSearch.onChange(v) : setGlobalFilter(v);

  const rangeStart = totalRows === 0 ? 0 : pageIndex * pageSize + 1;
  const rangeEnd = Math.min((pageIndex + 1) * pageSize, totalRows);

  const handleExport = () => {
    const exportColumns = table.getAllLeafColumns().filter(
      (column) =>
        column.accessorFn != null &&
        column.id !== "actions" &&
        typeof column.columnDef.header === "string"
    );
    const headers = exportColumns.map(
      (column) => column.columnDef.header as string
    );
    const rows = table.getFilteredRowModel().rows.map((row) =>
      exportColumns.map((column) => {
        const value = row.getValue<unknown>(column.id);
        if (typeof value === "boolean") return value ? "Sí" : "No";
        if (value === null || value === undefined) return "";
        return String(value);
      })
    );

    const date = new Date().toISOString().slice(0, 10);
    downloadCsv(`${exportFileName}-${date}`, headers, rows);
  };

  const exportButton = exportable ? (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={isLoading || totalRows === 0}
    >
      <Download className="h-4 w-4" />
      Descargar CSV
    </Button>
  ) : null;

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        {toolbarLeft ? (
          <>
            <div className="flex flex-wrap items-center gap-2">
              {toolbarLeft}
            </div>
            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
              {toolbarRight}
              {exportButton}
              <div className="relative w-full sm:w-64">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={searchPlaceholder}
                  value={searchValue}
                  onChange={(event) => onSearchChange(event.target.value)}
                  className="pl-9"
                  aria-label={searchPlaceholder}
                />
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="relative w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(event) => onSearchChange(event.target.value)}
                className="pl-9"
                aria-label={searchPlaceholder}
              />
            </div>
            {(toolbarRight || exportButton) ? (
              <div className="flex flex-wrap items-center gap-2">
                {toolbarRight}
                {exportButton}
              </div>
            ) : null}
          </>
        )}
      </div>
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const align = readAlign(header.column.columnDef.meta);
                  const isActions = header.column.id === "actions";
                  return (
                    <TableHead
                      key={header.id}
                      className={cn(
                        "h-11 px-3",
                        align === "right" && "text-right",
                        align === "center" && "text-center",
                        isActions &&
                          "sticky right-0 z-20 bg-card shadow-[-8px_0_8px_-8px_rgba(0,0,0,0.15)]",
                      )}
                    >
                      {header.isPlaceholder ? null : canSort ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="-ml-2 h-8 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          <ArrowUpDown className="ml-1 h-3 w-3" />
                        </Button>
                      ) : (
                        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                        </span>
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: skeletonRows }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  {columns.map((_col, j) => (
                    <TableCell key={j} className="px-3 py-2">
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="group">
                  {row.getVisibleCells().map((cell) => {
                    const align = readAlign(cell.column.columnDef.meta);
                    const isActions = cell.column.id === "actions";
                    return (
                      <TableCell
                        key={cell.id}
                        className={cn(
                          "px-3 py-2",
                          align === "right" && "text-right tabular-nums",
                          align === "center" && "text-center",
                          isActions &&
                            "sticky right-0 z-10 bg-card shadow-[-8px_0_8px_-8px_rgba(0,0,0,0.15)] group-hover:bg-muted/50",
                        )}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="py-12 text-center"
                >
                  {emptyState ?? (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Inbox className="h-8 w-8" />
                      <p className="text-sm">{emptyMessage}</p>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span>Filas por página</span>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => changePageSize(Number(v))}
          >
            <SelectTrigger
              className="h-8 w-[72px]"
              aria-label="Filas por página"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="tabular-nums">
            {totalRows === 0
              ? "Sin resultados"
              : `${rangeStart}–${rangeEnd} de ${totalRows}`}
          </span>
          <span className="tabular-nums">
            Página {pageIndex + 1} de {pageCount}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goPrev}
              disabled={!canPrev}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goNext}
              disabled={!canNext}
            >
              Siguiente
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
