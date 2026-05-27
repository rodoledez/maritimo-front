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
  LayoutDashboard,
  MapPin,
  Package,
  Ship,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavLink = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export const adminLinks: NavLink[] = [
  { label: "Inicio", href: "/admin", icon: Home },
  { label: "Clientes", href: "/admin/clientes", icon: Users },
  { label: "Reservas", href: "/admin/reservas", icon: ClipboardList },
  {
    label: "Dashboard embarques",
    href: "/admin/shipments-dashboard",
    icon: LayoutDashboard,
  },
  { label: "Tracking", href: "/admin/shipments-tracking", icon: MapPin },
  { label: "Itinerarios", href: "/admin/itinerarios", icon: CalendarRange },
  {
    label: "Plantillas notif.",
    href: "/admin/notifications/templates",
    icon: BookOpen,
  },
  {
    label: "Reglas notif.",
    href: "/admin/notifications/rules",
    icon: Bell,
  },
  {
    label: "Free days",
    href: "/admin/notifications/free-days",
    icon: CalendarClock,
  },
  {
    label: "Log notif.",
    href: "/admin/notifications/log",
    icon: Inbox,
  },
  { label: "Usuarios", href: "/admin/usuarios", icon: UserCog },
  { label: "Commodities", href: "/admin/commodities", icon: Package },
  { label: "Contenedores", href: "/admin/type-containers", icon: Container },
  { label: "Puertos", href: "/admin/ports", icon: Anchor },
  { label: "Países", href: "/admin/countries", icon: Flag },
  { label: "Navieras", href: "/admin/shipping-companies", icon: Ship },
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
