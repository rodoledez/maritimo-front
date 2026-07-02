"use client";

import { useRef, useState } from "react";
import {
  AlertTriangle,
  Download,
  FileSpreadsheet,
  Loader2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useImportItineraryExcel } from "@/lib/hooks/use-itineraries";
import { errorMessage } from "@/lib/utils/errors";
import { isApiError } from "@/types/api";

const TEMPLATE_HREF = "/templates/excel/template_itinerary.xlsx";

/**
 * The backend returns import validation problems inside the error payload.
 * `message` may be a single string, a string with newline/;-separated lines,
 * or an array of strings. Normalize all of that into a list of lines so we can
 * render them in a scrollable area within the dialog.
 */
function extractImportErrors(error: unknown, fallback: string): string[] {
  const raw: unknown = isApiError(error)
    ? (error.data as { message?: unknown; errors?: unknown } | undefined)
        ?.message ??
      (error.data as { errors?: unknown } | undefined)?.errors ??
      error.message
    : undefined;

  const collect = (value: unknown): string[] => {
    if (Array.isArray(value)) return value.flatMap(collect);
    if (value && typeof value === "object") {
      const msg = (value as { message?: unknown }).message;
      if (typeof msg === "string") return [msg];
    }
    if (typeof value === "string") {
      return value
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
    }
    return [];
  };

  const lines = collect(raw);
  return lines.length > 0 ? lines : [errorMessage(error, fallback)];
}

export function ItineraryImportDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const mutation = useImportItineraryExcel();

  const reset = () => {
    setFile(null);
    setErrors([]);
    if (inputRef.current) inputRef.current.value = "";
  };

  const onSubmit = async () => {
    if (!file) return;
    setErrors([]);
    try {
      const result = await mutation.mutateAsync(file);
      toast.success(
        `Archivo importado. Registros cargados: ${result.imported}.`
      );
      reset();
      onOpenChange(false);
    } catch (e) {
      setErrors(extractImportErrors(e, "No se pudo importar el archivo"));
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Importar itinerarios desde Excel</DialogTitle>
          <DialogDescription>
            Selecciona un archivo .xlsx con la estructura del template oficial.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <a
            href={TEMPLATE_HREF}
            className="flex items-center gap-2 text-sm text-primary hover:underline"
            download
          >
            <Download className="h-4 w-4" /> Descargar archivo de ejemplo
          </a>

          <label
            htmlFor="itinerary-excel"
            className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/20 bg-muted/30 p-6 text-center text-sm text-muted-foreground hover:border-primary/40 hover:bg-muted/50"
          >
            <FileSpreadsheet className="h-8 w-8" />
            {file ? (
              <span className="font-medium text-foreground">{file.name}</span>
            ) : (
              <>
                <span className="font-medium">
                  Haz clic para seleccionar un archivo
                </span>
                <span className="text-xs">.xlsx solamente</span>
              </>
            )}
            <input
              ref={inputRef}
              id="itinerary-excel"
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="hidden"
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null);
                setErrors([]);
              }}
            />
          </label>

          {errors.length > 0 && (
            <div className="rounded-lg border border-brand-danger/30 bg-brand-danger/5">
              <div className="flex items-center gap-2 border-b border-brand-danger/20 px-3 py-2 text-sm font-medium text-brand-danger">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>
                  Se encontraron {errors.length} error
                  {errors.length === 1 ? "" : "es"} al importar
                </span>
              </div>
              <ul className="max-h-56 space-y-1 overflow-y-auto px-3 py-2 text-sm text-foreground">
                {errors.map((line, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-brand-danger">•</span>
                    <span className="break-words">{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              reset();
              onOpenChange(false);
            }}
          >
            Cerrar
          </Button>
          <Button
            type="button"
            onClick={onSubmit}
            disabled={!file || mutation.isPending}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Importando…
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Importar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
