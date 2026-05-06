import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
} from "@/lib/api/client";
import { unwrapList, unwrapOne } from "@/lib/api/_shared";
import type { ShippingCompany } from "@/types/domain";

export type ShippingCompanyPayload = Omit<ShippingCompany, "id">;

export async function listShippingCompanies(): Promise<ShippingCompany[]> {
  return unwrapList(
    await apiGet<ShippingCompany[] | { data: ShippingCompany[] }>(
      "/shipping-companies"
    )
  );
}

export async function createShippingCompany(
  payload: ShippingCompanyPayload
): Promise<ShippingCompany> {
  return unwrapOne(
    await apiPost<ShippingCompany | { data: ShippingCompany }>(
      "/shipping-companies",
      payload
    )
  );
}

export async function updateShippingCompany(
  id: ShippingCompany["id"],
  payload: Partial<ShippingCompanyPayload>
): Promise<ShippingCompany> {
  return unwrapOne(
    await apiPatch<ShippingCompany | { data: ShippingCompany }>(
      `/shipping-companies/${id}`,
      payload
    )
  );
}

export function deleteShippingCompany(
  id: ShippingCompany["id"]
): Promise<unknown> {
  return apiDelete<unknown>(`/shipping-companies/${id}`);
}
