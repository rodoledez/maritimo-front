# Page-specific overrides

Each file here documents **deviations** from `../MASTER.md` for one page or route group. If a page follows MASTER cleanly, it doesn't need a file here.

## Structure

```
pages/
├── dashboard.md          # /admin (KPI dashboard)
├── clientes.md           # /admin/clientes (CRUD template)
├── reservas.md           # /admin/reservas (when ported)
├── itinerarios.md        # /admin/itinerarios (when ported)
├── flujo-reserva.md      # /cliente/crear-solicitud-reserva (multi-step)
└── login.md              # /login (only branded surface)
```

## File template

```markdown
# /<route> — overrides

**Inherits from:** ../MASTER.md
**Status:** [draft | active | deprecated]

## Why this page deviates

One paragraph. Anchor to a constraint (data shape, user task, legacy parity).

## Overrides

- **<Topic>** — what's different, why, how to apply.

## Reference (legacy)

- Source file in `../maritimo-front`: <path>
```

## When to add a page file

- The page needs a layout that breaks MASTER's container/spacing rules.
- The page has a unique interaction the MASTER form/table conventions don't cover (e.g., the multi-step booking wizard).
- The page is the only surface where a normally-banned pattern is allowed (e.g., the login gradient).

## When NOT to add a page file

- You disagree with MASTER. Edit MASTER instead — page files are for *legitimate* deviations, not personal preference.
- The override is one component, not a page. Fix it in the component.
