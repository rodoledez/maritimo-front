"use client";

import { useRef, useState } from "react";
import { Download, FileSpreadsheet, Loader2, Upload } from "lucide-react";
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

const TEMPLATE_HREF = "/templates/excel/template_itinerary.xlsx";

export function ItineraryImportDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const mutation = useImportItineraryExcel();

  const reset = () => {
    setFile(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const onSubmit = async () => {
    if (!file) return;
    try {
      const result = await mutation.mutateAsync(file);
      toast.success(
        `Archivo importado. Registros cargados: ${result.imported}.`
      );
      reset();
      onOpenChange(false);
    } catch (e) {
      toast.error(errorMessage(e, "No se pudo importar el archivo"));
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
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
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
