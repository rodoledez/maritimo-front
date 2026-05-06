import { Badge } from "@/components/ui/badge";

export function ActiveBadge({ active }: { active: boolean }) {
  return (
    <Badge
      variant={active ? "default" : "destructive"}
      className={
        active
          ? "bg-brand-success/15 text-brand-success hover:bg-brand-success/20"
          : "bg-brand-danger/15 text-brand-danger hover:bg-brand-danger/20"
      }
    >
      {active ? "Activo" : "Inactivo"}
    </Badge>
  );
}
