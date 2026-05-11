# Acosta y Aguayo Maritime — Design System (MASTER)

> Single source of truth for `maritimo-front-next`. Page-specific deviations live in `design-system/pages/<page>.md` and **override** these rules.

**Stack:** Next.js 16 (App Router) · React 19 · Tailwind 4 · shadcn/ui · Poppins · `lucide-react`
**Audience:** internal staff (admin) + customers (cliente). Spanish-language internal tool.
**Pattern direction:** Data-Dense Operations Dashboard — KPI cards, data tables, CRUD dialogs, no marketing chrome.

---

## 1. Brand tokens (canonical)

The brand palette is defined in `app/globals.css` and **must not** be overridden in components. Use Tailwind utilities (`bg-primary`, `text-secondary`, `bg-brand-success`, etc.). Raw hex in JSX is a smell.

| Token              | Hex       | Use                                           |
| ------------------ | --------- | --------------------------------------------- |
| `--primary`        | `#0099DA` | Primary CTAs, links, focus rings, charts (1) |
| `--secondary`      | `#09005D` | Sidebar bg, headings on light, charts (2)    |
| `--brand-azuldark` | `#1E1382` | Sidebar accent / hover                        |
| `--brand-celeste`  | `#EDF3FE` | Login illustration bg, soft accent panels    |
| `--brand-violeta`  | `#9778BE` | Chart-5, decorative accents                   |
| `--brand-success`  | `#08A835` | Success state, "activo" badges                |
| `--brand-warning`  | `#EA8C00` | Warning state, "pendiente" badges, chart-4   |
| `--brand-danger`   | `#DD2F2F` | Destructive actions, error feedback           |
| `--brand-pending`  | `#FCD54E` | "En proceso" / awaiting badges                |
| `--destructive`    | `#DD2F2F` | shadcn destructive surfaces                   |

**Status badges** — use the shared `<StatusBadge tone="success|warning|pending|danger|neutral">` from `components/status-badge.tsx`. It bakes in the tone-correct background opacity, foreground color, and a default lucide icon (override via the `icon` prop, or pass `icon={null}` to suppress). Domain wrappers exist for the common cases:
- `<BookingStatusBadge status={…}>` (`components/booking/status-badge.tsx`) for `BookingStatus`.
- `<ActiveBadge active={…}>` (`components/data-table/active-cell.tsx`) for activo/inactivo columns.

Tone mapping (use these on every reserva / itinerario / cliente surface that shows state):
- `success` (activo / confirmada) → `bg-brand-success/10 text-brand-success`
- `pending` (pendiente / borrador) → `bg-brand-pending/20 text-brand-warning`
- `warning` (en proceso) → `bg-brand-warning/10 text-brand-warning`
- `danger` (cancelada / inactivo) → `bg-brand-danger/10 text-brand-danger`
- `neutral` (fallback) → `bg-muted text-muted-foreground`

---

## 2. Typography

Poppins is already loaded in `app/layout.tsx` as `--font-sans`. Don't add a second display font.

| Role            | Class                                | Notes                                      |
| --------------- | ------------------------------------ | ------------------------------------------ |
| Page title (h1) | `text-2xl font-semibold tracking-tight` | Use `<PageHeader title=… />`            |
| Section (h3)    | `text-sm font-semibold text-secondary` | Within dialog sections, review summaries (booking detail, wizard step 4). Smaller than the page-title scale on purpose to keep dense surfaces tight. Rendered as `<h3>` since `<h1>` is the page title. |
| Body            | `text-sm` (default)                  | Tables, forms, dense surfaces              |
| Helper / meta   | `text-xs text-muted-foreground`      | Form helper text, table secondary cells    |
| Numbers in tables | `tabular-nums`                     | Always for currency, counts, dates         |

**Line-height:** keep shadcn defaults (1.5 for body, 1.2 for headings). **Never** drop below `text-xs` for any user-facing copy.

---

