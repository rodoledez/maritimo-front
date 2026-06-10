import {
  Anchor,
  Bell,
  BookOpen,
  Boxes,
  Building2,
  CalendarClock,
  CalendarRange,
  ClipboardList,
  Container,
  FileText,
  Flag,
  Home,
  Inbox,
  Library,
  MapPin,
  Package,
  Ship,
  UserCog,
  Users,
  Warehouse,
  type LucideIcon,
} from "lucide-react";

export type NavLink = {
  label: string;
  href?: string;
  icon: LucideIcon;
  children?: NavLink[];
};

export const adminLinks: NavLink[] = [
  { label: "Inicio", href: "/admin", icon: Home },
  { label: "Clientes", href: "/admin/clientes", icon: Users },
  { label: "Reservas", href: "/admin/reservas", icon: ClipboardList },
  { label: "Tracking", href: "/admin/shipments-tracking", icon: MapPin },
  { label: "Itinerarios", href: "/admin/itinerarios", icon: CalendarRange },
  {
    label: "Notificaciones",
    icon: Bell,
    children: [
      {
        label: "Plantillas",
        href: "/admin/notifications/templates",
        icon: BookOpen,
      },
      {
        label: "Reglas",
        href: "/admin/notifications/rules",
        icon: Bell,
      },
      {
        label: "Free days",
        href: "/admin/notifications/free-days",
        icon: CalendarClock,
      },
      {
        label: "Log",
        href: "/admin/notifications/log",
        icon: Inbox,
      },
    ],
  },
  {
    label: "Catálogos",
    icon: Library,
    children: [
      { label: "Navieras", href: "/admin/shipping-companies", icon: Ship },
      { label: "Puertos", href: "/admin/ports", icon: Anchor },
      { label: "Países", href: "/admin/countries", icon: Flag },
      { label: "Commodities", href: "/admin/commodities", icon: Package },
      {
        label: "Contenedores",
        href: "/admin/type-containers",
        icon: Container,
      },
      {
        label: "Depósitos y terminales",
        href: "/admin/facilities",
        icon: Warehouse,
      },
    ],
  },
  { label: "Usuarios", href: "/admin/usuarios", icon: UserCog },
];

export const clienteLinks: NavLink[] = [
  { label: "Inicio", href: "/cliente", icon: Home },
  {
    label: "Crear solicitud",
    href: "/cliente/crear-solicitud-reserva",
    icon: FileText,
  },
  { label: "Ver reservas", href: "/cliente/ver-reservas", icon: ClipboardList },
  { label: "Ver itinerario", href: "/cliente/ver-itinerario", icon: Boxes },
];

// Re-exported for env-indicator imports
export { Building2 };
