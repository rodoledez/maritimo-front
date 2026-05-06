"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "env-indicator.dismissed";

function readInitialDismissed(): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(STORAGE_KEY) === "1";
}

export function EnvIndicator() {
  const env = process.env.NEXT_PUBLIC_APP_ENV ?? "development";
  const [dismissed, setDismissed] = useState<boolean>(readInitialDismissed);

  if (env === "production" || dismissed) return null;

  const dismiss = () => {
    window.localStorage.setItem(STORAGE_KEY, "1");
    setDismissed(true);
  };

  return (
    <div className="flex items-center justify-between gap-2 bg-brand-warning/15 px-4 py-1.5 text-xs font-medium text-brand-warning">
      <span>Entorno: {env.toUpperCase()}</span>
      <Button
        size="icon"
        variant="ghost"
        className="h-6 w-6 hover:bg-brand-warning/20"
        onClick={dismiss}
        aria-label="Cerrar"
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}