## 3. Layout, density, spacing

This is an **operations tool**, not a marketing site. Density matters more than whitespace.

- Page container: `mx-auto max-w-7xl` inside the `<SidebarInset>`. The shell already supplies `p-4 md:p-6`.
- Spacing scale: 4 / 8 / 12 / 16 / 24 / 32 only — Tailwind `1 / 2 / 3 / 4 / 6 / 8`. No ad-hoc `p-[7px]`.
- Card padding: `p-4` throughout — that's what the customized `Card` primitive ships (`py-4` on the root, `px-4` on `CardHeader`/`CardContent`, `p-4` on `CardFooter`). Pass `<Card size="sm">` for a tighter `p-3` variant when stacking many cards in a single row. The earlier `md:p-6` upgrade has been retired in favor of consistent density across breakpoints — KPI cards and content cards share the same padding scale.
- Section gap: `space-y-6` between major sections, `space-y-4` inside a section.
- Tables: row height `h-11`, cell padding `px-3 py-2`. Don't expand row height for breathing room — use pagination instead. Header rows are **not** sticky: the shadcn `<Table>` primitive wraps in `overflow-x-auto` (creating a scroll container), which traps `position: sticky` inside the table card and produces a visible top gap rather than docking below the AppHeader. Page-level sticky would require flattening the primitive's overflow wrapper — not done.
- Dialogs — pick the width based on content density. The primitive caps to `max-w-[calc(100%-2rem)]` on phones; above 640px the caller's `max-w-*` wins (the primitive **no longer hardcodes** `sm:max-w-sm` — if you re-introduce it, every dialog in the app collapses to ~384px regardless of what callers pass):
  - `max-w-md` — confirmations / single-input prompts (`change-password-dialog`, `itinerary-import-dialog`).
  - `max-w-lg` — short forms with one reason field (`booking-cancel-dialog`).
  - `max-w-2xl` — small CRUD forms with 3–4 fields (`commodity`, `country`, `port`, `type-container`, `user`, `booking-confirm`).
  - `max-w-3xl` — multi-section CRUD forms or read-only details (`shipping-company`, `booking-edit`, `booking-detail`).
  - `max-w-4xl` — data-dense forms with 3+ sections and Selects (`itinerary-form`).
  - `max-w-5xl` — wide two-column forms where each column needs room for long values like emails (`client-form`).
- Border radius: stick to `--radius` (10px). Cards `rounded-xl`, inputs/buttons `rounded-lg` (which equals `--radius`). `rounded-md` evaluates to 8px in this theme — don't reach for it on interactive surfaces unless you specifically want the smaller corner.
- Shadows: shadcn defaults only. Don't introduce `shadow-2xl` outside the login card.

---

## 4. Component conventions

### Buttons
- One **primary** CTA per surface (`<Button>`). Secondary actions use `variant="outline"` or `variant="ghost"`. Destructive uses `variant="destructive"`.
- Async submit: `disabled={isSubmitting}` plus a `<Loader2 className="animate-spin" />` icon. Never leave a button enabled mid-request.
- Icon-only buttons: include `aria-label` (Spanish copy) and a tooltip via shadcn `<Tooltip>`. `TooltipProvider` is mounted at the app root in `app/providers.tsx` (with `delayDuration={300}`), so `<Tooltip>` works on every route — including `/login`, which is rendered outside `AuthShell`.

### Forms (RHF + Zod)

The canonical form pattern is `Controller` (from `react-hook-form`) + the `Field` primitive (`components/ui/field.tsx`). The older `Form`/`FormField`/`FormControl`/`FormMessage` wrappers are **deprecated** — every admin CRUD dialog has been migrated. Don't reintroduce them for new work.

