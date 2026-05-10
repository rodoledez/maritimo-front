import { StatusBadge } from "@/components/status-badge";

export function ActiveBadge({ active }: { active: boolean }) {
  return (
    <StatusBadge tone={active ? "success" : "danger"}>
      {active ? "Activo" : "Inactivo"}
    </StatusBadge>
  );
}
