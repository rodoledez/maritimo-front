# /admin/clientes — overrides (and template)

**Inherits from:** ../MASTER.md
**Status:** active — this is **THE TEMPLATE** for all other admin CRUD pages (`reservas`, `itinerarios`, `usuarios`, `commodities`, `countries`, `ports`, `shipping-companies`, `type-containers`).

## Why this page deviates

It doesn't really deviate — it **defines** how the rest of the admin CRUDs should look and behave. Listed here so that "look at clientes" is the canonical answer to most admin-page questions.

## Conventions to mirror in other CRUDs

- **Page header** — `<PageHeader title="Clientes" description="…" />`. Title is the plural noun in sentence case. **No `actions` prop** — the create CTA lives in the table toolbar (see below).
- **List shell** — `<DataTable>` directly under the `PageHeader`. The toolbar (search + actions + filters) sits in its own row above the bordered table card.
- **Toolbar** — see MASTER §4 *Toolbar*:
  - `toolbarLeft`: `<Button variant="outline">` "Crear cliente" with `<Plus />` icon.
  - `toolbarRight`: filter `<Popover>` triggered by `<Button variant="outline" size="icon">` with `<SlidersHorizontal />`. Default filter is **Estado** (Todos / Activos / Inactivos). Filtering is applied outside the table via `useMemo` over `data`; the table receives the already-filtered array. Show a `bg-primary` dot on the trigger when the filter ≠ "Todos".
- **Columns** — start with: identifier (avatar + name), contact, status badge, row actions. Right-align the actions column, give it a fixed width. See MASTER §4 *Cell rendering conventions* for avatar / email / status patterns.
- **Status column** — single chip per MASTER §1 (`activo` green, `inactivo` red). Pair color with text.
- **Row actions** — dropdown menu (`<MoreHorizontal />`): Editar, Activar/Desactivar (toggle based on current state), Eliminar (destructive, opens `<AlertDialog>`).
- **Create / edit dialog** — `client-form-dialog.tsx` is the template. Same component handles both modes via an optional `client` prop.
- **Form errors** — pipe through `explainError()` so backend `SequelizeUniqueConstraintError` becomes a field-level message in Spanish.
- **TanStack Query keys** — `['clients']` for list, `['clients', id]` for detail. Mutations invalidate `['clients']` only — don't invalidate the world.
- **Toast copy** — past-tense, no period: "Cliente creado", "Cliente actualizado", "Cliente eliminado", "Cliente activado", "Cliente desactivado".
- **Confirm dialog copy (delete)** — title: "¿Eliminar cliente?"; description names the entity ("Esta acción eliminará a {name}. No se puede deshacer."); confirm button: "Eliminar" (destructive variant).

## When porting a new CRUD

Mechanical steps in `AGENTS.md` ("How to add a new admin CRUD page"). If the clientes pattern doesn't fit, **update this file and MASTER** — don't fork the pattern.

## Reference (legacy)

- Source: `../maritimo-front/pages/admin/clientes.vue`
- API contract: `lib/api/clients.ts` (mirror this for new domains)
