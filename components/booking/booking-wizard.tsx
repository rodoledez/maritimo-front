"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  useForm,
  useFormContext,
  useWatch,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

import { useClients } from "@/lib/hooks/use-clients";
import { useCommodities } from "@/lib/hooks/use-commodities";
import { useTypeContainers } from "@/lib/hooks/use-type-containers";
import { useItineraries } from "@/lib/hooks/use-itineraries";
import { useCreateBooking } from "@/lib/hooks/use-bookings";
import { errorMessage } from "@/lib/utils/errors";
import { assocLabel, formatDate } from "@/lib/utils/format";
import type { Itinerary } from "@/types/domain";

import { Stepper, type Step } from "./stepper";
import {
  BL_OPTIONS,
  FREIGHT_OPTIONS,
  VGM_OPTIONS,
  wizardSchema,
  step1Fields,
  step3Fields,
  validateStep3,
  type WizardValues,
} from "./wizard-schema";

const STEPS: Step[] = [
  { id: 1, title: "Buscar itinerario" },
  { id: 2, title: "Seleccionar itinerario" },
  { id: 3, title: "Detalles de la reserva" },
  { id: 4, title: "Resumen y enviar" },
];

const empty: WizardValues = {
  weekNo: 1,
  additionalWeeks: 4,
  country: "",
  port: "",
  itineraryId: undefined,
  clientId: undefined,
  commodityId: undefined,
  typeContainerId: undefined,
  typeFreight: "",
  qtyContainers: 1,
  temperature: undefined,
  ventilation: "",
  bl: "",
  vgm: "",
  isAtm: false,
  isColdTreatment: false,
  isCheckHumidity: false,
  humidity: undefined,
  description: "",
};

export type BookingWizardProps = {
  /**
   * "admin" → exige seleccionar cliente en step 3.
   * "client" → usa `defaultClientId` automáticamente.
   */
  mode: "admin" | "client";
  /** Solo se usa en modo "client" (Client.id del usuario). */
  defaultClientId?: number | string;
  /** Ruta para el botón "Ver mis reservas" / "Ver reservas" del éxito. */
  onSuccessHref: string;
  onSuccessLabel: string;
  /** Ruta para el botón secundario del éxito. */
  onHomeHref: string;
  onHomeLabel: string;
};

