"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createPort,
  deletePort,
  listPorts,
  updatePort,
  type PortPayload,
} from "@/lib/api/ports";
import type { Port } from "@/types/domain";

const KEY = ["ports"] as const;

export function usePorts() {
  return useQuery({ queryKey: KEY, queryFn: listPorts });
}

export function useCreatePort() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: PortPayload) => createPort(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdatePort() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: Port["id"];
      payload: Partial<PortPayload>;
    }) => updatePort(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeletePort() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: Port["id"]) => deletePort(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
