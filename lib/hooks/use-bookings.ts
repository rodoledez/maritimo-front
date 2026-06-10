"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  cancelBooking,
  confirmBooking,
  copyBooking,
  createBooking,
  listBookings,
  listBookingsByClient,
  updateBooking,
  type BookingCancelPayload,
  type BookingConfirmPayload,
  type BookingPayload,
} from "@/lib/api/bookings";
import type { Booking } from "@/types/domain";

const KEY = ["bookings"] as const;

export function useBookings() {
  return useQuery({ queryKey: KEY, queryFn: listBookings });
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
