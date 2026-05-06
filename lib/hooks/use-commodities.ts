"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createCommodity,
  deleteCommodity,
  listCommodities,
  updateCommodity,
  type CommodityPayload,
} from "@/lib/api/commodities";
import type { Commodity } from "@/types/domain";

const KEY = ["commodities"] as const;

export function useCommodities() {
  return useQuery({ queryKey: KEY, queryFn: listCommodities });
}

export function useCreateCommodity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CommodityPayload) => createCommodity(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateCommodity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: Commodity["id"];
      payload: Partial<CommodityPayload>;
    }) => updateCommodity(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteCommodity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: Commodity["id"]) => deleteCommodity(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
