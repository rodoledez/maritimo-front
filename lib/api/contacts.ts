import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api/client";
import type {
  ClientContact,
  ContactCategory,
  NotificationEventType,
} from "@/types/domain";

type ListResponse = ClientContact[] | { data: ClientContact[] };

function unwrap<T>(value: T | { data: T }): T {
  if (value && typeof value === "object" && "data" in value) {
    return (value as { data: T }).data;
  }
  return value as T;
}

export type ContactPayload = {
  name: string;
  email: string;
  category: ContactCategory;
  /** Only sent for TRACKING contacts. Empty = all events. */
  subscribedEvents?: NotificationEventType[];
  active?: boolean;
};

export type ContactFilters = {
  category?: ContactCategory | null;
  /** true = only active, false = only inactive, null/undefined = all. */
  active?: boolean | null;
};

type ClientId = ClientContact["clientId"];
type ContactId = ClientContact["id"];

function buildParams(filters?: ContactFilters) {
  const params: Record<string, string> = {};
  if (filters?.category) params.category = filters.category;
  if (filters?.active != null) params.active = String(filters.active);
  return params;
}

export async function listContacts(
  clientId: ClientId,
  filters?: ContactFilters
): Promise<ClientContact[]> {
  const response = await apiGet<ListResponse>(
    `/clients/${clientId}/contacts`,
    { params: buildParams(filters) }
  );
  return unwrap(response);
}

export async function getContact(
  clientId: ClientId,
  contactId: ContactId
): Promise<ClientContact> {
  const response = await apiGet<ClientContact | { data: ClientContact }>(
    `/clients/${clientId}/contacts/${contactId}`
  );
  return unwrap(response);
}

export async function createContact(
  clientId: ClientId,
  payload: ContactPayload
): Promise<ClientContact> {
  const response = await apiPost<ClientContact | { data: ClientContact }>(
    `/clients/${clientId}/contacts`,
    payload
  );
  return unwrap(response);
}

export async function updateContact(
  clientId: ClientId,
  contactId: ContactId,
  payload: Partial<ContactPayload>
): Promise<ClientContact> {
  const response = await apiPatch<ClientContact | { data: ClientContact }>(
    `/clients/${clientId}/contacts/${contactId}`,
    payload
  );
  return unwrap(response);
}

export function activateContact(
  clientId: ClientId,
  contactId: ContactId
): Promise<unknown> {
  return apiPatch<unknown>(
    `/clients/${clientId}/contacts/${contactId}/activate`
  );
}

export function deactivateContact(
  clientId: ClientId,
  contactId: ContactId
): Promise<unknown> {
  return apiPatch<unknown>(
    `/clients/${clientId}/contacts/${contactId}/deactivate`
  );
}

export function deleteContact(
  clientId: ClientId,
  contactId: ContactId
): Promise<unknown> {
  return apiDelete<unknown>(`/clients/${clientId}/contacts/${contactId}`);
}
