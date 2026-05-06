"use client";

import {
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
  updateItinerary,
  type ItineraryPayload,
  type ItineraryQuery,
} from "@/lib/api/itineraries";
import type { Itinerary } from "@/types/domain";

const KEY = ["itineraries"] as const;

export function useItineraries(query?: ItineraryQuery) {
  return useQuery({
    queryKey: [...KEY, query] as const,
    queryFn: () => listItineraries(query),
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
