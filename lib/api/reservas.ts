import { apiGet } from "@/lib/api/client";
import type { Booking } from "@/types/domain";

type ListResponse = Booking[] | { data: Booking[] };

function unwrap<T>(value: T | { data: T }): T {
  if (value && typeof value === "object" && "data" in value) {
    return (value as { data: T }).data;
  }
  return value as T;
}

export async function listReservas(): Promise<Booking[]> {
  const response = await apiGet<ListResponse>("/bookings");
  return unwrap(response);
}
