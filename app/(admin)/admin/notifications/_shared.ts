import { isApiError } from "@/types/api";

export function explainNotificationError(
  error: unknown,
  fallback: string
): string {
  if (!isApiError(error)) return fallback;
  if (error.status === 409) {
    return "Ya existe una configuración para este cliente / evento";
  }
  if (error.status === 400) {
    const data = error.data as { message?: string } | undefined;
    if (data?.message?.toLowerCase().includes("client") &&
        data.message.toLowerCase().includes("booking")) {
      return "Selecciona cliente O booking, no ambos";
    }
    return data?.message ?? error.message ?? fallback;
  }
  const data = error.data as { message?: string } | undefined;
  return data?.message ?? error.message ?? fallback;
}
