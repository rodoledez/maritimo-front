import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
  apiPut,
  api,
  normalizeApiError,
} from "@/lib/api/client";
import { unwrapOne, unwrapPaginated } from "@/lib/api/_shared";
import type { Itinerary, PaginatedResponse } from "@/types/domain";

export type ItineraryPayload = Omit<Itinerary, "id">;

export type ItineraryQuery = {
  vigent?: "Y" | "N";
};

/** Parámetros de `GET /itineraries` (paginado + búsqueda libre). */
export type ItineraryListParams = ItineraryQuery & {
  /** Página 1-based. */
  page?: number;
  /** Filas por página (default backend 25). */
  pageSize?: number;
  /** Búsqueda libre (naviera, M/N, viaje, puerto, etc.). */
  search?: string;
};

/** Una página de itinerarios desde `GET /itineraries`. */
export async function listItinerariesPage(
  params: ItineraryListParams = {}
): Promise<PaginatedResponse<Itinerary>> {
  return unwrapPaginated<Itinerary>(
    await apiGet<unknown>("/itineraries", { params }),
    params
  );
}

/**
 * Todos los itinerarios, recorriendo internamente las páginas. Se usa donde la
 * UI necesita el listado completo como lookup (selección en el wizard de
 * reservas, vista de itinerarios del cliente) y no una tabla paginada.
 */
export async function listItineraries(
  query?: ItineraryQuery
): Promise<Itinerary[]> {
  const pageSize = 200;
  const all: Itinerary[] = [];
  for (let page = 1; page <= 50; page++) {
    const res = await listItinerariesPage({ ...query, page, pageSize });
    all.push(...res.rows);
    if (res.rows.length < pageSize || all.length >= res.total) break;
  }
  return all;
}

export async function createItinerary(
  payload: ItineraryPayload
): Promise<Itinerary> {
  return unwrapOne(
    await apiPost<Itinerary | { data: Itinerary }>("/itineraries", payload)
  );
}

export async function updateItinerary(
  id: Itinerary["id"],
  payload: Partial<ItineraryPayload>
): Promise<Itinerary> {
  return unwrapOne(
    await apiPatch<Itinerary | { data: Itinerary }>(
      `/itineraries/${id}`,
      payload
    )
  );
}

export function activateItinerary(id: Itinerary["id"]): Promise<unknown> {
  return apiPut<unknown>(`/itineraries/${id}/activate`);
}

export function deactivateItinerary(id: Itinerary["id"]): Promise<unknown> {
  return apiPut<unknown>(`/itineraries/${id}/deactivate`);
}

export function confirmItinerary(id: Itinerary["id"]): Promise<unknown> {
  return apiPut<unknown>(`/itineraries/${id}/confirm`);
}

export function deleteItinerary(id: Itinerary["id"]): Promise<unknown> {
  return apiDelete<unknown>(`/itineraries/${id}`);
}

export type ImportItineraryResult = {
  imported: number;
};

export async function importItineraryExcel(
  file: File
): Promise<ImportItineraryResult> {
  const formData = new FormData();
  formData.append("file", file);
  try {
    const { data } = await api.post<unknown>(
      "/import-excels/import-itinerary",
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    if (Array.isArray(data)) return { imported: data.length };
    if (data && typeof data === "object" && "imported" in data) {
      const value = (data as { imported?: unknown }).imported;
      return { imported: typeof value === "number" ? value : 0 };
    }
    return { imported: 0 };
  } catch (error) {
    throw normalizeApiError(error);
  }
}
