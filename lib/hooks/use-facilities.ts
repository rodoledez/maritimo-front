"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createFacility,
  deleteFacility,
  listFacilities,
  updateFacility,
  type FacilityPayload,
} from "@/lib/api/facilities";
import type { Facility } from "@/types/domain";

const KEY = ["facilities"] as const;

export function useFacilities() {
  return useQuery({ queryKey: KEY, queryFn: listFacilities });
}

export function useCreateFacility() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: FacilityPayload) => createFacility(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateFacility() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: Facility["id"];
      payload: Partial<FacilityPayload>;
    }) => updateFacility(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteFacility() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: Facility["id"]) => deleteFacility(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
