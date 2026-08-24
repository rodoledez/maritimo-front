"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createWeeklySummarySchedule,
  deleteWeeklySummarySchedule,
  listWeeklySummarySchedules,
  previewWeeklySummary,
  runWeeklySummaryTick,
  sendWeeklySummary,
  updateWeeklySummarySchedule,
  type WeeklySummaryListParams,
  type WeeklySummarySchedulePayload,
} from "@/lib/api/weekly-summary";

const SCHEDULES_KEY = "weekly-summary-schedules";
const PREVIEW_KEY = "weekly-summary-preview";
const LOGS_KEY = "notification-logs";

export function useWeeklySummarySchedules(
  params: WeeklySummaryListParams = {},
  options: { enabled?: boolean } = {}
) {
  const { enabled = true } = options;
  return useQuery({
    queryKey: [SCHEDULES_KEY, params] as const,
    queryFn: () => listWeeklySummarySchedules(params),
    enabled,
  });
}

export function useCreateWeeklySummarySchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: WeeklySummarySchedulePayload) =>
      createWeeklySummarySchedule(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [SCHEDULES_KEY] }),
  });
}

export function useUpdateWeeklySummarySchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: Partial<Omit<WeeklySummarySchedulePayload, "clientId">>;
    }) => updateWeeklySummarySchedule(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [SCHEDULES_KEY] }),
  });
}

export function useDeleteWeeklySummarySchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteWeeklySummarySchedule(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [SCHEDULES_KEY] }),
  });
}

/**
 * Correo renderizado sin enviar ni escribir nada. No se cachea entre aperturas
 * del diálogo: el contenido depende de los embarques en curso del cliente.
 */
export function useWeeklySummaryPreview(
  clientId: number | null,
  options: { enabled?: boolean } = {}
) {
  const { enabled = true } = options;
  return useQuery({
    queryKey: [PREVIEW_KEY, clientId] as const,
    queryFn: () => previewWeeklySummary(clientId!),
    enabled: enabled && clientId !== null,
    staleTime: 0,
    gcTime: 0,
    retry: false,
  });
}

/** Manda un correo real al cliente: pedir confirmación antes de llamarlo. */
export function useSendWeeklySummary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (clientId: number) => sendWeeklySummary(clientId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [SCHEDULES_KEY] });
      qc.invalidateQueries({ queryKey: [LOGS_KEY] });
    },
  });
}

/** Con `dryRun: false` **envía de verdad** a todos los clientes que toquen. */
export function useRunWeeklySummaryTick() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dryRun: boolean) => runWeeklySummaryTick(dryRun),
    onSuccess: (_data, dryRun) => {
      if (!dryRun) {
        qc.invalidateQueries({ queryKey: [SCHEDULES_KEY] });
        qc.invalidateQueries({ queryKey: [LOGS_KEY] });
      }
    },
  });
}