**Anatomy of a form field:**
```tsx
<Controller
  name="email"
  control={form.control}
  render={({ field, fieldState }) => (
    <Field data-invalid={fieldState.invalid}>
      <FieldLabel htmlFor="some-id">
        Email <FieldRequiredMark />
      </FieldLabel>
      <Input
        {...field}
        id="some-id"
        type="email"
        aria-invalid={fieldState.invalid}
        placeholder="usuario@empresa.com"
        autoComplete="off"
      />
      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
    </Field>
  )}
/>
```

- **`<Field>`** propagates `data-invalid` so `<FieldLabel>` auto-paints `text-destructive` on error. Default `orientation="vertical"` stacks label-over-input with `gap-3`. Use `orientation="horizontal"` for checkbox+label rows or for the inline footer button row.
- **`<FieldGroup>`** stacks fields vertically with `gap-6`. Wrap groups of related fields in a `<FieldGroup>`; for multi-column rows inside a group, nest a `<div className="grid gap-6 sm:grid-cols-2">` (or `-3`).
- **`<FieldRequiredMark />`** — the subtle `*` (opacity-60). Inherits the parent label's `text-destructive` automatically on error.
- **`<FieldSectionTitle>`** — small section heading with a bottom border. Use when a form has 7+ fields naturally splitting into 2+ logical groups (`shipping-company`: *Datos* + *Contacto*; `itinerary`: *Viaje* + *Puertos* + *Fechas y cortes*; `client`: *Datos de la empresa* + *Contacto principal*). Skip sections for <6 field forms — they just add noise.
- **`<FieldDescription>`** — `text-xs text-muted-foreground` helper text, e.g. inside the Switch container in `user-form-dialog` ("Activado: el usuario es un cliente…").
- **`<FieldError errors={[fieldState.error]}>`** renders only when there's an error. Pass the RHF error as a single-element array; the component handles undefined gracefully.

**Form-level rules:**
- Validate on blur (`mode: "onBlur"`) for typed fields; on submit only for selects/checkboxes.
- Required fields: subtle `<FieldRequiredMark />` after the label text — never a separate badge.
- Multi-column layouts: nest a `<div className="grid gap-6 sm:grid-cols-2">` (or `-3`) inside `<FieldGroup>`. The grid's `gap-6` overrides the FieldGroup's vertical gap inside that row.
- Section spacing: `<form className="space-y-8">` between `<section className="space-y-5">` blocks. Inside each section, `<FieldSectionTitle>` followed by `<FieldGroup>`.
- **Submit button in `<DialogFooter>`, form in body** — give the `<form>` a stable `id` (e.g. `FORM_ID = "client-form"`) and set `<Button type="submit" form={FORM_ID}>` in the footer. This keeps the footer visually separated and avoids any scrolling-with-content quirks.
- After failed submit, focus the first invalid field. RHF does this when `mode: "onBlur"` + a Zod resolver is in place — don't fight it.
- Run API errors through helpers in `lib/utils/errors`: `errorMessage(error, fallback)` for the common path, `explainSequelizeError(error, fallback)` when you specifically need `SequelizeUniqueConstraintError` mapped to a Spanish field-level message. The local `explainError` in `clientes/client-form-dialog.tsx` is a per-domain variant retained for the username uniqueness case — don't propagate that pattern, factor any new domain-specific mappings into `lib/utils/errors`.

**Input sizing:** the `<Input>` primitive is `h-10 px-3 py-2`. Don't override per-form unless the field is genuinely special (e.g. a deliberately disabled read-only computed value).