export function BookingWizard({
  mode,
  defaultClientId,
  onSuccessHref,
  onSuccessLabel,
  onHomeHref,
  onHomeLabel,
}: BookingWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState<number>(1);
  const [createdId, setCreatedId] = useState<number | string | null>(null);

  const { data: itineraries = [] } = useItineraries({ vigent: "Y" });
  const { data: commodities = [] } = useCommodities();
  const { data: containers = [] } = useTypeContainers();
  const createMutation = useCreateBooking();

  const form = useForm<WizardValues>({
    resolver: zodResolver(wizardSchema),
    defaultValues: empty,
    mode: "onBlur",
  });

  const values = useWatch({ control: form.control });

  const availableWeeks = useMemo(() => {
    const map = new Map<number, { weekNo: number; week: string | null }>();
    for (const it of itineraries) {
      const wn = Number(it.weekNo);
      if (!Number.isFinite(wn) || wn < 1) continue;
      if (!map.has(wn)) {
        map.set(wn, { weekNo: wn, week: it.week ?? null });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.weekNo - b.weekNo);
  }, [itineraries]);

  const countries = useMemo(
    () =>
      Array.from(
        new Set(
          itineraries
            .map((it) => assocLabel(it.countryDestination))
            .filter((v) => v !== "")
        )
      ).sort(),
    [itineraries]
  );
  const destinationPorts = useMemo(() => {
    const map = new Map<string, { name: string; country: string | null }>();
    for (const it of itineraries) {
      const name = assocLabel(it.portDestination);
      if (!name) continue;
      if (!map.has(name)) {
        const country = assocLabel(it.countryDestination) || null;
        map.set(name, { name, country });
      }
    }
    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [itineraries]);

  const filteredItineraries = useMemo<Itinerary[]>(() => {
    if (!values.weekNo) return [];
    const upper = (values.weekNo ?? 1) + (values.additionalWeeks ?? 4);
    return itineraries
      .filter((it) => {
        if (!it.active) return false;
        const wn = Number(it.weekNo);
        if (Number.isNaN(wn)) return false;
        if (wn < (values.weekNo ?? 1) || wn > upper) return false;
        if (
          values.country &&
          assocLabel(it.countryDestination) !== values.country
        ) {
          return false;
        }
        if (values.port && assocLabel(it.portDestination) !== values.port) {
          return false;
        }
        return true;
      })
      .sort((a, b) => Number(a.weekNo) - Number(b.weekNo));
  }, [
    itineraries,
    values.weekNo,
    values.additionalWeeks,
    values.country,
    values.port,
  ]);

  const selectedItinerary = useMemo(
    () =>
      filteredItineraries.find(
        (it) => Number(it.id) === Number(values.itineraryId)
      ) ??
      itineraries.find((it) => Number(it.id) === Number(values.itineraryId)) ??
      null,
    [filteredItineraries, itineraries, values.itineraryId]
  );

  const goNext = async () => {
    if (step === 1) {
      const ok = await form.trigger([...step1Fields]);
      if (!ok) return;
      const wn = Number(form.getValues("weekNo"));
      if (!availableWeeks.some((w) => w.weekNo === wn)) {
        toast.error("Selecciona una semana del listado");
        return;
      }
      setStep(2);
      return;
    }
    if (step === 2) {
      if (!values.itineraryId) {
        toast.error("Selecciona un itinerario para continuar");
        return;
      }
      setStep(3);
      return;
    }
    if (step === 3) {
      const ok = await form.trigger([...step3Fields]);
      const semantic = validateStep3(form.getValues(), {
        requireClient: mode === "admin",
      });
      if (!ok || semantic) {
        if (semantic) toast.error(semantic);
        return;
      }
      setStep(4);
      return;
    }
  };

  const goBack = () => setStep((s) => Math.max(1, s - 1));

  const onSubmit = async () => {
    const v = form.getValues();
    if (!values.itineraryId || !selectedItinerary) {
      toast.error("Falta el itinerario");
      return;
    }
    const clientId =
      mode === "admin" ? v.clientId : defaultClientId;
    if (!clientId) {
      toast.error(
        mode === "admin" ? "Selecciona un cliente" : "Falta el cliente"
      );
      return;
    }
    const commodity = commodities.find(
      (c) => Number(c.id) === Number(v.commodityId)
    );
    const container = containers.find(
      (c) => Number(c.id) === Number(v.typeContainerId)
    );

    try {
      const created = await createMutation.mutateAsync({
        client_id: clientId,
        itinerary_id: selectedItinerary.id,
        itineraryId: selectedItinerary.id,
        commodityId: commodity?.id,
        specie: commodity?.name ?? null,
        typeContainerId: container?.id,
        typeContainer: container?.name ?? null,
        typeFreight: v.typeFreight,
        qtyContainers: v.qtyContainers ?? 1,
        temperature: v.temperature ?? null,
        ventilation: v.ventilation || null,
        bl: v.bl,
        vgm: v.vgm,
        isAtm: v.isAtm,
        isATM: v.isAtm,
        isColdTreatment: v.isColdTreatment,
        humidity: v.isCheckHumidity ? v.humidity ?? null : null,
        description: v.description || null,
      });
      setCreatedId(created.id);
      toast.success("Solicitud creada");
    } catch (e) {
      toast.error(errorMessage(e, "No se pudo crear la solicitud"));
    }
  };

  if (createdId !== null) {
    return (
      <div className="mx-auto max-w-xl py-12">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-success/15 text-brand-success">
              <CheckCircle2 className="h-8 w-8" />
            </span>
            <h1 className="text-xl font-semibold">¡Solicitud enviada!</h1>
            <p className="text-sm text-muted-foreground">
              La solicitud ha sido registrada con el número{" "}
              <span className="font-mono font-semibold text-foreground">
                #{createdId}
              </span>
              .
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => router.push(onSuccessHref)}
              >
                {onSuccessLabel}
              </Button>
              <Button onClick={() => router.push(onHomeHref)}>
                {onHomeLabel}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-6 py-6">
        <Stepper steps={STEPS} current={step} />

        <Form {...form}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (step === 4) onSubmit();
              else goNext();
            }}
            className="space-y-6"
          >
            {step === 1 ? (
              <Step1
                weeks={availableWeeks}
                countries={countries}
                ports={destinationPorts}
                itinerariesLoaded={itineraries.length > 0}
              />
            ) : null}
            {step === 2 ? (
              <Step2
                rows={filteredItineraries}
                selectedId={values.itineraryId}
                onSelect={(id) =>
                  form.setValue("itineraryId", id, { shouldValidate: true })
                }
              />
            ) : null}
            {step === 3 ? <Step3 mode={mode} /> : null}
            {step === 4 ? (
              <Step4Review
                mode={mode}
                itinerary={selectedItinerary}
                commodityName={
                  commodities.find(
                    (c) => Number(c.id) === Number(values.commodityId)
                  )?.name ?? ""
                }
                containerName={
                  containers.find(
                    (c) => Number(c.id) === Number(values.typeContainerId)
                  )?.name ?? ""
                }
              />
            ) : null}

            <div className="flex justify-between border-t pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={goBack}
                disabled={step === 1 || createMutation.isPending}
              >
                <ArrowLeft className="h-4 w-4" />
                Atrás
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enviando…
                  </>
                ) : step === 4 ? (
                  <>
                    <Check className="h-4 w-4" />
                    Enviar solicitud
                  </>
                ) : (
                  <>
                    Siguiente
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────
// Step 1
// ─────────────────────────────────────────────────────────
function Step1({
  weeks,
  countries,
  ports,
  itinerariesLoaded,
}: {
  weeks: Array<{ weekNo: number; week: string | null }>;
  countries: string[];
  ports: Array<{ name: string; country: string | null }>;
  itinerariesLoaded: boolean;
}) {
  const form = useFormFromCtx();
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="weekNo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Semana *</FormLabel>
              <FormControl>
                <SearchableSelect
                  value={field.value ? String(field.value) : ""}
                  onValueChange={(v) => field.onChange(Number(v))}
                  disabled={!itinerariesLoaded || weeks.length === 0}
                  placeholder="Selecciona una semana"
                  searchPlaceholder="Buscar semana…"
                  options={weeks.map((w) => ({
                    value: String(w.weekNo),
                    label: w.week
                      ? `${w.weekNo} · ${w.week}`
                      : String(w.weekNo),
                  }))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="additionalWeeks"
          render={({ field }) => {
            const current = Number(field.value);
            return (
              <FormItem>
                <FormLabel>Semanas adicionales *</FormLabel>
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map((n) => (
                    <Button
                      key={n}
                      type="button"
                      size="sm"
                      variant={current === n ? "default" : "outline"}
                      onClick={() => field.onChange(n)}
                      aria-pressed={current === n}
                      className="w-12 tabular-nums"
                    >
                      {n}
                    </Button>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            );
          }}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="country"
          render={({ field }) => (
            <FormItem>
              <FormLabel>País destino</FormLabel>
              <FormControl>
                <SearchableSelect
                  value={field.value ?? ""}
                  onValueChange={(v) => {
                    field.onChange(v);
                    form.setValue("port", "");
                  }}
                  disabled={!itinerariesLoaded}
                  placeholder="Selecciona…"
                  searchPlaceholder="Buscar país…"
                  options={countries.map((c) => ({ value: c, label: c }))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="port"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Puerto destino</FormLabel>
              <FormControl>
                <SearchableSelect
                  value={field.value ?? ""}
                  onValueChange={(v) => {
                    field.onChange(v);
                    form.setValue("country", "");
                  }}
                  disabled={!itinerariesLoaded}
                  placeholder="Selecciona…"
                  searchPlaceholder="Buscar puerto…"
                  options={ports.map((p) => ({
                    value: p.name,
                    label: p.country ? `${p.name} - ${p.country}` : p.name,
                    keywords: p.country ?? "",
                  }))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Selecciona país O puerto destino (no ambos).
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Step 2
// ─────────────────────────────────────────────────────────
function Step2({
  rows,
  selectedId,
  onSelect,
}: {
  rows: Itinerary[];
  selectedId: number | undefined;
  onSelect: (id: number) => void;
}) {
  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-10 text-muted-foreground">
        <p className="text-sm">
          No se encontraron itinerarios para los filtros seleccionados.
        </p>
        <p className="text-xs">Ajusta la búsqueda en el paso anterior.</p>
      </div>
    );
  }
  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10"></TableHead>
            <TableHead className="text-right">Sem</TableHead>
            <TableHead>Naviera</TableHead>
            <TableHead className="hidden md:table-cell">M/N</TableHead>
            <TableHead className="hidden md:table-cell">Viaje</TableHead>
            <TableHead className="hidden md:table-cell">Pto. Zarpe</TableHead>
            <TableHead>Pto. Destino</TableHead>
            <TableHead className="text-right">ETD</TableHead>
            <TableHead className="hidden md:table-cell text-right">ETA</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((it) => {
            const checked = Number(selectedId) === Number(it.id);
            const radioLabel = `Itinerario semana ${it.weekNo}${
              it.carrier ? ` — ${it.carrier}` : ""
            }`;
            return (
              <TableRow
                key={it.id}
                onClick={() => onSelect(Number(it.id))}
                className={checked ? "bg-primary/5" : "cursor-pointer"}
              >
                <TableCell>
                  <input
                    type="radio"
                    name="itineraryRow"
                    checked={checked}
                    onChange={() => onSelect(Number(it.id))}
                    aria-label={radioLabel}
                    className="h-4 w-4 accent-primary"
                  />
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  {it.weekNo}
                </TableCell>
                <TableCell>{it.carrier ?? "—"}</TableCell>
                <TableCell className="hidden md:table-cell">
                  {it.containerShip ?? "—"}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {it.tripNo ?? "—"}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {assocLabel(it.portDeparture) || "—"}
                </TableCell>
                <TableCell>{assocLabel(it.portDestination) || "—"}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatDate(it.etd)}
                </TableCell>
                <TableCell className="hidden md:table-cell text-right tabular-nums">
                  {formatDate(it.eta)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Step 3
// ─────────────────────────────────────────────────────────
function Step3({ mode }: { mode: "admin" | "client" }) {
  const form = useFormFromCtx();
  const { data: clients = [], isLoading: loadingClients } = useClients();
  const { data: commodities = [], isLoading: loadingCom } = useCommodities();
  const { data: containers = [], isLoading: loadingCt } = useTypeContainers();
  const isCheckHumidity = useWatch({
    control: form.control,
    name: "isCheckHumidity",
  });

  if (loadingCom || loadingCt || (mode === "admin" && loadingClients)) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
      </div>
    );
  }

  const activeClients = clients.filter((c) => c.active);
  const activeCommodities = commodities.filter((c) => c.active);
  const activeContainers = containers.filter((c) => c.active);

  return (
    <div className="space-y-6">
      {mode === "admin" ? (
        <FormField
          control={form.control}
          name="clientId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cliente *</FormLabel>
              <FormControl>
                <SearchableSelect
                  value={field.value ? String(field.value) : ""}
                  onValueChange={(v) => field.onChange(Number(v))}
                  placeholder="Selecciona el cliente para esta reserva"
                  searchPlaceholder="Buscar cliente…"
                  options={activeClients.map((c) => ({
                    value: String(c.id),
                    label: c.name,
                  }))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="commodityId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Especie *</FormLabel>
                <FormControl>
                  <SearchableSelect
                    value={field.value ? String(field.value) : ""}
                    onValueChange={(v) => field.onChange(Number(v))}
                    placeholder="Selecciona…"
                    searchPlaceholder="Buscar especie…"
                    options={activeCommodities.map((c) => ({
                      value: String(c.id),
                      label: c.name,
                    }))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="typeContainerId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de contenedor *</FormLabel>
                <FormControl>
                  <SearchableSelect
                    value={field.value ? String(field.value) : ""}
                    onValueChange={(v) => field.onChange(Number(v))}
                    placeholder="Selecciona…"
                    searchPlaceholder="Buscar contenedor…"
                    options={activeContainers.map((c) => ({
                      value: String(c.id),
                      label: c.name,
                    }))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="typeFreight"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de flete *</FormLabel>
                <Select value={field.value ?? ""} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona…" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {FREIGHT_OPTIONS.map((o) => (
                      <SelectItem key={o} value={o}>
                        {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex flex-col gap-3 rounded-lg border p-3">
            <FormField
              control={form.control}
              name="isAtm"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(v) => field.onChange(v === true)}
                    />
                  </FormControl>
                  <FormLabel className="font-normal">ATM controlada</FormLabel>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isColdTreatment"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(v) => field.onChange(v === true)}
                    />
                  </FormControl>
                  <FormLabel className="font-normal">Cold treatment</FormLabel>
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Observaciones</FormLabel>
                <FormControl>
                  <Textarea {...field} rows={3} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="qtyContainers"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cantidad de contenedores *</FormLabel>
                <FormControl>
                  <Input {...field} type="number" min={1} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="temperature"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Temperatura (°C)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    type="number"
                    step="0.1"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="ventilation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ventilación</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="bl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Emisión BL *</FormLabel>
                <Select value={field.value ?? ""} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona…" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {BL_OPTIONS.map((o) => (
                      <SelectItem key={o} value={o}>
                        {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="vgm"
            render={({ field }) => (
              <FormItem>
                <FormLabel>VGM *</FormLabel>
                <Select value={field.value ?? ""} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona…" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {VGM_OPTIONS.map((o) => (
                      <SelectItem key={o} value={o}>
                        {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="isCheckHumidity"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center gap-2 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(v) => field.onChange(v === true)}
                  />
                </FormControl>
                <FormLabel className="font-normal">¿Humedad?</FormLabel>
              </FormItem>
            )}
          />
          {isCheckHumidity ? (
            <FormField
              control={form.control}
              name="humidity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Humedad (%) *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      type="number"
                      min={0}
                      max={100}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Step 4
// ─────────────────────────────────────────────────────────
function Step4Review({
  mode,
  itinerary,
  commodityName,
  containerName,
}: {
  mode: "admin" | "client";
  itinerary: Itinerary | null;
  commodityName: string;
  containerName: string;
}) {
  const form = useFormFromCtx();
  const v = form.getValues();
  const { data: clients = [] } = useClients();
  const clientName =
    mode === "admin"
      ? clients.find((c) => Number(c.id) === Number(v.clientId))?.name ?? "—"
      : null;
  return (
    <div className="space-y-6">
      {mode === "admin" ? (
        <section>
          <h3 className="mb-3 text-sm font-semibold text-secondary">Cliente</h3>
          <div className="rounded-lg border p-4">
            <ReviewField label="Cliente" value={clientName} />
          </div>
        </section>
      ) : null}
      <section>
        <h3 className="mb-3 text-sm font-semibold text-secondary">
          Itinerario seleccionado
        </h3>
        <div className="grid gap-3 rounded-lg border p-4 sm:grid-cols-3">
          <ReviewField label="Semana" value={itinerary?.weekNo} />
          <ReviewField label="Naviera" value={itinerary?.carrier} />
          <ReviewField label="M/N" value={itinerary?.containerShip} />
          <ReviewField label="Viaje" value={itinerary?.tripNo} />
          <ReviewField
            label="Pto. Zarpe"
            value={assocLabel(itinerary?.portDeparture)}
          />
          <ReviewField
            label="Pto. Destino"
            value={assocLabel(itinerary?.portDestination)}
          />
          <ReviewField label="ETD" value={formatDate(itinerary?.etd)} />
          <ReviewField label="ETA" value={formatDate(itinerary?.eta)} />
          <ReviewField
            label="Tránsito"
            value={
              typeof itinerary?.transitTime === "number"
                ? `${itinerary.transitTime} días`
                : "—"
            }
          />
        </div>
      </section>
      <section>
        <h3 className="mb-3 text-sm font-semibold text-secondary">Carga</h3>
        <div className="grid gap-3 rounded-lg border p-4 sm:grid-cols-3">
          <ReviewField label="Especie" value={commodityName || "—"} />
          <ReviewField label="Contenedor" value={containerName || "—"} />
          <ReviewField label="Cantidad" value={v.qtyContainers} />
          <ReviewField label="Tipo de flete" value={v.typeFreight} />
          <ReviewField label="Emisión BL" value={v.bl} />
          <ReviewField label="VGM" value={v.vgm} />
          <ReviewField
            label="Temperatura"
            value={v.temperature !== undefined ? `${v.temperature} °C` : "—"}
          />
          <ReviewField label="Ventilación" value={v.ventilation || "—"} />
          <ReviewField
            label="Humedad"
            value={
              v.isCheckHumidity && v.humidity !== undefined
                ? `${v.humidity}%`
                : "—"
            }
          />
          <ReviewField label="ATM" value={v.isAtm ? "Sí" : "No"} />
          <ReviewField
            label="Cold treatment"
            value={v.isColdTreatment ? "Sí" : "No"}
          />
        </div>
        {v.description ? (
          <div className="mt-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Observaciones
            </p>
            <p className="mt-1 whitespace-pre-wrap rounded-md border bg-muted/30 p-3 text-sm">
              {v.description}
            </p>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function ReviewField({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="text-sm font-medium">{value ?? "—"}</p>
    </div>
  );
}

function useFormFromCtx() {
  return useFormContext<WizardValues>();
}
