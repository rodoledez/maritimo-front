import { apiGet, apiPost } from "@/lib/api/client";
import type { LoginResponse, User } from "@/types/domain";

type LoginResponseRaw = {
  access_token: string;
  user?: User | { user: User };
};

type ProfileResponseRaw = User | { user: User };

function unwrapUser(payload: User | { user: User } | undefined): User | undefined {
  if (!payload) return undefined;
  if (typeof payload === "object" && "user" in payload && payload.user) {
    return payload.user;
  }
  return payload as User;
}

export async function loginRequest(credentials: {
  username: string;
  password: string;
}): Promise<LoginResponse> {
  const data = await apiPost<LoginResponseRaw>("/auth/login", credentials);
  return { access_token: data.access_token, user: unwrapUser(data.user) ?? null };
}

export async function profileRequest(): Promise<User> {
  const data = await apiGet<ProfileResponseRaw>("/auth/profile");
  const user = unwrapUser(data);
  if (!user) throw new Error("Profile response did not include a user");
  return user;
}
