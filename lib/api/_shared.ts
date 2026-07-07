import type { PaginatedResponse } from "@/types/domain";

export function unwrapList<T>(value: T[] | { data: T[] } | undefined | null): T[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "object" && "data" in value && Array.isArray(value.data)) {
    return value.data;
  }
  return [];
}

export function unwrapOne<T>(value: T | { data: T }): T {
  if (value && typeof value === "object" && "data" in (value as object)) {
    return (value as { data: T }).data;
  }
  return value as T;
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    if (!Number.isNaN(n)) return n;
  }
  return undefined;
}

/**
 * Normaliza la respuesta de un endpoint paginado al contrato
 * `PaginatedResponse` que usa la app. Tolera tanto un envoltorio
 * (`{ rows | data | items, total | totalItems | count }`) como un array plano
 * (varios endpoints documentan array pero paginan en runtime). `map` permite
 * transformar cada fila (p.ej. normalizar enums) en el mismo paso.
 */
export function unwrapPaginated<T>(
  value: unknown,
  params: { page?: number; pageSize?: number } = {},
  map: (row: T) => T = (row) => row
): PaginatedResponse<T> {
  const pageSize = params.pageSize ?? 25;
  const pageNo = params.page ?? 1;
  const fallbackPage = { skip: (pageNo - 1) * pageSize, take: pageSize };

  if (value && typeof value === "object" && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    const rowsRaw =
      (Array.isArray(obj.rows) && obj.rows) ||
      (Array.isArray(obj.data) && obj.data) ||
      (Array.isArray(obj.items) && obj.items) ||
      null;
    if (rowsRaw) {
      const rows = (rowsRaw as T[]).map(map);
      const total =
        toNumber(obj.total) ??
        toNumber(obj.totalItems) ??
        toNumber(obj.count) ??
        rows.length;
      const page =
        obj.page && typeof obj.page === "object"
          ? (obj.page as { skip: number; take: number })
          : fallbackPage;
      return { rows, total, page };
    }
  }

  const rows = unwrapList(value as T[] | { data: T[] }).map(map);
  return { rows, total: rows.length, page: fallbackPage };
}
