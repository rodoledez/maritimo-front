import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
} from "@/lib/api/client";
import { unwrapList, unwrapOne } from "@/lib/api/_shared";
import type { Facility } from "@/types/domain";

export type FacilityPayload = Omit<
  Facility,
  "id" | "createdAt" | "updatedAt"
>;

export async function listFacilities(): Promise<Facility[]> {
  return unwrapList(
    await apiGet<Facility[] | { data: Facility[] }>("/facilities")
  );
}

export async function createFacility(
  payload: FacilityPayload
): Promise<Facility> {
  return unwrapOne(
    await apiPost<Facility | { data: Facility }>("/facilities", payload)
  );
}

export async function updateFacility(
  id: Facility["id"],
  payload: Partial<FacilityPayload>
): Promise<Facility> {
  return unwrapOne(
    await apiPatch<Facility | { data: Facility }>(
      `/facilities/${id}`,
      payload
    )
  );
}

export function deleteFacility(id: Facility["id"]): Promise<unknown> {
  return apiDelete<unknown>(`/facilities/${id}`);
}
