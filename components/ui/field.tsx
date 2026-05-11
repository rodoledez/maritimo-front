"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

const fieldVariants = cva(
  "group/field flex w-full data-[invalid=true]:text-destructive",
  {
    variants: {
      orientation: {
        vertical: "flex-col gap-3",
        horizontal: "flex-row items-center justify-end gap-2",
      },
    },
    defaultVariants: {
      orientation: "vertical",
    },
  }
);

function Field({
  className,
  orientation = "vertical",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof fieldVariants>) {
  return (
    <div
      data-slot="field"
      data-orientation={orientation}
      className={cn(fieldVariants({ orientation }), className)}
      {...props}
    />
  );
}

function FieldGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-group"
      className={cn("@container flex flex-col gap-6", className)}
      {...props}
    />
  );
}

function FieldLabel({
  className,
  ...props
}: React.ComponentProps<typeof Label>) {
  return (
    <Label
      data-slot="field-label"
      className={cn(
        "text-sm font-medium leading-none group-data-[invalid=true]/field:text-destructive",
        className
      )}
      {...props}
    />
  );
}

function FieldDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="field-description"
      className={cn("text-xs leading-normal text-muted-foreground", className)}
      {...props}
    />
  );
}

type FieldErrorProps = React.ComponentProps<"p"> & {
  errors?: Array<{ message?: string } | undefined>;
};

function FieldError({
  className,
  errors,
  children,
  ...props
}: FieldErrorProps) {
  const messages = errors
    ?.map((e) => e?.message)
    .filter((m): m is string => Boolean(m));
  const content = children ?? (messages?.length ? messages.join(", ") : null);
  if (!content) return null;
  return (
    <p
      role="alert"
      data-slot="field-error"
      className={cn("text-xs leading-normal text-destructive", className)}
      {...props}
    >
      {content}
    </p>
  );
}

function FieldSectionTitle({
  className,
  ...props
}: React.ComponentProps<"h3">) {
  return (
    <h3
      data-slot="field-section-title"
      className={cn(
        "border-b pb-2 text-sm font-semibold text-secondary",
        className
      )}
      {...props}
    />
  );
}

function FieldRequiredMark() {
  return (
    <span className="opacity-60" aria-hidden>
      *
    </span>
  );
}

export {
  Field,
  FieldGroup,
  FieldLabel,
  FieldDescription,
  FieldError,
  FieldRequiredMark,
  FieldSectionTitle,
};
