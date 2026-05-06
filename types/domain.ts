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
