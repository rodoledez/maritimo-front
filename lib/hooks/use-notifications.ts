"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createFreeDays,
  createRule,
  createTemplate,
  deleteFreeDays,
  deleteRule,
  deleteTemplate,
  listFreeDays,
  listLogs,
  listRules,
  listTemplates,
  triggerBookingNotification,
  updateFreeDays,
  updateRule,
  updateTemplate,
  type FreeDaysListParams,
  type FreeDaysPayload,
  type LogListParams,
  type RuleListParams,
  type RulePayload,
  type TemplateListParams,
  type TemplatePayload,
} from "@/lib/api/notifications";

const TEMPLATES_KEY = "notification-templates";
const RULES_KEY = "notification-rules";
const FREE_DAYS_KEY = "free-days-config";
const LOGS_KEY = "notification-logs";

// --- Templates ---

export function useNotificationTemplates(params: TemplateListParams = {}) {
  return useQuery({
    queryKey: [TEMPLATES_KEY, params] as const,
    queryFn: () => listTemplates(params),
  });
}

export function useCreateNotificationTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: TemplatePayload) => createTemplate(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [TEMPLATES_KEY] }),
  });
}

export function useUpdateNotificationTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: Partial<TemplatePayload>;
    }) => updateTemplate(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [TEMPLATES_KEY] }),
  });
}

export function useDeleteNotificationTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteTemplate(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [TEMPLATES_KEY] }),
  });
}

// --- Rules ---

export function useNotificationRules(params: RuleListParams = {}) {
  return useQuery({
    queryKey: [RULES_KEY, params] as const,
    queryFn: () => listRules(params),
  });
}

export function useCreateNotificationRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: RulePayload) => createRule(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [RULES_KEY] }),
  });
}

export function useUpdateNotificationRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: Partial<RulePayload>;
    }) => updateRule(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [RULES_KEY] }),
  });
}

export function useDeleteNotificationRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteRule(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [RULES_KEY] }),
  });
}

// --- Free-days config ---

export function useFreeDaysConfigs(params: FreeDaysListParams = {}) {
  return useQuery({
    queryKey: [FREE_DAYS_KEY, params] as const,
    queryFn: () => listFreeDays(params),
  });
}

export function useCreateFreeDaysConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: FreeDaysPayload) => createFreeDays(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [FREE_DAYS_KEY] }),
  });
}

export function useUpdateFreeDaysConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: Partial<FreeDaysPayload>;
    }) => updateFreeDays(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [FREE_DAYS_KEY] }),
  });
}

export function useDeleteFreeDaysConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteFreeDays(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [FREE_DAYS_KEY] }),
  });
}

// --- Notification logs ---

export function useNotificationLogs(params: LogListParams = {}) {
  return useQuery({
    queryKey: [LOGS_KEY, params] as const,
    queryFn: () => listLogs(params),
  });
}

// --- Trigger ---

export function useTriggerBookingNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (bookingId: number | string) =>
      triggerBookingNotification(bookingId),
    onSuccess: () => qc.invalidateQueries({ queryKey: [LOGS_KEY] }),
  });
}
