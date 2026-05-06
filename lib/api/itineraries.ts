import {
  apiDelete,
  apiGet,
  apiPost,
  apiPut,
  api,
  normalizeApiError,
} from "@/lib/api/client";
import { unwrapList, unwrapOne } from "@/lib/api/_shared";
import type { Itinerary } from "@/types/domain";

export type ItineraryPayload = Omit<Itinerary, "id">;

export type ItineraryQuery = {
  vigent?: "Y" | "N";
};

export async function listItineraries(
  query?: ItineraryQuery
): Promise<Itinerary[]> {
  return unwrapList(
    await apiGet<Itinerary[] | { data: Itinerary[] }>("/itineraries", {
      params: query,
    })
  );
}

export async function createItinerary(
  payload: ItineraryPayload
): Promise<Itinerary> {
  return unwrapOne(
    await apiPost<Itinerary | { data: Itinerary }>("/itineraries", payload)
  );
}

export async function updateItinerary(
  id: Itinerary["id"],
  payload: Partial<ItineraryPayload>
): Promise<Itinerary> {
  return unwrapOne(
    await apiPut<Itinerary | { data: Itinerary }>(
      `/itineraries/${id}`,
      payload
    )
  );
}

export function activateItinerary(id: Itinerary["id"]): Promise<unknown> {
  return apiPut<unknown>(`/itineraries/${id}/activate`);
}

export function deactivateItinerary(id: Itinerary["id"]): Promise<unknown> {
  return apiPut<unknown>(`/itineraries/${id}/deactivate`);
}

export function confirmItinerary(id: Itinerary["id"]): Promise<unknown> {
  return apiPut<unknown>(`/itineraries/${id}/confirm`);
}

export function deleteItinerary(id: Itinerary["id"]): Promise<unknown> {
  return apiDelete<unknown>(`/itineraries/${id}`);
}

export type ImportItineraryResult = {
  imported: number;
};

export async function importItineraryExcel(
  file: File
): Promise<ImportItineraryResult> {
  const formData = new FormData();
  formData.append("file", file);
  try {
    const { data } = await api.post<unknown>(
      "/import-excels/import-itinerary",
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    if (Array.isArray(data)) return { imported: data.length };
    if (data && typeof data === "object" && "imported" in data) {
      const value = (data as { imported?: unknown }).imported;
      return { imported: typeof value === "number" ? value : 0 };
    }
    return { imported: 0 };
  } catch (error) {
    throw normalizeApiError(error);
  }
}
