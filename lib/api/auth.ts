import { apiGet, apiPost } from "@/lib/api/client";
import type { LoginResponse, User } from "@/types/domain";

export function loginRequest(credentials: {
  username: string;
  password: string;
}): Promise<LoginResponse> {
  return apiPost<LoginResponse>("/auth/login", credentials);
}

export function profileRequest(): Promise<User> {
  return apiGet<User>("/auth/profile");
}
