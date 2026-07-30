"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  cancelBooking,
  confirmBooking,
  copyBooking,
  createBooking,
  integrateBookingWithShipsgo,
  listBookings,
  listBookingsByClient,
  listBookingsPage,
  updateBooking,
  updateBookingItinerary,
  updateConfirmation,
  type BookingCancelPayload,
  type BookingConfirmPayload,
  type BookingListParams,
  type BookingPayload,
  type BookingUpdateConfirmationPayload,
} from "@/lib/api/bookings";
import type { Booking } from "@/types/domain";

const KEY = ["bookings"] as const;

/**
 * Listado completo (recorre todas las páginas). Úsalo sólo como lookup — para
 * la tabla de administración usa `useBookingsPage` (paginación server-side).
 */
export function useBookings() {
  return useQuery({ queryKey: KEY, queryFn: listBookings });
}

/** Una página de reservas con paginación + búsqueda server-side. */
export function useBookingsPage(params: BookingListParams) {
  return useQuery({
    queryKey: [...KEY, "page", params] as const,
    queryFn: () => listBookingsPage(params),
    placeholderData: keepPreviousData,
  });
}

export function useBookingsByClient(clientId: number | string | undefined | null) {
  return useQuery({
    queryKey: ["bookings", "by-client", clientId] as const,
    queryFn: () => listBookingsByClient(clientId as number | string),
    enabled: !!clientId,
  });
}

/**
 * Carga el borrador copiable de una reserva (`GET /bookings/:id/copy`).
 * Solo se activa cuando `enabled` es true (p.ej. al abrir el diálogo de copia).
 */
export function useBookingCopyDraft(
  id: Booking["id"] | undefined | null,
  enabled: boolean
) {
  return useQuery({
    queryKey: ["bookings", "copy", id] as const,
    queryFn: () => copyBooking(id as Booking["id"]),
    enabled: !!id && enabled,
    staleTime: 0,
    gcTime: 0,
  });
}

export function useCreateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: BookingPayload) => createBooking(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: Booking["id"];
      payload: BookingPayload;
    }) => updateBooking(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateBookingItinerary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      itineraryId,
    }: {
      id: Booking["id"];
      itineraryId: number | string;
    }) => updateBookingItinerary(id, itineraryId),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useConfirmBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: Booking["id"];
      payload: BookingConfirmPayload;
    }) => confirmBooking(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateConfirmation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: Booking["id"];
      payload: BookingUpdateConfirmationPayload;
    }) => updateConfirmation(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useCancelBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: Booking["id"];
      payload: BookingCancelPayload;
    }) => cancelBooking(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useIntegrateBookingWithShipsgo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: Booking["id"]) => integrateBookingWithShipsgo(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ["shipments-tracking"] });
    },
  });
}
