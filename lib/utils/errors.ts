import { isApiError } from "@/types/api";

export function errorMessage(error: unknown, fallback: string): string {
  if (isApiError(error)) return error.message ?? fallback;
  if (error instanceof Error) return error.message;
  return fallback;
}

export function explainSequelizeError(
  error: unknown,
  fallback: string
): string {
  if (!isApiError(error)) return fallback;
  const data = error.data as
    | {
        name?: string;
        message?: string;
        errors?: Array<{ path?: string; message?: string; type?: string }>;
      }
    | undefined;
  if (data?.name === "SequelizeUniqueConstraintError") {
    const usernameError = data.errors?.find(
      (e) => e.path === "username" || e.message?.includes("username")
    );
    return usernameError
      ? "Nombre de usuario ya creado"
      : "Ya existe un registro con estos datos";
  }
  if (
    error.status === 400 &&
    (data?.message?.includes("username") ||
      data?.message?.includes("unique") ||
      JSON.stringify(data ?? {}).includes("username must be unique"))
  ) {
    return "Nombre de usuario ya creado";
  }
  return data?.message ?? error.message ?? fallback;
}
