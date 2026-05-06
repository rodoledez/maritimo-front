# /admin/reservas — overrides

**Inherits from:** ../MASTER.md and `pages/clientes.md`
**Status:** draft (page is a stub; this file describes the target design when the port happens)

## Why this page deviates

Reservas (bookings) is the highest-traffic admin surface. The legacy `Reservas.vue` is 1300+ lines and exposes: a searchable table, status filtering, inline status changes, a multi-section edit form, and document attachments. It deviates from the plain `clientes` template in **filter density**, **row state**, and **the edit dialog being big enough to need tabs/sections**.

## Overrides

### Filter bar (above the table)

- Sticky to the top of the table card (`sticky top-0 bg-card z-10`) so it stays usable while scrolling long lists.
- Layout: `flex flex-wrap gap-3 items-center` — never let it wrap so far it pushes the table off-screen on tablet (≥768px).
- Controls (left → right):
  1. Search input (by booking code or client name) — debounced 250ms, icon: `Search`.
  2. Status `<Select>` — options: `Todas`, `Pendiente`, `Confirmada`, `En proceso`, `Cancelada`. Default: `Todas`.
  3. Date range — `<Popover>` + `<Calendar range />`. Default: last 30 days. Show the resolved range in the trigger ("01-04-2026 → 30-04-2026").
  4. Cliente `<Combobox>` — filterable, only when the user is admin (clientes already see only their own).
  5. Right-aligned: `Limpiar filtros` button (ghost variant), enabled only when any filter is non-default.
- Filter state lives in URL query params (`?status=Pendiente&from=…`) so deep-links and the back button work. Use `useSearchParams` + `router.replace`.

### Table columns

- Booking code (monospaced, `font-mono text-xs`)
- Cliente (text + small secondary line for company shortname)
- Origen → Destino (compact, with `→` separator; on tablet collapse to a single column with line break)
- ETD / ETA (right-aligned, `tabular-nums`, `dd-MM-yyyy`)
- Estado (status chip per MASTER §1)
- Acciones (dropdown menu)

### Row actions (dropdown)

- `Ver detalle` — opens detail dialog (read-only summary + linked documents).
- `Editar` — opens edit dialog.
- `Cambiar estado` — submenu with the four statuses; current status is checked. Confirms with toast `Estado actualizado`.
- `Descargar documentos` — only when the booking has attachments.
- `Cancelar reserva` — destructive, opens `<AlertDialog>`. Title: "¿Cancelar reserva {code}?". Different from "Eliminar" — cancellations are reversible by support.

### Edit dialog

- Wider than the clientes dialog: `sm:max-w-3xl`.
- Use `<Tabs>` to split the form: `Cliente y ruta` · `Carga` · `Documentos`. Don't try to cram everything into one scrolling form.
- Each tab is its own RHF section but the same form instance — submitting from any tab posts the whole booking.
- Validation: on blur per field; on submit, if errors exist outside the active tab, **switch to the first tab with errors** before focusing the field. Otherwise the user sees a "submit failed" toast with no visible error.

### Empty / loading / error

- Loading: 8 skeleton rows. Filter bar stays interactive (the user can refine before the first result lands).
- Empty (no filters): Spanish copy "No hay reservas registradas" + CTA `Nueva reserva`.
- Empty (filtered): "Ninguna reserva coincide con los filtros." + ghost button `Limpiar filtros`.
- Error: inline `<Alert variant="destructive">` above the table, with a `Reintentar` button (calls TanStack Query `refetch`).

### Pagination

- Server-side. Page size selector: `[25, 50, 100]` — bookings tables are denser than clientes; default 25.

## Anti-patterns specific to this page

- Don't filter on the client. The list will exceed 1000 rows in production; pagination must be backend-driven.
- Don't show status as a dropdown directly in the row — too easy to mis-click. Status changes go through the row-actions menu with a confirm toast.
- Don't link "Cancelar reserva" and "Eliminar reserva" to the same handler. Cancel sets `status = Cancelada`; delete (admin-only, hidden in the menu unless `user.role === 'admin'` once we add roles) hard-removes.

## Reference (legacy)

- Source: `../maritimo-front/components/admin/Reservas.vue` (1308 lines — read it before porting; the field list is the contract)
- API contract: see `lib/api/clients.ts` for the shape; create `lib/api/reservas.ts` mirroring it.
