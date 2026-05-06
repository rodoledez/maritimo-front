"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createTypeContainer,
  deleteTypeContainer,
  listTypeContainers,
  updateTypeContainer,
  type TypeContainerPayload,
} from "@/lib/api/type-containers";
import type { TypeContainer } from "@/types/domain";

const KEY = ["type-containers"] as const;

export function useTypeContainers() {
  return useQuery({ queryKey: KEY, queryFn: listTypeContainers });
}

export function useCreateTypeContainer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: TypeContainerPayload) => createTypeContainer(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateTypeContainer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: TypeContainer["id"];
      payload: Partial<TypeContainerPayload>;
    }) => updateTypeContainer(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteTypeContainer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: TypeContainer["id"]) => deleteTypeContainer(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
