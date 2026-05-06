"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_PREFIX = "env-indicator.dismissed:";

function readInitialDismissed(env: string): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(`${STORAGE_PREFIX}${env}`) === "1";
}

export function EnvIndicator() {
  const env = process.env.NEXT_PUBLIC_APP_ENV ?? "development";
  const [dismissed, setDismissed] = useState<boolean>(() =>
    readInitialDismissed(env)
  );

  if (env === "production" || dismissed) return null;

  const dismiss = () => {
    window.localStorage.setItem(`${STORAGE_PREFIX}${env}`, "1");
    setDismissed(true);
  };

  return (
    <div className="flex items-center justify-between gap-2 bg-brand-warning px-4 py-2 text-xs font-semibold text-secondary">
      <span>Entorno: {env.toUpperCase()}</span>
      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8 text-secondary hover:bg-brand-warning/40 hover:text-secondary"
        onClick={dismiss}
        aria-label="Cerrar"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