### Tables (TanStack Table v8 wrapper)
- Horizontal scroll wrapper (`overflow-x-auto`) is mandatory — tables must never break the layout on tablet. Header is **not** sticky (see §3); the overflow wrapper traps it.
- **Toolbar** — `DataTable` exposes two slots that sit just above the table card:
  - `toolbarLeft` — primary list actions, starting with the **create CTA** (`<Button>` default/primary variant with a `<Plus />` icon, e.g. "Crear cliente"). For surfaces with multiple list-level actions (e.g. itinerarios has *Importar Excel* + *Crear*), keep the create button as primary and the secondary action as `variant="outline"`. When `toolbarLeft` is provided, search moves to the right edge.
  - `toolbarRight` — list-scoped controls (filters, view toggles). Use the shared `<FilterPopover>` helper from `components/data-table/filter-popover.tsx`: it renders an icon-only `<Button variant="outline" size="icon">` with `<SlidersHorizontal />`, a `bg-primary` 8px dot when the value is non-default, a `<PopoverHeader><PopoverTitle>` for the section label, and `variant="secondary"` / `variant="ghost"` toggles for the options. Don't reimplement the popover scaffolding per page.
  - When you adopt this pattern, **drop the create button from `<PageHeader>`** — `<PageHeader>` only carries title + description on list pages with a toolbar CTA.
- Empty state: centered icon + Spanish copy ("No hay clientes registrados") + primary CTA to create.
- Loading state: skeleton rows (5–8) inside the table body. Don't show a spinner over the whole page.
- Row actions: dropdown menu (`<MoreHorizontal />`) on the right. Don't sprinkle inline icon buttons across the row.
- Destructive row actions go in a confirm dialog (`<AlertDialog>`) — never one-click delete.
- Pagination on every list — default 10 rows, options `[10, 25, 50, 100]`.
- Use `tabular-nums` on numeric columns and right-align them. Apply both at once by setting `meta: { align: "right" }` on the column def — `DataTable` reads it and applies `text-right` to the header plus `text-right tabular-nums` to body cells. `meta: { align: "center" }` is also supported.

