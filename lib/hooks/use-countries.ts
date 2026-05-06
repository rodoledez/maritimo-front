"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createCountry,
  deleteCountry,
  listCountries,
  updateCountry,
  type CountryPayload,
} from "@/lib/api/countries";
import type { Country } from "@/types/domain";

const KEY = ["countries"] as const;

export function useCountries() {
  return useQuery({ queryKey: KEY, queryFn: listCountries });
}

export function useCreateCountry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CountryPayload) => createCountry(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateCountry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: Country["id"];
      payload: Partial<CountryPayload>;
    }) => updateCountry(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteCountry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: Country["id"]) => deleteCountry(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
