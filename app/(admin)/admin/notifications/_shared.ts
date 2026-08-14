import { isApiError } from "@/types/api";

/**
 * Los endpoints de notificaciones devuelven mensajes específicos que hay que
 * mostrar tal cual: la plantilla es de otro evento (400), la plantilla ya no
 * existe (404), cliente y booking a la vez (400). Solo si el backend no manda
 * `message` caemos a un texto propio.
 */
export function explainNotificationError(
  error: unknown,
  fallback: string
): string {
  if (!isApiError(error)) return fallback;

  const data = error.data as { message?: string } | undefined;
  const message = data?.message;

  if (error.status === 400 && message) {
    const lower = message.toLowerCase();
    if (lower.includes("client") && lower.includes("booking")) {
      return "Selecciona cliente O booking, no ambos";
    }
    return message;
  }

  if (message) return message;

  if (error.status === 409) {
    return "Ya existe una configuración para este cliente / evento";
  }
  if (error.status === 404) {
    return "El recurso referenciado ya no existe. Actualiza la página e intenta de nuevo.";
  }

  return error.message ?? fallback;
}
