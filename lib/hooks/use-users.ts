"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  activateUser,
  changeUserPassword,
  createUser,
  deactivateUser,
  deleteUser,
  listUsers,
  updateUser,
  type UserCreatePayload,
  type UserUpdatePayload,
} from "@/lib/api/users";
import type { User } from "@/types/domain";

const KEY = ["users"] as const;

export function useUsers() {
  return useQuery({ queryKey: KEY, queryFn: listUsers });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UserCreatePayload) => createUser(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: User["id"];
      payload: UserUpdatePayload;
    }) => updateUser(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useToggleUserActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, active }: { id: User["id"]; active: boolean }) =>
      active ? deactivateUser(id) : activateUser(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useChangeUserPassword() {
  return useMutation({
    mutationFn: ({ id, password }: { id: User["id"]; password: string }) =>
      changeUserPassword(id, password),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: User["id"]) => deleteUser(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
