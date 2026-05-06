"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  activateClient,
  createClient,
  deactivateClient,
  deleteClient,
  listClients,
  updateClient,
  type ClientPayload,
} from "@/lib/api/clients";
import type { Client } from "@/types/domain";

const CLIENTS_KEY = ["clients"] as const;

export function useClients() {
  return useQuery({
    queryKey: CLIENTS_KEY,
    queryFn: listClients,
  });
}

export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ClientPayload) => createClient(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: CLIENTS_KEY }),
  });
}

export function useUpdateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: Client["id"];
      payload: Partial<ClientPayload>;
    }) => updateClient(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: CLIENTS_KEY }),
  });
}

export function useToggleClientActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, active }: { id: Client["id"]; active: boolean }) =>
      active ? deactivateClient(id) : activateClient(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: CLIENTS_KEY }),
  });
}

export function useDeleteClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: Client["id"]) => deleteClient(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: CLIENTS_KEY }),
  });
}
