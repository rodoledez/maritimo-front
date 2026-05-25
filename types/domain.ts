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
  active: boolean;
};

export type LoginResponse = {
  access_token: string;
  user: User | null;
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
};

export type Port = {
  id: number | string;
  name: string;
  countryId: number | string | null;
  Country?: { id: number | string; name: string } | null;
  description?: string | null;
  isOrigin: boolean;
  isDestination: boolean;
  active: boolean;
};

export type ItineraryStatus = "CO" | "PE";

export type Itinerary = {
  id: number | string;
  active: boolean;
  weekNo: number;
  week?: string | null;
  carrier?: string | null;
  shippingCompanyId?: number | string | null;
  containerShip?: string | null;
  tripNo?: string | null;
  portOriginId?: number | string | null;
  portDeparture?: string | null;
  portDestinationId?: number | string | null;
  portDestination?: string | null;
  countryDestination?: string | null;
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
  depot?: string | null;
  stacking?: string | null;
  cutOff?: string | null;
  createdAt?: string | null;
};
