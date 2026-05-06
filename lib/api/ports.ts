import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
} from "@/lib/api/client";
import { unwrapList, unwrapOne } from "@/lib/api/_shared";
import type { Port } from "@/types/domain";

export type PortPayload = Omit<Port, "id" | "Country">;

export async function listPorts(): Promise<Port[]> {
  return unwrapList(await apiGet<Port[] | { data: Port[] }>("/ports"));
}

export async function createPort(payload: PortPayload): Promise<Port> {
  return unwrapOne(await apiPost<Port | { data: Port }>("/ports", payload));
}

export async function updatePort(
  id: Port["id"],
  payload: Partial<PortPayload>
): Promise<Port> {
  return unwrapOne(
    await apiPatch<Port | { data: Port }>(`/ports/${id}`, payload)
  );
}

export function deletePort(id: Port["id"]): Promise<unknown> {
  return apiDelete<unknown>(`/ports/${id}`);
}
