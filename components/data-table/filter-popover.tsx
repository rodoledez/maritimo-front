"use client";

import { SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type FilterOption<T extends string> = {
  value: T;
  label: string;
};

export function FilterPopover<T extends string>({
  label,
  value,
  defaultValue,
  options,
  onChange,
  triggerLabel = "Filtros",
}: {
  label: string;
  value: T;
  defaultValue: T;
  options: FilterOption<T>[];
  onChange: (value: T) => void;
  triggerLabel?: string;
}) {
  const isFiltered = value !== defaultValue;
  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="relative"
              aria-label={triggerLabel}
            >
              <SlidersHorizontal className="h-4 w-4" />
              {isFiltered ? (
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary" />
              ) : null}
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>{triggerLabel}</TooltipContent>
      </Tooltip>
      <PopoverContent align="end" className="w-56">
        <PopoverHeader>
          <PopoverTitle>{label}</PopoverTitle>
        </PopoverHeader>
        <div className="flex flex-col gap-1">
          {options.map((opt) => (
            <Button
              key={opt.value}
              variant={value === opt.value ? "secondary" : "ghost"}
              size="sm"
              className="justify-start"
              onClick={() => onChange(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export type ActiveFilter = "all" | "active" | "inactive";

export const ACTIVE_FILTER_OPTIONS: FilterOption<ActiveFilter>[] = [
  { value: "all", label: "Todos" },
  { value: "active", label: "Activos" },
  { value: "inactive", label: "Inactivos" },
];

export function matchesActiveFilter(
  filter: ActiveFilter,
  active: boolean
): boolean {
  if (filter === "all") return true;
  return filter === "active" ? active : !active;
}
