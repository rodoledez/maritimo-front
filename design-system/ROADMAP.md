# UI/UX Roadmap

Grounded in `MASTER.md` + `pages/*` and the current state of the codebase as of branch `main`. Items are ordered by **leverage / cost** — quick wins first, big rewrites last.

Legend: **P0** quick win (≤30 min), **P1** focused fix (≤half day), **P2** feature port (multi-day), **P3** nice-to-have.

---

## P0 — Quick wins (a couple of hours total)

These are direct contradictions between shipped code and `MASTER.md` / `pages/clientes.md`. Mostly copy + tokenization; no architecture changes.

### 1. Fix double-`<h1>` heading hierarchy
- `components/layout/app-header.tsx:43` renders `<h1>{title}</h1>`. Pages also render their own `<h1>` (e.g. `app/(admin)/admin/page.tsx:209`, `components/page-header.tsx:15`).
- Result: every authed screen has two `<h1>`s — fails a11y heading hierarchy.
- **Fix:** drop the `title` prop from `AppHeader`. Pages own the page title; the header is chrome only. The prop is currently unused by `AuthShell`, so this is a one-line removal.

### 2. Align clientes page copy with `pages/clientes.md`
- `app/(admin)/admin/clientes/page.tsx:166` — title `"Mantenedor de clientes"`. MASTER §pages/clientes says **plural noun in sentence case** → `"Clientes"`.
- Same file lines 73, 89, 137, 147 — toasts say `"Cliente {x} exitosamente"`. `pages/clientes.md` says past-tense, no period, no "exitosamente": `"Cliente creado"`, `"Cliente actualizado"`, `"Cliente eliminado"`, `"Cliente activado"`, `"Cliente desactivado"`.
- Lines 100/105/107 — column headers `"Nombre Empresa"` / `"E-mail contacto"` should be sentence case: `"Empresa"`, `"Email contacto"` (and `"Email"` everywhere — Real Academia accepts it without the hyphen).

### 3. Fix clientes confirm dialog copy
- `app/(admin)/admin/clientes/page.tsx:219` — title `"Eliminar cliente"`. `pages/clientes.md` requires `"¿Eliminar cliente?"`.
- Line 220–225 — description should match the spec: `"Esta acción eliminará a {name}. No se puede deshacer."` (currently a longer phrasing).

### 4. Fix form dialog button copy
- `app/(admin)/admin/clientes/client-form-dialog.tsx:267` — cancel button reads `"Cerrar"`. MASTER §4 Dialogs says `"Cancelar"`.
- Line 278 — primary button on create reads `"Guardar"`. MASTER says imperative for action — keep `"Guardar"` for edit, but use `"Crear"` for create. (Or standardize on `"Guardar"` everywhere if you prefer; pick one and document it.)

### 5. Mark required fields visually
- `client-form-dialog.tsx` — schema marks `name`, `username`, `contactName`, `contactEmail` as required, but no asterisk in labels. MASTER §4 Forms says append ` *` to the label.
- Trivial change in each `<FormLabel>`.

### 6. Validate on blur
- `client-form-dialog.tsx:100` — `useForm({ resolver, defaultValues })`. Add `mode: "onBlur"`. MASTER §4 Forms.

### 7. Use brand tokens, not raw hex, in login gradient
- `app/login/page.tsx:67` — `via-[#1e1382]`. The token `--brand-azuldark` is exactly `#1E1382` (`globals.css:105`). Replace with `via-brand-azuldark`. MASTER §1 Brand tokens.

### 8. Empty state in `DataTable` is text-only
- `components/data-table/data-table.tsx:132–141` — empty cell is one line of muted text. MASTER §4 Tables: centered icon + heading + helper + CTA when applicable.
- Minimal upgrade: accept an `emptyState?: React.ReactNode` prop alongside `emptyMessage`, render it spanning all columns. Keeps backwards-compatible.

### 9. Drop the loading-state regression in clientes
- `app/(admin)/admin/clientes/page.tsx:193–197` — full-table skeleton (`h-72`) replaces the table outright. MASTER §pages/clientes (and the dashboard pattern you just shipped): skeleton rows inside the table body, header stays rendered.
- Easiest path: hand the skeleton state to `<DataTable>` (`isLoading` prop) so every consumer benefits.

### 10. KPI numbers on dashboard need locale formatting
- `app/(admin)/admin/page.tsx:65` — value rendered as plain `{value}`. Once a count crosses 1000 it'll read `1234` instead of `1.234`. MASTER §5 Copy.
- `Intl.NumberFormat('es-CL').format(value)` on render. Three lines.

---

---

