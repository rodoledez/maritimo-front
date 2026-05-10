import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

function getInitial(name?: string | null): string {
  return name?.trim().charAt(0).toUpperCase() || "?";
}

export function IdentityCell({
  name,
  className,
}: {
  name?: string | null;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <Avatar size="sm">
        <AvatarFallback className="bg-brand-celeste text-secondary text-xs font-semibold">
          {getInitial(name)}
        </AvatarFallback>
      </Avatar>
      <span className="font-medium">{name ?? "—"}</span>
    </div>
  );
}
