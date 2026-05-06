export type User = {
  id: number | string;
  name: string;
  username: string;
  email?: string;
  isClient: boolean;
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

export type BookingStatus = "Pendiente" | "Confirmado" | "Cancelado";

export type Booking = {
  id: number;
  status: BookingStatus;
  Client?: { id: number | string; name: string } | null;
  Itinerary?: {
    id?: number | string;
    weekNo?: number | string | null;
    carrier?: string | null;
    containerShip?: string | null;
    tripNo?: string | null;
    etd?: string | null;
    eta?: string | null;
  } | null;
  specie?: string | null;
  qtyContainers?: number | null;
  typeContainer?: string | null;
  typeFreight?: string | null;
  createdAt?: string | null;
};
