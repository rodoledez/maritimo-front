import { z } from "zod";

export const FREIGHT_OPTIONS = [
  "Collect",
  "Prepaid",
  "Prepaid as per agreement",
] as const;
export const BL_OPTIONS = [
  "Emision Origen",
  "Emision Destino",
  "Sea WayBill",
  "Telex Release",
  "Express Release",
] as const;
export const VGM_OPTIONS = ["En Planta", "En Puerto"] as const;

export const wizardSchema = z
  .object({
    // Step 1
    weekNo: z.coerce.number().int().min(1, "Semana requerida"),
    additionalWeeks: z.coerce.number().int().min(1).max(8),
    country: z.string().optional().or(z.literal("")),
    port: z.string().optional().or(z.literal("")),
    // Step 2
    itineraryId: z.coerce.number().optional(),
    // Step 3
    commodityId: z.coerce.number().optional(),
    typeContainerId: z.coerce.number().optional(),
    typeFreight: z.string().optional().or(z.literal("")),
    qtyContainers: z.coerce.number().int().min(1).optional(),
    temperature: z.coerce.number().optional(),
    ventilation: z.string().optional().or(z.literal("")),
    bl: z.string().optional().or(z.literal("")),
    vgm: z.string().optional().or(z.literal("")),
    isAtm: z.boolean(),
    isColdTreatment: z.boolean(),
    isCheckHumidity: z.boolean(),
    humidity: z.coerce.number().optional(),
    description: z.string().optional().or(z.literal("")),
  })
  .refine(
    (v) => !!v.country || !!v.port,
    { path: ["country"], message: "Selecciona un país o un puerto destino" }
  );

export type WizardValues = z.infer<typeof wizardSchema>;

export const step1Fields = [
  "weekNo",
  "additionalWeeks",
  "country",
  "port",
] as const;

export const step3Fields = [
  "commodityId",
  "typeContainerId",
  "typeFreight",
  "qtyContainers",
  "bl",
  "vgm",
  "humidity",
] as const;

export function validateStep3(v: WizardValues): string | null {
  if (!v.commodityId) return "Selecciona una especie";
  if (!v.typeContainerId) return "Selecciona un tipo de contenedor";
  if (!v.typeFreight) return "Selecciona un tipo de flete";
  if (!v.qtyContainers || v.qtyContainers < 1) return "Cantidad de contenedores >= 1";
  if (!v.bl) return "Selecciona la emisión BL";
  if (!v.vgm) return "Selecciona VGM";
  if (v.isCheckHumidity && (!v.humidity || v.humidity < 1)) {
    return "Indica el % de humedad";
  }
  return null;
}
