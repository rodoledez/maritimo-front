type CsvCell = string | number | boolean | null | undefined;

const BOM = "﻿";

function escapeCell(value: CsvCell): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Genera un CSV en el navegador y dispara su descarga.
 * Antepone el BOM UTF-8 para que Excel respete los acentos.
 */
export function downloadCsv(
  filename: string,
  headers: string[],
  rows: CsvCell[][]
): void {
  const lines = [headers, ...rows]
    .map((row) => row.map(escapeCell).join(","))
    .join("\r\n");

  const name = filename.toLowerCase().endsWith(".csv")
    ? filename
    : `${filename}.csv`;

  const blob = new Blob([BOM + lines], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  URL.revokeObjectURL(url);
}
