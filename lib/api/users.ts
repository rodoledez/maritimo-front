import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
  apiPut,
} from "@/lib/api/client";
import { unwrapList, unwrapOne } from "@/lib/api/_shared";
import type { User } from "@/types/domain";

export type UserCreatePayload = {
  name: string;
  username: string;
  email?: string;
  phone?: string | null;
  isClient: boolean;
  password?: string;
};

export type UserUpdatePayload = Partial<{
  name: string;
  email: string;
  phone: string | null;
  isClient: boolean;
}>;

export async function listUsers(): Promise<User[]> {
  return unwrapList(await apiGet<User[] | { data: User[] }>("/users"));
}

export async function createUser(payload: UserCreatePayload): Promise<User> {
  return unwrapOne(await apiPost<User | { data: User }>("/users", payload));
}

export async function updateUser(
  id: User["id"],
  payload: UserUpdatePayload
): Promise<User> {
  return unwrapOne(
    await apiPatch<User | { data: User }>(`/users/${id}`, payload)
  );
}

export function activateUser(id: User["id"]): Promise<unknown> {
  return apiPut<unknown>(`/users/${id}/activate`);
}

export function deactivateUser(id: User["id"]): Promise<unknown> {
  return apiPut<unknown>(`/users/${id}/deactivate`);
}

export function changeUserPassword(
  id: User["id"],
  password: string
): Promise<unknown> {
  return apiPut<unknown>(`/users/${id}/change-password`, { password });
}

export function deleteUser(id: User["id"]): Promise<unknown> {
  return apiDelete<unknown>(`/users/${id}`);
}