#### Cell rendering conventions
- **Identifier columns** (the row's primary noun: client, commodity, port, ship, type-container, user, etc.): use the shared `<IdentityCell name={…}>` from `components/data-table/identity-cell.tsx`. It renders a small `<Avatar size="sm">` with the first letter on `bg-brand-celeste text-secondary` plus the name in `font-medium`. Skip avatars for numeric/code identifiers (booking N°, itinerary ID, week number) — those stay plain.
- **Email columns**: use the shared `<EmailCell email={…}>` from `components/data-table/email-cell.tsx`. It emits a `mailto:` link with the right token (`text-primary underline underline-offset-2`), stops row click propagation, and shows `—` when the field is empty. Don't inline anchor tags.
- **Status columns**: keep using `<StatusBadge>` / `<ActiveBadge>` / `<BookingStatusBadge>` — don't reach for ad-hoc pills.

### Dialogs
- Title in Spanish, sentence case ("Crear cliente", not "Crear Cliente").
- Cancel button on the left, primary action on the right (Spanish convention is fine, matches shadcn default).
- Closing with unsaved changes: trust browser/dialog default for now; revisit if QA flags it.

### Toasts (sonner)
- `toast.success("Cliente creado")` — short, no period, sentence case.
- `toast.error(errorMessage(error, "No se pudo crear el cliente"))` — always pass through `errorMessage`/`explainError` so the API's Spanish error text wins when present.
- Position: top-right (already configured in `providers.tsx`). Auto-dismiss 4s.
- **Never** use `alert()` or `confirm()`.

### KPI / stat cards (dashboard)
- Use the shadcn `<Card>` primitive. Layout: small icon + label, then large number, then delta or sub-label.
- Number font: `text-3xl font-semibold tabular-nums`.
- Label: `text-sm text-muted-foreground`.
- Loading: skeleton block matching the final number's footprint to avoid CLS.

### Charts (when added)
- Use the `--chart-1..5` tokens already declared. Don't introduce new chart hex.
- `recharts` is the default lib (works cleanly with shadcn's `<ChartContainer>`).
- Trend over time → line, comparison → bar, share → donut (≤5 slices, otherwise bar). No pie.
- Always provide tooltip + legend + a screen-reader summary (`aria-label` on the chart wrapper).

### Status / role indicators
- Always pair color with text or icon (never color-only). E.g., the `pendiente` chip uses an amber dot **and** the word.
- Customer vs admin role label in user dropdown — already visible via `AppHeader`; don't duplicate elsewhere.

---

## 5. Copy & content

- **Spanish, Chilean register**, sentence case for headings ("Nuevos clientes" not "Nuevos Clientes").
- Buttons: imperative verbs ("Crear", "Guardar", "Cancelar", "Activar", "Eliminar"). Don't use "OK".
- Empty states: short, action-oriented. "Aún no tienes reservas. Crea tu primera solicitud." with a CTA.
- Error messages: state cause + recovery. "No se pudo guardar el cliente. Verifica los campos resaltados."
- Dates: `dd-MM-yyyy` for display; ISO for API. Use `date-fns` with `es` locale once it's added.
- Currency: `$ 1.234.567 CLP` (Chilean format) for amounts.

---

## 6. Accessibility (non-negotiable)

- Body contrast ≥ 4.5:1 against `--background`. Verified for primary brand on white. Don't put `text-muted-foreground` on `bg-muted` for body copy — fails contrast.
- Every interactive element shows a visible focus ring (`focus-visible:ring-2 focus-visible:ring-ring`). Don't strip it.
- Icon-only controls: `aria-label` in Spanish.
- Form fields: `<FormLabel>` is associated automatically by shadcn — keep it that way (don't bypass with raw `<label>` and break the link).
- Respect `prefers-reduced-motion`: limit animation to opacity/transform; durations 150–250ms.
- Keyboard: dialog trap focus, Escape to close, Tab order matches visual order. shadcn primitives give this for free — don't override.
- Color-blind safety: status communicated by **icon + text**, not color alone.

---

## 7. Loading, empty, error states

Every async surface ships with all four states. Missing one is a bug.

| State    | Pattern                                                                                  |
| -------- | ---------------------------------------------------------------------------------------- |
| Loading  | Skeleton matching final shape (rows for tables, blocks for KPIs). No full-page spinner. |
| Empty    | Centered icon (lucide), Spanish heading, helper line, primary CTA when applicable.       |
| Error    | Inline alert (`<Alert variant="destructive">`) with retry button. Never blank the page.  |
| Success  | Toast for transient ops; inline confirmation for in-place changes (e.g., toggle activo). |

For TanStack Query, derive UI from `isPending` / `isError` / `data?.length === 0` — don't track flags by hand.

---

## 8. Performance

- Images via `next/image` with `width`/`height` (already done for the login). No raw `<img>`.
- Server-state caching: TanStack Query's defaults from `providers.tsx` (`staleTime: 30s`, `retry: 1`). Don't tighten without a reason.
- Lazy-load heavy dialogs (e.g., the future booking wizard) with `next/dynamic` to keep the admin shell fast.
- Tables ≥100 rows: virtualize (`@tanstack/react-virtual`). Below that, paginate.
- Don't add a chart library or rich-text editor without first checking the bundle delta.

---

## 9. Anti-patterns (do not ship)

- Emoji as icons (use `lucide-react`).
- Raw hex in JSX / `style={{ color: '#0099DA' }}` — use tokens.
- Placeholder-as-label.
- `alert()` / `confirm()` / `window.prompt()`.
- One-click destructive operations.
- Color-only status indicators.
- Animating `width` / `height` / `top` / `left` (use `transform` / `opacity`).
- Mixing filled and outline lucide icons in the same toolbar.
- New ad-hoc shadow / radius scales — extend the existing tokens or don't.
- Marketing-style ornamentation on internal admin pages (gradients, hero sections, decorative blobs). The login page is the **only** branded surface.

---

## 10. Pre-delivery checklist (run before opening a PR)

- [ ] No emoji icons; lucide only, consistent style across the surface.
- [ ] All text uses tokens (`text-foreground`, `text-muted-foreground`, brand classes) — no raw hex in JSX.
- [ ] All async actions show loading + success/error states; no silent submits.
- [ ] All forms: visible labels, errors below the field, focus on first invalid on submit.
- [ ] All tables: horizontal scroll wrapper, empty state, skeleton loader, pagination. (Header is not sticky — see §3.)
- [ ] All destructive actions sit behind `<AlertDialog>` confirmation.
- [ ] Spanish copy reviewed; sentence case on headings; imperatives on buttons.
- [ ] Keyboard tab order matches visual order; focus rings visible.
- [ ] Tested at 1280px (default desktop), 1024px (laptop), and 768px (tablet). Mobile (<768) acceptable but not the priority for admin.
- [ ] `pnpm lint && pnpm exec tsc --noEmit` clean.
- [ ] Manually clicked through the new surface in dev — golden path + one error path.

Most code-level boxes (icons, tokens, async states, forms, tables, destructive confirms) are now enforced by shared primitives — `DataTable`, the `Dialog` primitive, `<StatusBadge>` / `<BookingStatusBadge>` / `<ActiveBadge>`, `<PageHeader>`, `<AuthShell>`. New page work mostly *applies* these; the human-pass items (Spanish copy review, keyboard, breakpoints, manual click-through) are where the bugs actually hide.

### 10.1 Browser pass minimum

Boxes 9 and 11 above require running `pnpm dev`. For an average page-level PR, the irreducible click-through is:

1. **Golden path** — open the new/changed surface, complete the primary action (create → save, edit → update, etc.). Confirm the success toast (top-right, 4s auto-dismiss) and that the affected list refetches.
2. **One error path** — either submit with an invalid field (confirm `<FormMessage>` shows under the field and submission is blocked) **or** force a backend error (devtools → Network → offline) and confirm the `<Alert variant="destructive">` + `Reintentar` pattern, **not** a silent failure.
3. **Three breakpoints** — 1280 (default desktop), 1024 (laptop), 768 (tablet). Watch for: horizontal page scroll, button overlap, sidebar collapse behavior, table column truncation. Add 375 (phone) **only** if the surface is on the `/cliente` role.
4. **Keyboard pass** — Tab from page top to the primary CTA; the focus ring must be visible at every stop. Press Enter on the CTA; it must trigger. ESC must close any open dialog.
5. **Reduced motion** — devtools → Rendering → "Emulate CSS media feature `prefers-reduced-motion`" → reduce. Confirm spinners stop spinning and modal entrance animations are clamped (the `@layer base` rule in `globals.css` does this; this step verifies it's wired up).

If your PR adds a new **dialog**, also:
- Open it on a 768px viewport with a deliberately tall form. Inner content must scroll; the X close button must stay docked top-right.
- Close it via the X, the Cerrar/Cancelar button, ESC, and click-outside. All four must work.

If your PR adds a new **table or DataTable consumer**, also:
- Paginate forward and back; switch page size between 10 / 25 / 50 / 100; the range display ("X–Y de Z") must update correctly.
- Sort a sortable column; the arrow indicator and `aria-sort` must reflect direction.
- Hover a row-action `MoreHorizontal` button; the "Acciones" tooltip must appear, then dismiss when you click and the dropdown opens.
- Scroll past the page header; the table header is not sticky (see §3) — confirm there is no visible top gap inside the table card and that header docking is not expected.
- If you used `meta: { align: "right" }` on any column, confirm the body cells use `tabular-nums` and right-align cleanly.

If the path you touched goes through `<Dialog>`, the X close button now lives inside `<Tooltip>`. Test that the tooltip "Cerrar" appears on hover and that the dialog still closes correctly via every dismissal route.

---

## 11. How to use this file

When building or reviewing a page:

1. Read this MASTER file.
2. Check `design-system/pages/<page-name>.md` (e.g., `dashboard.md`, `clientes.md`). If it exists, its rules **override** the rules above for that page only.
3. If a rule needs to change globally, edit this file and note the reason in the commit. Don't quietly diverge in components.
