import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
} from "@/lib/api/client";
import { unwrapList, unwrapOne } from "@/lib/api/_shared";
import type { TypeContainer } from "@/types/domain";

export type TypeContainerPayload = Omit<TypeContainer, "id">;

export async function listTypeContainers(): Promise<TypeContainer[]> {
  return unwrapList(
    await apiGet<TypeContainer[] | { data: TypeContainer[] }>("/type-containers")
  );
}

export async function createTypeContainer(
  payload: TypeContainerPayload
): Promise<TypeContainer> {
  return unwrapOne(
    await apiPost<TypeContainer | { data: TypeContainer }>(
      "/type-containers",
      payload
    )
  );
}

export async function updateTypeContainer(
  id: TypeContainer["id"],
  payload: Partial<TypeContainerPayload>
): Promise<TypeContainer> {
  return unwrapOne(
    await apiPatch<TypeContainer | { data: TypeContainer }>(
      `/type-containers/${id}`,
      payload
    )
  );
}

export function deleteTypeContainer(id: TypeContainer["id"]): Promise<unknown> {
  return apiDelete<unknown>(`/type-containers/${id}`);
}
