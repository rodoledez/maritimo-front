import { apiGet } from "@/lib/api/client";
import { unwrapList, unwrapOne } from "@/lib/api/_shared";
import type {
  ImportShipment,
  ImportShipmentSubState,
  PaginatedResponse,
} from "@/types/domain";

export type ImportShipmentsQuery = {
  /** Busca en Operación, HBL o nombre del consignatario. */
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
