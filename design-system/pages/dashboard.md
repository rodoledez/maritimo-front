# /admin — overrides

**Inherits from:** ../MASTER.md
**Status:** active

## Why this page deviates

The dashboard is the first thing internal staff see after login. It needs to answer "what needs my attention right now?" in one glance — KPI cards on top, recent activity below. It deviates from MASTER mainly in **header treatment** (greeting + role) and in **how loading states are composed** (skeleton-per-card, not a page-level spinner).

## Overrides

- **Header** — greeting line ("Bienvenido, {user.name}") instead of a `<PageHeader>` with action buttons. Subtitle: "Resumen de reservas marítimas". No primary CTA in the header — this page is read-only.
- **KPI grid** — `grid gap-4 sm:grid-cols-2 lg:grid-cols-4`. Four cards by default. Don't grow past four without first asking what's being de-prioritized — more than four KPIs is noise on a dashboard.
- **Stat card pattern** — defined inline in `app/(admin)/admin/page.tsx::StatCard`. If a second page needs the same pattern, extract it to `components/dashboard/stat-card.tsx` then. Don't pre-extract.
  - Title: `text-sm font-medium text-muted-foreground` (the metric label).
  - Value: `text-3xl font-semibold tracking-tight` (and `tabular-nums` once we add it — currently missing, fix when touching).
  - Subtitle: `text-xs text-muted-foreground` ("Hoy" / "Total").
  - Icon chip: 36×36 rounded-full circle, tinted `bg-{tone}/10 text-{tone}`. One icon per card, lucide.
- **Tone mapping** for the four canonical KPI cards:
  - Reservas pendientes (Hoy) → `warning` + `AlertTriangle`
  - Reservas confirmadas (Hoy) → `success` + `CheckCircle2`
  - Reservas pendientes (Total) → `muted` + `Clock`
  - Reservas canceladas (Total) → `danger` + `XCircle`
- **Loading state** — per-card `<Skeleton className="h-9 w-20" />` matching the value's footprint. Title/icon stay rendered to avoid CLS. **Do not** show a full-page spinner.
- **Empty value** — render `—` (em-dash) when `pickKpi(...)` returns `null`. Don't render `0` for missing data — `0` is a real value.
- **Activity section** — single `<Card>` with title "Últimas reservas". Currently a placeholder; when implemented:
  - Reuse the standard data-table conventions from `pages/clientes.md` (sticky header, skeleton, empty state).
  - Cap at 10 rows; link to `/admin/reservas` for the full list.
  - No row actions on the dashboard table — it's read-only here. Click-through opens the booking detail.
- **Refresh** — TanStack Query `staleTime: 60_000` is enough; no manual refresh button on the dashboard. If the user wants live data, that's a different feature.

## Anti-patterns specific to this page

- A welcome banner with a hero illustration. This is an ops dashboard, not a landing.
- Sparklines in KPI cards before we have the data shape to support them. Add only when `/kpis` returns time-series.
- Mixing Spanish numeric formatting in some cards and `Intl.NumberFormat('en-US')` in others. Use `Intl.NumberFormat('es-CL')` everywhere once formatting is added.

## Reference (legacy)

- Source: `../maritimo-front/components/admin/DashBoard.vue`
- Endpoint: `GET /kpis` returns `{ Today: {Pendiente, Confirmado, Cancelado}, Total: {...} }` (already typed in `lib/hooks/use-kpis.ts`).