## Layout (general shell) — `auth-shell` / `app-sidebar` / `app-header` / `env-indicator` / `page-header`

These cut across every authenticated page, so fixing them once lifts the whole app. Mixed P0 and P1; group them in a single PR if you can.

### L1. Sidebar nav has no grouping (P1)
- `components/layout/nav-links.ts:23` — 10 admin links in one flat list. Operational items (Inicio, Clientes, Reservas, Itinerarios, Usuarios) and catalog items (Commodities, Contenedores, Puertos, Países, Navieras) are visually equal weight.
- MASTER §9 `nav-hierarchy`: primary vs secondary nav must be clearly separated.
- **Fix:** split `adminLinks` into two arrays (`adminPrimary`, `adminCatalogs`) and render them as two `SidebarGroup`s with labels (`<SidebarGroupLabel>Operación</SidebarGroupLabel>` / `Catálogos`). shadcn's `Sidebar` already supports this; `app-sidebar.tsx:46` only renders one group.

### L2. Two nav items use the same icon (P0)
- `nav-links.ts:25` and `nav-links.ts:28` — `Clientes` and `Usuarios` both use `Users`.
- Violates `icon-style-consistent` and makes the collapsed (icon-only) sidebar ambiguous.
- **Fix:** keep `Users` for `Clientes` (companies); use `UserCog` or `ShieldUser` for `Usuarios` (internal staff).

### L3. Logo brand text is wrong case (P0)
- `app-sidebar.tsx:41` — `"maritimo-reservas"` (lowercase + hyphen, the package name).
- Brand is **Acosta y Aguayo**; product is **Maritimo Reservas**. MASTER §5 Copy (sentence case).
- **Fix:** `"Marítimo Reservas"` (with the accent) — or the brand name `"Acosta y Aguayo"` if you'd rather the company is the anchor.

### L4. Hydration skeleton causes CLS (P1)
- `auth-shell.tsx:47–56` — while `isHydrating`, renders three centered Skeleton lines on a blank screen. Once hydrated, the full sidebar+header+content layout snaps in. Big visible jump.
- MASTER §3 Performance: reserve space for async content (CLS < 0.1).
- **Fix:** render the same shell skeleton — sidebar (dark column 64px wide), header (h-14 bar), and a content skeleton inside. Same `<SidebarProvider>` + `<SidebarInset>` shape, just with placeholder content. The user sees structure, not a blank screen.

### L5. Missing `id="main"` skip-link target (P0)
- `auth-shell.tsx:69` — `<main>` has no id.
- Pair with the skip-link from P0#17 (root layout) for full keyboard navigation.
- **Fix:** `<main id="main" tabIndex={-1} className="…">`.

