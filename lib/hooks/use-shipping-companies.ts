"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createShippingCompany,
  deleteShippingCompany,
  listShippingCompanies,
  updateShippingCompany,
  type ShippingCompanyPayload,
} from "@/lib/api/shipping-companies";
import type { ShippingCompany } from "@/types/domain";

const KEY = ["shipping-companies"] as const;

export function useShippingCompanies() {
  return useQuery({ queryKey: KEY, queryFn: listShippingCompanies });
}

export function useCreateShippingCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ShippingCompanyPayload) =>
      createShippingCompany(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateShippingCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: ShippingCompany["id"];
      payload: Partial<ShippingCompanyPayload>;
    }) => updateShippingCompany(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteShippingCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: ShippingCompany["id"]) => deleteShippingCompany(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
