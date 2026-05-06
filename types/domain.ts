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
