import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
  apiPut,
} from "@/lib/api/client";
import type { Client } from "@/types/domain";

type ListResponse = Client[] | { data: Client[] };

function unwrap<T>(value: T | { data: T }): T {
  if (value && typeof value === "object" && "data" in value) {
    return (value as { data: T }).data;
  }
  return value as T;
}

export type ClientPayload = Omit<Client, "id" | "active"> & {
  active?: boolean;
};

export async function listClients(): Promise<Client[]> {
  const response = await apiGet<ListResponse>("/clients");
  return unwrap(response);
}

export async function createClient(payload: ClientPayload): Promise<Client> {
  const response = await apiPost<Client | { data: Client }>(
    "/clients",
    payload
  );
  return unwrap(response);
}

export async function updateClient(
  id: Client["id"],
  payload: Partial<ClientPayload>
): Promise<Client> {
  const response = await apiPatch<Client | { data: Client }>(
    `/clients/${id}`,
    payload
  );
  return unwrap(response);
}

export function activateClient(id: Client["id"]): Promise<unknown> {
  return apiPut<unknown>(`/clients/${id}/activate`);
}

export function deactivateClient(id: Client["id"]): Promise<unknown> {
  return apiPut<unknown>(`/clients/${id}/deactivate`);
}

export function deleteClient(id: Client["id"]): Promise<unknown> {
  return apiDelete<unknown>(`/clients/${id}`);
}
