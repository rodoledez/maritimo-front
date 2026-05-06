# /admin/clientes — overrides (and template)

**Inherits from:** ../MASTER.md
**Status:** active — this is **THE TEMPLATE** for all other admin CRUD pages (`reservas`, `itinerarios`, `usuarios`, `commodities`, `countries`, `ports`, `shipping-companies`, `type-containers`).

## Why this page deviates

It doesn't really deviate — it **defines** how the rest of the admin CRUDs should look and behave. Listed here so that "look at clientes" is the canonical answer to most admin-page questions.

## Conventions to mirror in other CRUDs

- **Page header** — `<PageHeader title="Clientes" actions={<CreateButton />} />`. Title is the plural noun in sentence case.
- **List shell** — `<Card>` wrapping the `<DataTable>`. No filter bar yet; add one only when needed.
- **Columns** — start with: identifier, name, contact, status badge, row actions. Right-align the actions column, give it a fixed width.
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
