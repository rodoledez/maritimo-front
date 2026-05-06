import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
} from "@/lib/api/client";
import { unwrapList, unwrapOne } from "@/lib/api/_shared";
import type { Country } from "@/types/domain";

export type CountryPayload = Omit<Country, "id">;

export async function listCountries(): Promise<Country[]> {
  return unwrapList(await apiGet<Country[] | { data: Country[] }>("/countries"));
}

export async function createCountry(payload: CountryPayload): Promise<Country> {
  return unwrapOne(
    await apiPost<Country | { data: Country }>("/countries", payload)
  );
}

export async function updateCountry(
  id: Country["id"],
  payload: Partial<CountryPayload>
): Promise<Country> {
  return unwrapOne(
    await apiPatch<Country | { data: Country }>(`/countries/${id}`, payload)
  );
}

export function deleteCountry(id: Country["id"]): Promise<unknown> {
  return apiDelete<unknown>(`/countries/${id}`);
}
