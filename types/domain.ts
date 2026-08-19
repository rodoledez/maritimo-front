export type User = {
  id: number | string;
  name: string;
  username: string;
  email?: string;
  phone?: string | null;
  isClient: boolean;
  active?: boolean;
  createdAt?: string;
  Client?: { id: number | string; name: string } | null;
};

export type Client = {
  id: number | string;
  name: string;
  username: string;
  contactName?: string | null;
  contactEmail?: string | null;
  contactEmail2?: string | null;
  phone?: string | null;
  /** Send shipment notification emails to this client. Defaults to true. */
  notificationsEnabled?: boolean;
  active: boolean;
};

export type LoginResponse = {
  access_token: string;
  user: User | null;
};

export type ContactCategory = "BOOKING" | "TRACKING";

/** Audit stamp returned by the contacts listing. */
export type ContactAuditUser = {
  id: number | string;
  name?: string | null;
  username?: string | null;
};

export type ClientContact = {
  id: number | string;
  clientId?: number | string;
  name: string;
  email: string;
  category: ContactCategory;
  /** Only for TRACKING contacts. Empty / null = subscribed to all events. */
  subscribedEvents?: NotificationEventType[] | null;
  active: boolean;
  createdBy?: ContactAuditUser | null;
  updatedBy?: ContactAuditUser | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type Commodity = {
  id: number | string;
  name: string;
  description?: string | null;
  active: boolean;
};

export type Country = {
  id: number | string;
  name: string;
  isoCode: string;
  description?: string | null;
  active: boolean;
};

export type TypeContainer = {
  id: number | string;
  name: string;
  description?: string | null;
  active: boolean;
};

export type ShippingCompany = {
  id: number | string;
  name: string;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  contactPerson?: string | null;
  address?: string | null;
  description?: string | null;
  active: boolean;
  /**
   * Si la naviera se integra con ShipsGo (tracking). Distinto de `active`, que
   * es el alta/baja de la naviera. El backend lo asume `true` si no se envía.
   */
  shipsgoIntegration: boolean;
};

export type Port = {
  id: number | string;
  name: string;
  countryId: number | string | null;
  country?: { id: number | string; name: string; isoCode?: string | null } | null;
  description?: string | null;
  isOrigin: boolean;
  isDestination: boolean;
  active: boolean;
};

export type FacilityType = "TERMINAL" | "DEPOT";

export type Facility = {
  id: number | string;
  name: string;
  type: FacilityType;
  city?: string | null;
  region?: string | null;
  active: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type ItineraryStatus = "CO" | "PE";

/**
 * Loose shape for joined-row associations returned by the API
 * (e.g. Itinerary.portDeparture may be a string OR a joined Port row).
 */
export type NamedAssoc = {
  id?: number | string;
  name?: string | null;
  isoCode?: string | null;
};

export type Itinerary = {
  id: number | string;
  active: boolean;
  weekNo: number;
  week?: string | null;
  carrier?: string | null;
  shippingCompanyId?: number | string | null;
  /** Naviera anidada por el backend en `GET /itineraries`. */
  shippingCompany?: (NamedAssoc & { shipsgoIntegration?: boolean }) | null;
  containerShip?: string | null;
  tripNo?: string | null;
  portOriginId?: number | string | null;
  portDeparture?: string | NamedAssoc | null;
  portDestinationId?: number | string | null;
  portDestination?: string | NamedAssoc | null;
  countryDestination?: string | NamedAssoc | null;
  etd?: string | null;
  eta?: string | null;
  transitTime?: number | null;
  stacking?: string | null;
  documentClosure?: string | null;
  status?: ItineraryStatus | null;
};

export type BookingStatus = "Pendiente" | "Confirmado" | "Cancelado";

export type ShipmentTrackingStatus =
  | "NEW"
  | "INPROGRESS"
  | "BOOKED"
  | "LOADED"
  | "SAILING"
  | "ARRIVED"
  | "DISCHARGED"
  | "UNTRACKED";

/**
 * Estado ShipsGo derivado que expone la reserva. Además de los estados reales
 * de ShipsGo puede traer `NAVIERA_NO_INTEGRADA` (la naviera del itinerario
 * tiene `shipsgoIntegration = false`, así que la reserva nunca se va a
 * registrar en ShipsGo) o `null` (la naviera sí se integra, pero todavía no
 * hay tracking). El flag gana sobre el tracking: si se apaga la integración,
 * las reservas ya registradas pasan a `NAVIERA_NO_INTEGRADA`.
 */
export type BookingShipsgoStatus =
  | ShipmentTrackingStatus
  | "NAVIERA_NO_INTEGRADA";

export type ShipmentTracking = {
  id: number;
  bookingId: number | null;
  shipsgoId: string;
  reference: string | null;
  bookingNumber: string | null;
  carrierScac: string | null;
  containerNumber: string | null;
  containerCount: number | null;
  status: ShipmentTrackingStatus;
  portOfLoading: string | null;
  polCode: string | null;
  portOfDischarge: string | null;
  podCode: string | null;
  etd: string | null;
  eta: string | null;
  dateOfLoadingInitial: string | null;
  dateOfDischargeInitial: string | null;
  transitTime: number | null;
  transitPercentage: number | null;
  co2Emission: number | null;
  mapToken: string | null;
  currentVessel: string | null;
  currentVesselImo: number | null;
  currentVoyage: string | null;
  checkedAt: string | null;
  discardedAt: string | null;
  lastPayload?: Record<string, unknown> | null;
  lastSyncedAt: string | null;
};

export type ShipsgoCountry = {
  code: string;
  name: string;
};

export type ShipsgoLocation = {
  code: string;
  name: string;
  timezone?: string;
  country?: ShipsgoCountry;
};

export type ShipsgoVessel = {
  imo: number | null;
  name: string;
};

export type ShipsgoMovementEvent =
  | "EMSH"
  | "GTIN"
  | "LOAD"
  | "DEPA"
  | "ARRV"
  | "DISC"
  | "GTOT"
  | "EMRT";

export type ShipsgoMovementStatus = "EST" | "ACT";

export type ShipsgoMovement = {
  event: ShipsgoMovementEvent;
  status: ShipsgoMovementStatus;
  location: ShipsgoLocation;
  vessel: ShipsgoVessel | null;
  voyage: string | null;
  timestamp: string;
};

export type ShipsgoContainerStatus =
  | "EMPTY_SHIPPER"
  | "GATE_IN"
  | "LOADED"
  | "SAILING"
  | "ARRIVED"
  | "DISCHARGED"
  | "GATE_OUT"
  | "EMPTY_RETURN"
  | "UNKNOWN";

export type ShipsgoContainer = {
  number: string;
  status: ShipsgoContainerStatus;
  size: number | null;
  type: string | null;
  movements: ShipsgoMovement[];
};

export type ShipsgoFollower = {
  id: number;
  email: string;
};

export type ShipmentDetailResponse = {
  tracking: ShipmentTracking;
  containers: ShipsgoContainer[];
  followers: ShipsgoFollower[];
};

export type SyncResult = {
  fetched: number;
  created: number;
  updated: number;
};

export type TrackingCarrier = {
  scac?: string;
  code?: string;
  name: string;
} & Record<string, unknown>;

export type AlertLevel = "CRITICAL" | "DELAYED" | "NORMAL";

export type DashboardKpisResponse = {
  /** Shipments that have sailed and have not yet arrived (status = SAILING). */
  transit: number;
  /** Containers delivered to the consignee at destination (container status = GATE_OUT). */
  deliveryToCnee: number;
  /** Containers returned to the empty depot at destination (container status = EMPTY_RETURN). */
  emptyReturn: number;
  /** Shipments where current ETA has slipped past the initial planned discharge date (eta > dateOfDischargeInitial). */
  delay: number;
};

export type ActiveRowLastStatus = {
  code: string;
  checkedAt: string | null;
  alertLevel: AlertLevel;
};

export type ActiveRowEtaVsPlan = {
  eta: string | null;
  dateOfDischargeInitial: string | null;
  transitPercentage: number | null;
  deltaDays: number | null;
};

export type ActiveShipmentRow = {
  trackingId: number;
  opNumber: string | null;
  shippingLine: string | null;
  client: string | null;
  bookingNumber: string | null;
  numberOfContainers: number | null;
  origin: string | null;
  destination: string | null;
  vessel: string | null;
  vesselImo: number | null;
  voyage: string | null;
  lastStatus: ActiveRowLastStatus;
  lastTransshipmentPort: string | null;
  nextPort: string | null;
  currentContainerLocation: string | null;
  etaVsPlan: ActiveRowEtaVsPlan;
  dischargeDate: string | null;
  freeDaysRemaining: number | null;
  alertLevel: AlertLevel;
};

export type ActiveShipmentsListResponse = {
  rows: ActiveShipmentRow[];
  total: number;
  page: { skip: number; take: number };
};

export type NotificationEventType =
  | "GATE_OUT"
  | "GATE_IN"
  | "DEPARTURE"
  | "TRANSSHIPMENT"
  | "ARRIVAL"
  | "POD_GATE_OUT"
  | "EMPTY_RETURN";

export type NotificationTriggerType =
  | "BEFORE_REFERENCE"
  | "AFTER_REFERENCE"
  | "AT_TIME_OF_DAY"
  | "ON_EVENT"
  | "PERIODIC";

export type NotificationReferenceField =
  | "CUTOFF"
  | "LATE_ARRIVAL"
  | "ETD"
  | "ETA"
  | "DEPARTURE_ACTUAL";

export type NotificationLogStatus = "SENT" | "FAILED" | "SKIPPED";

/** Resumen de regla que viaja embebido en `NotificationTemplate.rules`. */
export type NotificationTemplateRule = {
  id: number;
  name: string;
  clientId: number | null;
  triggerType: NotificationTriggerType;
  referenceField: NotificationReferenceField | null;
  offsetHours: number | null;
  atTimeOfDay: string | null;
  recurrenceHours: number | null;
  isActive: boolean;
};

/** Resumen de plantilla que viaja embebido en `NotificationRule.template`. */
export type NotificationRuleTemplate = {
  id: number;
  eventType: NotificationEventType;
  clientId: number | null;
  subject: string;
  isActive: boolean;
};

export type NotificationTemplate = {
  id: number;
  eventType: NotificationEventType;
  clientId: number | null;
  subject: string;
  bodyHtml: string;
  bodyText: string | null;
  isActive: boolean;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  /** Reglas que apuntan explícitamente a esta plantilla. Vacío = solo se usa como default del evento. */
  rules?: NotificationTemplateRule[];
};

export type NotificationRule = {
  id: number;
  eventType: NotificationEventType;
  clientId: number | null;
  name: string;
  /** `null` = usa la plantilla por defecto del evento (resuelta por evento + cliente). */
  templateId: number | null;
  triggerType: NotificationTriggerType;
  referenceField: NotificationReferenceField | null;
  offsetHours: number | null;
  atTimeOfDay: string | null;
  recurrenceHours: number | null;
  maxRecurrences: number | null;
  conditionJson: Record<string, unknown> | null;
  isActive: boolean;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  /** Plantilla asociada, o `null` si la regla usa la default del evento. */
  template?: NotificationRuleTemplate | null;
};

export type FreeDaysConfig = {
  id: number;
  clientId: number | null;
  bookingId: number | null;
  demurrageAlertHours: number | null;
  detentionAlertHours: number | null;
  reeferAlertHours: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type NotificationLog = {
  id: number;
  shipmentTrackingId: number | null;
  bookingId: number | null;
  eventType: NotificationEventType;
  templateId: number | null;
  ruleId: number | null;
  recipientEmail: string;
  ccEmails: string | null;
  subject: string;
  bodyPreview: string | null;
  status: NotificationLogStatus;
  errorMessage: string | null;
  dedupeKey: string | null;
  sentAt: string | null;
  createdAt: string;
};

/**
 * Estado de aviso de un hito de tracking. `PENDING` lo reintenta el propio
 * sistema (no hay acción del usuario); `SUPPRESSED_BACKLOG` y `SKIPPED` no
 * generaron correo.
 */
export type MilestoneNotifyState =
  | "SENT"
  | "PENDING"
  | "SUPPRESSED_BACKLOG"
  | "SKIPPED";

/**
 * Hito informado por ShipsGo para una reserva
 * (`GET /shipments-tracking/by-booking/:bookingId/milestones`). El backend
 * devuelve la lista ya ordenada, del hito más antiguo al más reciente.
 */
export type BookingMilestone = {
  id?: number;
  eventType: NotificationEventType;
  occurredAt: string;
  locationName: string | null;
  containerNumber: string | null;
  /** > 1 en transbordos sucesivos: "Transbordo 2", "Transbordo 3", … */
  sequence: number;
  notifyState: MilestoneNotifyState;
  notifiedAt: string | null;
  notifyNote: string | null;
};

export type PaginatedResponse<T> = {
  rows: T[];
  total: number;
  page: { skip: number; take: number };
};

/** Un día del stacking diario, con su propio rango horario. */
export type StackingDaySchedule = {
  day: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
};

export type Booking = {
  id: number | string;
  status: BookingStatus;
  statusNotes?: string | null;
  Client?: { id: number | string; name: string } | null;
  Itinerary?: Itinerary | null;
  itineraryId?: number | string | null;
  itinerary_id?: number | string | null;
  client_id?: number | string | null;
  commodityId?: number | string | null;
  specie?: string | null;
  typeContainerId?: number | string | null;
  typeContainer?: string | null;
  typeContainerEntity?: string | null;
  typeFreight?: string | null;
  qtyContainers?: number | null;
  temperature?: number | null;
  ventilation?: string | null;
  bl?: string | null;
  isATM?: boolean;
  isAtm?: boolean;
  isColdTreatment?: boolean;
  vgm?: string | null;
  humidity?: number | null;
  description?: string | null;
  booking?: string | null;
  blNo?: string | null;
  depot?: string | { id: number | string; name: string } | null;
  depotId?: number | string | null;
  terminal?: { id: number | string; name: string } | null;
  terminalId?: number | string | null;
  stackingMode?: "CONTINUOUS" | "DAILY" | null;
  stackingStart?: string | null;
  stackingEnd?: string | null;
  stackingSchedule?: StackingDaySchedule[] | null;
  cutOff?: string | null;
  lateArrival?: string | null;
  demurrageDays?: number | null;
  detentionDays?: number | null;
  reeferPlugInDays?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  /** Fecha/hora en que se confirmó la reserva. */
  confirmedAt?: string | null;
  /** Fecha/hora de la última actualización de la confirmación (update-confirmation). */
  confirmationUpdatedAt?: string | null;
  /** Fecha/hora en que se canceló la reserva. */
  cancelledAt?: string | null;
  /** Id del registro `x_embarques` en Odoo (null si aún no se sincronizó). */
  odooEmbarqueId?: number | null;
  /**
   * Último estado ShipsGo del tracking asociado. `null` = la naviera se integra
   * pero todavía no hay tracking; `NAVIERA_NO_INTEGRADA` = no aplica.
   */
  shipsgoStatus?: BookingShipsgoStatus | null;
  /** Evento de la última notificación enviada (null si nunca se envió una). */
  lastNotificationEvent?: NotificationEventType | null;
  /** Fecha/hora en que se envió esa última notificación. */
  lastNotificationSentAt?: string | null;
};