### L6. EnvIndicator: contrast + touch-target + per-env dismissal (P0)
- `components/layout/env-indicator.tsx:26` — `text-brand-warning` (#EA8C00) on `bg-brand-warning/15` likely fails 4.5:1 AA. Quick check with a contrast tool — if it does, swap text to a darker variant (e.g. `text-brand-warning` → a custom `--brand-warning-foreground` token, or `text-secondary`/`text-foreground`).
- Line 31: dismiss button is `h-6 w-6` (24×24). MASTER §2 minimum is 44×44 / 48×48. Bump to `h-8 w-8` minimum and use `hitSlop`-style padding wrapper if visual size must stay small.
- Line 7: `STORAGE_KEY = "env-indicator.dismissed"` — same key for every env. Dismiss in dev → stays dismissed when you swap to staging. **Fix:** include the env name in the key: `` `env-indicator.dismissed:${env}` ``.

### L7. AppHeader renders an `<h1>` that fights the page's `<h1>` (P0)
- Already in P0#1. Duplicated here so the layout PR catches it.
- `app-header.tsx:43` — drop the `title` prop entirely. The `AppHeader` is chrome; the page owns its title.

### L8. AppHeader: "Mi perfil" is a disabled menu item (P0)
- `app-header.tsx:67` — `<DropdownMenuItem disabled>` for "Mi perfil". MASTER anti-pattern: "Controls that look tappable but do nothing".
- **Fix:** either build a `/admin/perfil` (or `/cliente/perfil`) page (P2-scope) or **remove the item** until then. Removing is correct for now.

### L9. Logout needs visual separation (P0)
- `app-header.tsx:70` — `Cerrar sesión` is colored destructive but sits adjacent to `Mi perfil` with only a label/separator above. MASTER §9 `destructive-nav-separation`: destructive must be spatially separated.
- **Fix:** add `<DropdownMenuSeparator />` immediately above the logout item (between profile and logout).

### L10. PageHeader is the standard, but `/admin` doesn't use it (P0)
- `app/(admin)/admin/page.tsx:198–207` — dashboard rolls its own `<h1>` + subtitle. Other pages use `<PageHeader>` (`components/page-header.tsx`).
- Inconsistent shape across the app.
- **Fix:** dashboard renders `<PageHeader title={`Bienvenido${user?.name ? ", " + user.name : ""}`} description="Resumen de reservas marítimas" />`. Keeps one source of truth.

### L11. No max-width container on pages (P1)
- `auth-shell.tsx:69` — `<main>` is `flex-1 … p-4 md:p-6`, no `max-w-7xl mx-auto`. On a 27" monitor the content stretches edge-to-edge, hurting scan-ability of forms/dialogs.
- MASTER §3 Layout: container `mx-auto max-w-7xl`.
- **Fix:** wrap children in an inner div: `<div className="mx-auto w-full max-w-7xl">{children}</div>`. Tables that need full width can opt-out with their own wrapper.

### L12. `<main>` doesn't use `dvh` (P1)
- `auth-shell.tsx:48,69` — uses `min-h-screen`. MASTER §5 `viewport-units`: prefer `min-h-dvh` to avoid mobile address-bar jump.
- **Fix:** swap `min-h-screen` → `min-h-dvh` in the hydration skeleton; `<main>` already inherits height from `<SidebarInset>`, but worth a check.

### L13. Sidebar footer copyright is static (P3)
- `app-sidebar.tsx:71` — `© Acosta & Aguayo`.
- Consider adding the year (`© {new Date().getFullYear()} Acosta & Aguayo`) and a small version string from `package.json` so support can identify deployed builds.

### L14. Auth route gating runs after render (P3)
- `auth-shell.tsx:32–45` — `useEffect` triggers redirect; for one frame the wrong-role user can see a flash of the other role's shell.
- Acceptable for an internal tool, but if you ever expose this externally, gate via a server-side cookie + middleware. (Big change — leave for later.)

### L15. EnvIndicator + sticky header interaction (verify, no fix needed)
- Banner sits above the sticky header. When the user scrolls, the banner scrolls away and the header takes over `top: 0`. Verified visually OK; flagging only so you don't add `sticky` to the banner thinking it's missing.

---

## P1 — Polish (each ≤ half-day)

Patterns the design system requires but that need a tiny bit of design or component work.

### 11. Promote `StatCard` and the recent-reservas table to shared components
- Currently inline in `app/(admin)/admin/page.tsx`. Once `/admin/reservas` ships and the cliente landing wants a "Mis reservas" card, you'll re-implement them. Move to:
  - `components/dashboard/stat-card.tsx`
  - `components/reservas/reservas-table.tsx` (parametrized by `limit`, `showHeader`, `compact`)
- Don't pre-extract things you only have one user for; do extract these because the second use is already mapped (`pages/dashboard.md` and the upcoming reservas page).

### 12. Page-size selector + row count in `DataTable`
- `pages/clientes.md`: page size `[10, 25, 50, 100]`, default 10. Show `Mostrando 1–10 de 47` on the right of the pagination row.
- File: `components/data-table/data-table.tsx:145–168`.

### 13. Sidebar nav: active state visibility
- `components/layout/app-sidebar.tsx` — verify the active route gets a clearly distinct treatment (left bar / pill / weight). MASTER §9 `nav-state-active`. shadcn's `SidebarMenuButton isActive` covers this; check it's wired.
- Same file: confirm the trigger has `aria-label="Abrir menú"` for screen readers.

### 14. Cliente landing tiles → use lucide, not the mismatched current set
- `app/(cliente)/cliente/page.tsx` — peek and confirm icons are lucide and consistent stroke. (Quick check; if mixed, fix.)

### 15. Form A11y hardening
- After failed submit, focus the first invalid field. RHF gives this if you call `form.handleSubmit(onSubmit, onError)` and the labels are wired through `<FormField>` — verify it actually moves focus on the clientes dialog.
- Add `autocomplete` attrs (`autoComplete="email"`, `"organization"`, `"tel"`) on the form fields. Helps password managers and is one MASTER §4 rule.

### 16. Dashboard recent-reservas: server-side sort/limit
- `lib/api/reservas.ts:14` — `listReservas()` fetches all bookings; `useRecentReservas` sorts/slices client-side. Fine for now; **don't** ship to prod with thousands of bookings.
- When the backend exposes query params, add `listReservas({ limit, sort })`. Until then, leave a `TODO` comment with the constraint.

### 17. Skip-link to main content
- `app/layout.tsx` — add a `<a href="#main">Saltar al contenido</a>` skip-link, visible only on focus, plus `id="main"` on the main region in `auth-shell.tsx`. MASTER §6 a11y.

### 18. Kill `components/stub-page.tsx` references gradually
- 11 pages render `<StubPage />`. Each port from P2 below removes one. Track removals in commit messages so the migration table in `AGENTS.md` stays honest.

---

## P2 — Feature ports (multi-day each, in priority order)

The 11 stub pages, ranked by how much they unblock real users.

| Order | Route | Effort | Unlocks | Notes |
|------:|-------|--------|---------|-------|
| 1 | `/admin/reservas` | 3–5 days | Daily ops workflow (highest impact) | Spec: `pages/reservas.md`. Reuse the new `RecentReservasCard` shape. |
| 2 | `/admin/usuarios` | 1–2 days | Onboarding new staff | Plain CRUD + change-password dialog. Mirror `clientes`. |
| 3 | `/cliente/ver-reservas` | 1 day | Customers can self-serve check status | Read-only list, scoped to `user.Client.id`. Same table shape as #1, no row actions. |
| 4 | `/cliente/crear-solicitud-reserva` | 5–7 days | Customer self-service booking | Spec: `pages/flujo-reserva.md`. **Its own session.** Build the wizard component first, then wire fields. |
| 5 | `/admin/itinerarios` | 3–4 days | Replace manual itinerary entry | Spec: `pages/itinerarios.md`. Excel import is the hard part. |
| 6 | `/cliente/ver-itinerario` | 1 day | Customer-facing itinerary view | Read-only filter of #5's data. |
| 7 | `/admin/shipping-companies` | 0.5 day | Catalog | Plain CRUD; copy clientes. |
| 8 | `/admin/ports` | 0.5 day | Catalog | Plain CRUD; copy clientes. |
| 9 | `/admin/countries` | 0.5 day | Catalog | Plain CRUD; copy clientes. |
| 10 | `/admin/commodities` | 0.5 day | Catalog | Plain CRUD; copy clientes. |
| 11 | `/admin/type-containers` | 0.5 day | Catalog | Plain CRUD; copy clientes. |

**Suggested phases:**
- **Phase A (week 1–2):** P0 + P1 + reservas (#1) + usuarios (#2). After this the admin app is fully usable.
- **Phase B (week 3–4):** customer self-serve — ver-reservas (#3) + flujo-reserva (#4).
- **Phase C (week 5):** itinerarios (#5) + ver-itinerario (#6).
- **Phase D (week 6):** all five plain catalog CRUDs (#7–#11) batched. Each is half a day if you mechanically copy clientes.

---

## P3 — Future / nice-to-have

Not blockers. Re-evaluate after Phase B.

- **Dark mode** — tokens are already structured for it (CSS variables under `:root`); add a `.dark` block in `globals.css` and a toggle in `AppHeader`. Verify contrast independently per `MASTER.md §6`.
- **Bulk actions on tables** — multi-select + "Eliminar seleccionados". Useful for itinerarios after the Excel import lands.
- **Saved filter views** — store filter sets as URL-shareable presets ("Mis reservas pendientes esta semana").
- **Audit log** — who changed what, when. Reservas would benefit; depends on backend.
- **Real charts on dashboard** — replace placeholder stat cards with a 7-day reservas trend (line) + status breakdown (bar). `pages/dashboard.md` already says "no sparklines until backend exposes time-series" — that condition gates this.
- **i18n scaffold** — Spanish-only today. If English is needed, route through `next-intl` early; bolting it on later is painful.
- **Server-side pagination + filters** for `/admin/reservas` and `/admin/itinerarios` once the backend supports it. Marked as `TODO` in P1#16.
- **PWA / offline read** — customers checking reservation status from the dock at 6 a.m. with bad connectivity. Low priority but high goodwill.
- **CSV export** — reservas + itinerarios. One day each.
- **Keyboard shortcuts** — `cmd+k` for global search, `n` for new record on list pages. Power-user feature for ops staff.

---

## How to use this roadmap

- Treat **P0** + **Layout (P0 items)** as a single PR — they're all small string/token tweaks across the shell and clientes.
- **P1** items pair well with their related P2 work — e.g. extract the `<StatCard>` (P1#11) when starting `/admin/reservas` (P2#1).
- The **Layout** section is the highest-leverage block: every page benefits. Land L1–L10 before any P2 port so new pages inherit the fixed shell.
- When porting any P2 page, **read `pages/<page>.md` first** — those files are the brief.
- If a fix fights MASTER, edit MASTER and note why in the commit. Don't quietly diverge.
