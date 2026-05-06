# /admin/itinerarios — overrides

**Inherits from:** ../MASTER.md and `pages/clientes.md`
**Status:** draft (stub page)

## Why this page deviates

Itinerarios is mostly a CRUD list — but the legacy app has a non-trivial **Excel import** flow (bulk-loading itineraries from a spreadsheet). The list itself follows the `clientes` template; the import is what justifies a page file.

## Overrides

### Page header actions

- Primary: `Nuevo itinerario` — opens the standard create dialog.
- Secondary (outline): `Importar Excel` — opens an import dialog. On tablet, this collapses into the row-actions overflow menu only if the header runs out of room (don't hide it on desktop).

### Import dialog

- Width `sm:max-w-2xl`.
- Three states inside the dialog: **upload → preview → result**. Don't open three separate dialogs.
- **Upload**:
  - Single file input, `accept=".xlsx,.xls"`.
  - Helper text: "El archivo debe seguir el formato de la plantilla." with a `Descargar plantilla` link.
  - Drag-and-drop is allowed but not required for v1.
- **Preview**:
  - Show the parsed rows in a `<DataTable>` (max 50 visible; if more, show a count + truncation note).
  - Bad rows highlighted with `bg-brand-danger/5` and an inline error message in a trailing column.
  - Counts at the top: `120 itinerarios reconocidos · 3 con errores`.
  - `Confirmar importación` button is disabled if any row has a blocking error. Allow `Confirmar omitiendo errores` (secondary) for partial imports.
- **Result**:
  - Summary card: `{n} importados · {n} omitidos · {n} fallidos`.
  - If any rows failed during the actual write, list them with the backend error message and a `Descargar errores` button (CSV).
  - Close button returns to the page; the table refetches automatically (invalidate `['itinerarios']`).
- **Cancel mid-flow** — confirm before discarding a parsed file with errors. No confirm needed before upload.

### Table

- Same conventions as clientes. Columns: naviera, buque, ruta (origen → destino), ETD, ETA, capacidad, estado, acciones.
- ETD/ETA columns: `tabular-nums`, sortable. Default sort: ETD ascending.

## Anti-patterns specific to this page

- Parsing the Excel client-side without showing a preview. Users need to see what they're about to commit.
- Replacing the whole list with the imported set without a preview step. Imports **append**; replacements are not supported in v1.
- Using a `toast.error` to communicate per-row import failures. Per-row errors go in the result table; the toast only conveys "import partially succeeded / failed".

## Reference (legacy)

- Source: legacy `pages/admin/itinerarios.vue` (path per AGENTS.md migration table; verify before porting)
- Excel parser: legacy uses SheetJS (`xlsx`). Reuse the same library to keep the file format identical.
