import {
  apiDelete,
  apiGet,
  apiPost,
  apiPut,
} from "@/lib/api/client";
import { unwrapList, unwrapOne } from "@/lib/api/_shared";
import type {
  FreeDaysConfig,
  NotificationEventType,
  NotificationLog,
  NotificationLogStatus,
  NotificationReferenceField,
  NotificationRule,
  NotificationTemplate,
  NotificationTriggerType,
  PaginatedResponse,
} from "@/types/domain";

type PaginatedRaw<T> = PaginatedResponse<T> | T[] | { data: T[] };

function unwrapPaginated<T>(value: PaginatedRaw<T>): PaginatedResponse<T> {
  if (
    value &&
    typeof value === "object" &&
    "rows" in value &&
    Array.isArray((value as PaginatedResponse<T>).rows)
  ) {
    return value as PaginatedResponse<T>;
  }
  const rows = unwrapList(value as T[] | { data: T[] });
  return { rows, total: rows.length, page: { skip: 0, take: rows.length } };
}

function buildQuery(params: Record<string, unknown>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.append(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

// --- Templates ---

export type TemplateListParams = {
  eventType?: NotificationEventType;
  clientId?: number | null;
  isActive?: boolean;
  skip?: number;
  take?: number;
};

export type TemplatePayload = {
  eventType: NotificationEventType;
  clientId?: number | null;
  subject: string;
  bodyHtml: string;
  bodyText?: string | null;
  isActive?: boolean;
  description?: string | null;
};

export async function listTemplates(
  params: TemplateListParams = {}
): Promise<PaginatedResponse<NotificationTemplate>> {
  return unwrapPaginated(
    await apiGet<PaginatedRaw<NotificationTemplate>>(
      `/notification-templates${buildQuery(params)}`
    )
  );
}

export async function getTemplate(id: number): Promise<NotificationTemplate> {
  return unwrapOne(
    await apiGet<NotificationTemplate | { data: NotificationTemplate }>(
      `/notification-templates/${id}`
    )
  );
}

export async function resolveTemplate(
  eventType: NotificationEventType,
  clientId?: number | null
): Promise<NotificationTemplate> {
  return unwrapOne(
    await apiGet<NotificationTemplate | { data: NotificationTemplate }>(
      `/notification-templates/resolve${buildQuery({ eventType, clientId })}`
    )
  );
}

export async function createTemplate(
  payload: TemplatePayload
): Promise<NotificationTemplate> {
  return unwrapOne(
    await apiPost<NotificationTemplate | { data: NotificationTemplate }>(
      "/notification-templates",
      payload
    )
  );
}

export async function updateTemplate(
  id: number,
  payload: Partial<TemplatePayload>
): Promise<NotificationTemplate> {
  return unwrapOne(
    await apiPut<NotificationTemplate | { data: NotificationTemplate }>(
      `/notification-templates/${id}`,
      payload
    )
  );
}

export function deleteTemplate(id: number): Promise<unknown> {
  return apiDelete<unknown>(`/notification-templates/${id}`);
}

// --- Rules ---

export type RuleListParams = {
  eventType?: NotificationEventType;
  clientId?: number | null;
  isActive?: boolean;
  skip?: number;
  take?: number;
};

export type RulePayload = {
  eventType: NotificationEventType;
  clientId?: number | null;
  name: string;
  triggerType: NotificationTriggerType;
  referenceField?: NotificationReferenceField | null;
  offsetHours?: number | null;
  atTimeOfDay?: string | null;
  recurrenceHours?: number | null;
  maxRecurrences?: number | null;
  conditionJson?: Record<string, unknown> | null;
  isActive?: boolean;
  description?: string | null;
};

export async function listRules(
  params: RuleListParams = {}
): Promise<PaginatedResponse<NotificationRule>> {
  return unwrapPaginated(
    await apiGet<PaginatedRaw<NotificationRule>>(
      `/notification-rules${buildQuery(params)}`
    )
  );
}

export async function getRule(id: number): Promise<NotificationRule> {
  return unwrapOne(
    await apiGet<NotificationRule | { data: NotificationRule }>(
      `/notification-rules/${id}`
    )
  );
}

export async function resolveRules(
  eventType: NotificationEventType,
  clientId?: number | null
): Promise<NotificationRule[]> {
  return unwrapList(
    await apiGet<NotificationRule[] | { data: NotificationRule[] }>(
      `/notification-rules/resolve${buildQuery({ eventType, clientId })}`
    )
  );
}

export async function createRule(payload: RulePayload): Promise<NotificationRule> {
  return unwrapOne(
    await apiPost<NotificationRule | { data: NotificationRule }>(
      "/notification-rules",
      payload
    )
  );
}

export async function updateRule(
  id: number,
  payload: Partial<RulePayload>
): Promise<NotificationRule> {
  return unwrapOne(
    await apiPut<NotificationRule | { data: NotificationRule }>(
      `/notification-rules/${id}`,
      payload
    )
  );
}

export function deleteRule(id: number): Promise<unknown> {
  return apiDelete<unknown>(`/notification-rules/${id}`);
}

// --- Free-days config ---

export type FreeDaysListParams = {
  clientId?: number | null;
  bookingId?: number | null;
  skip?: number;
  take?: number;
};

export type FreeDaysPayload = {
  clientId?: number | null;
  bookingId?: number | null;
  demurrageDays?: number | null;
  detentionDays?: number | null;
  reeferPlugInDays?: number | null;
  demurrageAlertHours?: number | null;
  detentionAlertHours?: number | null;
  reeferAlertHours?: number | null;
  isActive?: boolean;
};

export async function listFreeDays(
  params: FreeDaysListParams = {}
): Promise<PaginatedResponse<FreeDaysConfig>> {
  return unwrapPaginated(
    await apiGet<PaginatedRaw<FreeDaysConfig>>(
      `/free-days-config${buildQuery(params)}`
    )
  );
}

export async function getFreeDays(id: number): Promise<FreeDaysConfig> {
  return unwrapOne(
    await apiGet<FreeDaysConfig | { data: FreeDaysConfig }>(
      `/free-days-config/${id}`
    )
  );
}

export async function getEffectiveFreeDays(
  bookingId: number
): Promise<FreeDaysConfig> {
  return unwrapOne(
    await apiGet<FreeDaysConfig | { data: FreeDaysConfig }>(
      `/free-days-config/effective/${bookingId}`
    )
  );
}

export async function createFreeDays(
  payload: FreeDaysPayload
): Promise<FreeDaysConfig> {
  return unwrapOne(
    await apiPost<FreeDaysConfig | { data: FreeDaysConfig }>(
      "/free-days-config",
      payload
    )
  );
}

export async function updateFreeDays(
  id: number,
  payload: Partial<FreeDaysPayload>
): Promise<FreeDaysConfig> {
  return unwrapOne(
    await apiPut<FreeDaysConfig | { data: FreeDaysConfig }>(
      `/free-days-config/${id}`,
      payload
    )
  );
}

export function deleteFreeDays(id: number): Promise<unknown> {
  return apiDelete<unknown>(`/free-days-config/${id}`);
}

// --- Notification logs ---

export type LogListParams = {
  shipmentTrackingId?: number;
  bookingId?: number;
  eventType?: NotificationEventType;
  status?: NotificationLogStatus;
  skip?: number;
  take?: number;
};

export async function listLogs(
  params: LogListParams = {}
): Promise<PaginatedResponse<NotificationLog>> {
  return unwrapPaginated(
    await apiGet<PaginatedRaw<NotificationLog>>(
      `/notification-logs${buildQuery(params)}`
    )
  );
}

export async function getLog(id: number): Promise<NotificationLog> {
  return unwrapOne(
    await apiGet<NotificationLog | { data: NotificationLog }>(
      `/notification-logs/${id}`
    )
  );
}

// --- Trigger ---

export type TriggerResultRow = {
  eventType: NotificationEventType;
  status: NotificationLogStatus;
  reason?: string | null;
  notificationLogId?: number | null;
  recipientEmail?: string | null;
  subject?: string | null;
};

export type TriggerResult = {
  bookingId: number;
  results: TriggerResultRow[];
  sent: number;
  skipped: number;
  failed: number;
};

export async function triggerBookingNotification(
  bookingId: number | string
): Promise<TriggerResult> {
  return apiPost<TriggerResult>(`/notifications/trigger/${bookingId}`);
}
