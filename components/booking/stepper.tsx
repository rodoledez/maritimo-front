"use client";

import { Check } from "lucide-react";

export type Step = {
  id: number;
  title: string;
};

export function Stepper({
  steps,
  current,
}: {
  steps: Step[];
  current: number;
}) {
  return (
    <ol className="flex flex-wrap items-center gap-2 text-sm">
      {steps.map((step, idx) => {
        const isDone = step.id < current;
        const isActive = step.id === current;
        const isLast = idx === steps.length - 1;
        return (
          <li
            key={step.id}
            className="flex flex-1 items-center gap-3 min-w-[180px]"
          >
            <span
              className={[
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                isDone
                  ? "bg-brand-success text-white"
                  : isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground",
              ].join(" ")}
            >
              {isDone ? <Check className="h-4 w-4" /> : step.id}
            </span>
            <span
              className={[
                "font-medium",
                isActive
                  ? "text-foreground"
                  : isDone
                    ? "text-foreground"
                    : "text-muted-foreground",
              ].join(" ")}
            >
              {step.title}
            </span>
            {!isLast ? (
              <span
                className={[
                  "h-px flex-1",
                  isDone ? "bg-brand-success" : "bg-muted",
                ].join(" ")}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
