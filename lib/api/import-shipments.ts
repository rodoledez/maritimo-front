import { apiGet, apiPost } from "@/lib/api/client";
import { unwrapList, unwrapOne } from "@/lib/api/_shared";
import type {
  BookingMilestone,
  ImportShipment,
  ImportShipsgoIntegrateResult,
  ImportShipmentSubState,
  PaginatedResponse,
} from "@/types/domain";

export type ImportShipmentsQuery = {
  /** Busca en Operación, HBL, booking o nombre del consignatario. */
  search?: string;
  subState?: string;
  consigneeOdooId?: number;
  skip?: number;
  /** Máximo 100 (backend). */
  take?: number;
};

/** Listado paginado, ordenado por ETD descendente. */
export async function listImportShipments(
  query: ImportShipmentsQuery = {}
): Promise<PaginatedResponse<ImportShipment>> {
  return unwrapOne(
    await apiGet<
      | PaginatedResponse<ImportShipment>
      | { data: PaginatedResponse<ImportShipment> }
    >("/odoo/embarques-importacion", { params: query })
  );
}

export async function listImportShipmentSubStates(): Promise<
  ImportShipmentSubState[]
> {
  return unwrapList(
    await apiGet<ImportShipmentSubState[] | { data: ImportShipmentSubState[] }>(
      "/odoo/embarques-importacion/sub-states"
    )
  );
}

/** `id` es el id local, no el `odooId`. */
export async function getImportShipment(
  id: number | string
): Promise<ImportShipment> {
  return unwrapOne(
    await apiGet<ImportShipment | { data: ImportShipment }>(
      `/odoo/embarques-importacion/${id}`
    )
  );
}

// ─── Seguimiento ShipsGo ─────────────────────────────────────────────────────
// Las importaciones no tienen `bookingId`: se integran con ShipsGo usando el
// booking que viene de Odoo. Detalle, refresh y log de notificaciones van por
// el `shipmentTrackingId` de la fila con los endpoints normales de tracking.

/**
 * Integra la importación con ShipsGo. Idempotente: si ya estaba integrada
 * devuelve el seguimiento existente. 400 si la importación no tiene booking.
 * Un seguimiento nuevo consume 1 crédito de ShipsGo.
 */
export async function integrateImportShipmentWithShipsgo(
  id: number | string
): Promise<ImportShipsgoIntegrateResult> {
  return unwrapOne(
    await apiPost<
      ImportShipsgoIntegrateResult | { data: ImportShipsgoIntegrateResult }
    >(`/shipments-tracking/by-importacion/${id}/integrate`)
  );
}

/** Timeline de hitos de la importación. `[]` si no está integrada. */
export async function listImportShipmentMilestones(
  id: number | string
): Promise<BookingMilestone[]> {
  return unwrapList(
    await apiGet<BookingMilestone[] | { data: BookingMilestone[] }>(
      `/shipments-tracking/by-importacion/${id}/milestones`
    )
  );
}
