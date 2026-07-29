"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  activateContact,
  createContact,
  deactivateContact,
  deleteContact,
  listContacts,
  updateContact,
  type ContactFilters,
  type ContactPayload,
} from "@/lib/api/contacts";
import type { ClientContact } from "@/types/domain";

type ClientId = ClientContact["clientId"];
type ContactId = ClientContact["id"];

/** All queries for one client's contacts share this prefix so mutations can invalidate them. */
function contactsRoot(clientId: ClientId) {
  return ["clients", String(clientId), "contacts"] as const;
}

function contactsKey(clientId: ClientId, filters?: ContactFilters) {
  return [
    ...contactsRoot(clientId),
    { category: filters?.category ?? null, active: filters?.active ?? null },
  ] as const;
}

export function useContacts(clientId: ClientId | null, filters?: ContactFilters) {
  return useQuery({
    queryKey: contactsKey(clientId ?? "", filters),
    queryFn: () => listContacts(clientId as ClientId, filters),
    enabled: clientId != null,
  });
}

export function useCreateContact(clientId: ClientId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ContactPayload) => createContact(clientId, payload),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: contactsRoot(clientId) }),
  });
}

export function useUpdateContact(clientId: ClientId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      contactId,
      payload,
    }: {
      contactId: ContactId;
      payload: Partial<ContactPayload>;
    }) => updateContact(clientId, contactId, payload),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: contactsRoot(clientId) }),
  });
}

export function useToggleContactActive(clientId: ClientId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ contactId, active }: { contactId: ContactId; active: boolean }) =>
      active
        ? deactivateContact(clientId, contactId)
        : activateContact(clientId, contactId),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: contactsRoot(clientId) }),
  });
}

export function useDeleteContact(clientId: ClientId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (contactId: ContactId) => deleteContact(clientId, contactId),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: contactsRoot(clientId) }),
  });
}
