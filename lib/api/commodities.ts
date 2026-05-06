import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
} from "@/lib/api/client";
import { unwrapList, unwrapOne } from "@/lib/api/_shared";
import type { Commodity } from "@/types/domain";

export type CommodityPayload = Omit<Commodity, "id">;

export async function listCommodities(): Promise<Commodity[]> {
  return unwrapList(await apiGet<Commodity[] | { data: Commodity[] }>("/commodities"));
}

export async function createCommodity(payload: CommodityPayload): Promise<Commodity> {
  return unwrapOne(
    await apiPost<Commodity | { data: Commodity }>("/commodities", payload)
  );
}

export async function updateCommodity(
  id: Commodity["id"],
  payload: Partial<CommodityPayload>
): Promise<Commodity> {
  return unwrapOne(
    await apiPatch<Commodity | { data: Commodity }>(`/commodities/${id}`, payload)
  );
}

export function deleteCommodity(id: Commodity["id"]): Promise<unknown> {
  return apiDelete<unknown>(`/commodities/${id}`);
}
