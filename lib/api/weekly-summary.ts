import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api/client";
import { unwrapOne, unwrapPaginated } from "@/lib/api/_shared";
import type {
  PaginatedResponse,
  WeeklySummaryPreview,
  WeeklySummarySchedule,
  WeeklySummarySendResult,
  WeeklySummaryTickResult,
} from "@/types/domain";

function buildQuery(params: Record<string, unknown>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.append(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

/**
 * `recipientEmails` viaja como texto separado por `,` / `;`, pero algunos
 * entornos lo devuelven ya partido. Normalizamos a texto para que el formulario
 * y la tabla tengan un solo tipo con el que trabajar.
 */
function normalizeSchedule(row: WeeklySummarySchedule): WeeklySummarySchedule {
  const raw = row.recipientEmails as unknown;
  if (Array.isArray(raw)) {
    return { ...row, recipientEmails: raw.join(", ") || null };
  }
  return row;
}

function normalizeRecipients(
  value: WeeklySummaryPreview["recipients"] | undefined
): WeeklySummaryPreview["recipients"] {
  const toList = (v: unknown): string[] => {
    if (Array.isArray(v)) return v.filter(Boolean).map(String);
    if (typeof v === "string" && v.trim()) {
      return v
        .split(/[,;]/)
        .map((e) => e.trim())
        .filter(Boolean);
    }
    return [];
  };
  return { to: toList(value?.to), cc: toList(value?.cc) };
}

// --- Programaciones ---

export type WeeklySummaryListParams = {
  clientId?: number;
  isActive?: boolean;
  skip?: number;
  take?: number;
};

export type WeeklySummarySchedulePayload = {
  /** Sólo al crear: el backend no permite mover una programación de cliente. */
  clientId: number;
  /** 0 = domingo … 6 = sábado. */
  dayOfWeek: number;
  /** `"HH:mm"`, hora local de `timezone`. */
  timeOfDay?: string;
  timezone?: string;
  isActive?: boolean;
  sendWhenEmpty?: boolean;
  /** Debe ser una plantilla de `eventType: WEEKLY_SUMMARY`, o `null`. */
  templateId?: number | null;
  /** Lista separada por `,` o `;`. Si viene, reemplaza a los contactos. */
  recipientEmails?: string | null;
};

export async function listWeeklySummarySchedules(
  params: WeeklySummaryListParams = {}
): Promise<PaginatedResponse<WeeklySummarySchedule>> {
  return unwrapPaginated<WeeklySummarySchedule>(
    await apiGet<unknown>(`/weekly-summary/schedules${buildQuery(params)}`),
    { pageSize: params.take },
    normalizeSchedule
  );
}

export async function getWeeklySummarySchedule(
  id: number
): Promise<WeeklySummarySchedule> {
  return normalizeSchedule(
    unwrapOne(
      await apiGet<WeeklySummarySchedule | { data: WeeklySummarySchedule }>(
        `/weekly-summary/schedules/${id}`
      )
    )
  );
}

export async function createWeeklySummarySchedule(
  payload: WeeklySummarySchedulePayload
): Promise<WeeklySummarySchedule> {
  return normalizeSchedule(
    unwrapOne(
      await apiPost<WeeklySummarySchedule | { data: WeeklySummarySchedule }>(
        "/weekly-summary/schedules",
        payload
      )
    )
  );
}

export async function updateWeeklySummarySchedule(
  id: number,
  payload: Partial<Omit<WeeklySummarySchedulePayload, "clientId">>
): Promise<WeeklySummarySchedule> {
  return normalizeSchedule(
    unwrapOne(
      await apiPut<WeeklySummarySchedule | { data: WeeklySummarySchedule }>(
        `/weekly-summary/schedules/${id}`,
        payload
      )
    )
  );
}

export function deleteWeeklySummarySchedule(id: number): Promise<unknown> {
  return apiDelete<unknown>(`/weekly-summary/schedules/${id}`);
}

// --- Vista previa / envío / diagnóstico ---

/** No envía ni escribe nada; funciona aunque el cliente no tenga programación. */
export async function previewWeeklySummary(
  clientId: number
): Promise<WeeklySummaryPreview> {
  const preview = unwrapOne(
    await apiGet<WeeklySummaryPreview | { data: WeeklySummaryPreview }>(
      `/weekly-summary/preview/${clientId}`
    )
  );
  return { ...preview, recipients: normalizeRecipients(preview?.recipients) };
}

/** Override del operador: va sin clave de dedupe, así que **siempre reenvía**. */
export async function sendWeeklySummary(
  clientId: number
): Promise<WeeklySummarySendResult> {
  return unwrapOne(
    await apiPost<WeeklySummarySendResult | { data: WeeklySummarySendResult }>(
      `/weekly-summary/send/${clientId}`
    )
  );
}

/** Sin `dryRun` **envía de verdad**. */
export async function runWeeklySummaryTick(
  dryRun = true
): Promise<WeeklySummaryTickResult> {
  return unwrapOne(
    await apiPost<WeeklySummaryTickResult | { data: WeeklySummaryTickResult }>(
      `/weekly-summary/run-tick${buildQuery({ dryRun })}`
    )
  );
}
