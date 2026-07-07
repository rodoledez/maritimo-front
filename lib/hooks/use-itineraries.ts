"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  activateItinerary,
  confirmItinerary,
  createItinerary,
  deactivateItinerary,
  deleteItinerary,
  importItineraryExcel,
  listItineraries,
  listItinerariesPage,
  updateItinerary,
  type ItineraryListParams,
  type ItineraryPayload,
  type ItineraryQuery,
} from "@/lib/api/itineraries";
import type { Itinerary } from "@/types/domain";

const KEY = ["itineraries"] as const;

/**
 * Listado completo (recorre todas las páginas). Úsalo sólo como lookup — para
 * la tabla de administración usa `useItinerariesPage` (paginación server-side).
 */
export function useItineraries(query?: ItineraryQuery) {
  return useQuery({
    queryKey: [...KEY, query] as const,
    queryFn: () => listItineraries(query),
  });
}

/** Una página de itinerarios con paginación + búsqueda server-side. */
export function useItinerariesPage(params: ItineraryListParams) {
  return useQuery({
    queryKey: [...KEY, "page", params] as const,
    queryFn: () => listItinerariesPage(params),
    placeholderData: keepPreviousData,
  });
}

export function useCreateItinerary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ItineraryPayload) => createItinerary(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateItinerary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: Itinerary["id"];
      payload: Partial<ItineraryPayload>;
    }) => updateItinerary(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useToggleItineraryActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      active,
    }: {
      id: Itinerary["id"];
      active: boolean;
    }) => (active ? deactivateItinerary(id) : activateItinerary(id)),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useConfirmItinerary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: Itinerary["id"]) => confirmItinerary(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteItinerary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: Itinerary["id"]) => deleteItinerary(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useImportItineraryExcel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => importItineraryExcel(file),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
