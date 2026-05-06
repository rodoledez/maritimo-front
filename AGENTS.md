<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# maritimo-front-next

Next.js 16 (App Router) + React 19 + Tailwind 4 + shadcn/ui rewrite of the legacy Nuxt 2 / Vuetify project at `../maritimo-front`. The legacy project is preserved as the live reference for screens that haven't been ported yet.

## What this app does

Maritime reservation system for **Acosta y Aguayo Intermodal Logistic Services**. Two roles share the same backend:

- **Admin** (`/admin/*`) — internal staff managing clients, bookings, itineraries, ports, navieras, etc.
- **Cliente** (`/cliente/*`) — customers submitting and tracking booking requests.

The role split is driven by `user.isClient` from the backend's `/auth/profile` payload.

## Stack

| Concern | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) — TypeScript |
| UI | shadcn/ui (Radix primitives + Tailwind) |
| Styling | Tailwind CSS 4, brand colors via CSS variables in `app/globals.css` |
| Forms | React Hook Form + Zod 3 + `@hookform/resolvers/zod` |
| Tables | TanStack Table v8 (custom shadcn DataTable wrapper) |
| Server state | TanStack Query (`@tanstack/react-query`) |
| HTTP | `axios` with interceptors (ported from old `services/api.js`) |
| Toasts | `sonner` |
| Icons | `lucide-react` |
| Auth | Custom JWT in `localStorage` (`access_token` + cached `user`) |
| Package manager | pnpm |
| Node | 22.x (matches sibling `portal-hermes-react`) |

## Repo layout

```
app/
├── layout.tsx               # Root: <html>, Poppins font, wraps Providers
├── providers.tsx            # QueryClientProvider + AuthProvider + <Toaster />
├── page.tsx                 # Root '/' — role-based redirect
├── login/page.tsx           # Login form (RHF + Zod)
├── (admin)/                 # Route group — admin role gate
│   ├── layout.tsx           # 'use client' — AuthShell role="admin"
│   └── admin/
│       ├── page.tsx         # Dashboard (KPI cards via /kpis)
│       ├── clientes/        # ✅ Full CRUD vertical slice (THE TEMPLATE)
│       │   ├── page.tsx
│       │   └── client-form-dialog.tsx
│       └── <other>/page.tsx # Stubs (reservas, itinerarios, usuarios, etc.)
└── (cliente)/               # Route group — client role gate
    ├── layout.tsx           # 'use client' — AuthShell role="client"
    └── cliente/
        ├── page.tsx         # Customer landing tiles
        └── <other>/page.tsx # Stubs
components/
├── ui/                      # shadcn primitives (button, dialog, table, …)
├── layout/
│   ├── auth-shell.tsx       # SidebarProvider + role guard + main layout
│   ├── app-sidebar.tsx      # Collapsible sidebar (uses shadcn Sidebar)
│   ├── app-header.tsx       # Top bar with user dropdown + logout
│   ├── env-indicator.tsx    # Non-prod environment banner (dismissible)
│   └── nav-links.ts         # Admin/cliente menu definitions
├── data-table/data-table.tsx # Generic TanStack Table wrapper
├── page-header.tsx          # Reusable page title + actions
└── stub-page.tsx            # Placeholder used by un-migrated routes
lib/
├── api/
│   ├── client.ts            # Axios instance + interceptors (token + refresh)
│   ├── auth.ts              # loginRequest / profileRequest
│   └── clients.ts           # Clients CRUD wrappers (template for other domains)
├── auth/
│   ├── auth-context.tsx     # useAuth() hook + AuthProvider
│   └── tokens.ts            # localStorage helpers (access_token + user)
├── hooks/
│   ├── use-clients.ts       # TanStack Query hooks for clients
│   └── use-kpis.ts          # Dashboard KPIs
└── utils.ts                 # cn() helper
hooks/use-mobile.ts          # shadcn helper (uses useSyncExternalStore)
types/
├── api.ts                   # ApiError shape + isApiError guard
└── domain.ts                # User, Client, LoginResponse, …
```

## Architectural decisions

These are deliberate — don't change without thinking through the consequences.

### 1. Client-rendered, not SSR

The original Nuxt app ran in SPA mode (`ssr: false`, `target: 'static'`). This rewrite preserves that: every page that needs auth state uses `"use client"`, the auth token lives in `localStorage` (not cookies), and the build prerenders empty shells that hydrate on the client.

**Why:** porting auth-cookie + edge middleware would require backend changes. The client-side guard (in `auth-shell.tsx`) is sufficient for an internal tool.

### 2. Custom JWT, not NextAuth

Auth flow ported as-is from the old `services/api.js`:
- `POST /auth/login` returns `{ access_token, user }` → stored in `localStorage`.
- Every authed request gets `Authorization: Bearer <token>` via the request interceptor in `lib/api/client.ts`.
- On any 401, the response interceptor calls `POST /auth/refresh` once (deduped via in-flight promise), updates the token, and retries the original request. If refresh fails → `clearAuth()` + `window.location.href = '/login'`.

**Why:** the backend already has this contract. NextAuth would have added boilerplate without buying anything.

### 3. Initial-state hydration, not setState-in-effect

Auth and env-indicator read `localStorage` synchronously inside `useState(() => …)` initializers, not inside `useEffect`. The effect only runs the async profile rehydration.

**Why:** React 19's `react-hooks/set-state-in-effect` rule fires (correctly) on cascading-render patterns. Initial-state initializers avoid the cascade. `hooks/use-mobile.ts` uses `useSyncExternalStore` for the same reason.

### 4. Route groups for role gating

`app/(admin)/layout.tsx` and `app/(cliente)/layout.tsx` are both `"use client"` and wrap children in `<AuthShell role="admin" | "client" links={...}>`. AuthShell:
- Shows a skeleton while `isHydrating`.
- Redirects unauth → `/login`, wrong-role → the other role's home.
- Renders the sidebar + header + main content area.

**Why:** the layouts MUST be client components because the `nav-links` array contains React components (`LucideIcon`), which can't cross the server→client boundary.

### 5. TanStack Query owns server state

Every domain hook lives in `lib/hooks/use-<domain>.ts` and exposes `useThings()`, `useCreateThing()`, `useUpdateThing()`, etc. Mutations invalidate `['things']`. Loading/error states come from the query hook. No manual `useState` for server data — ever.

## How to add a new admin CRUD page

This is mechanical — copy the `clientes` slice and tweak.

1. **Types:** add the shape to `types/domain.ts`.
2. **API wrappers:** create `lib/api/<domain>.ts` mirroring `lib/api/clients.ts` (list/create/update/activate/deactivate/delete). Endpoints are documented in the legacy project audit.
3. **Hooks:** create `lib/hooks/use-<domain>.ts` mirroring `lib/hooks/use-clients.ts`.
4. **Form dialog:** copy `app/(admin)/admin/clientes/client-form-dialog.tsx`, swap the Zod schema and fields. Reuse `explainError()` for `SequelizeUniqueConstraintError` mapping.
5. **Page:** copy `app/(admin)/admin/clientes/page.tsx`, swap columns + dialog + delete copy.
6. **Verify:** `pnpm lint && pnpm build`. Click through the page in dev.

Do NOT invent new patterns. If the clientes pattern doesn't fit, that's a signal to update the template — not to fork.

## Conventions

- **Spanish copy** in user-facing strings (matches the legacy app).
- **Brand colors via CSS variables** in `app/globals.css` (`--primary`, `--secondary`, `--brand-success`, `--brand-danger`, `--brand-warning`, `--brand-pending`, `--brand-violeta`, `--brand-celeste`, `--brand-azuldark`). Use `bg-primary`, `text-brand-success`, etc.
- **No new ad-hoc shadows / radii** — use shadcn defaults.
- **Toasts via `sonner`** (`toast.success(...)`, `toast.error(...)`). Never `alert()`.
- **Errors:** wrap API calls in try/catch, run through `errorMessage(error, fallback)` (or `explainError`) — preserves the Spanish error contract.
- **Icons:** `lucide-react` only. Don't pull in MDI / Material Icons.

## Commands

```bash
pnpm install     # one-time
pnpm dev         # dev server with Turbopack on http://localhost:3000
pnpm build       # production build (verify before committing significant changes)
pnpm lint        # ESLint
pnpm exec tsc --noEmit   # standalone type-check
pnpm start       # serve the production build
```

## Environment

Copy `.env.local.example` → `.env.local`:

```
NEXT_PUBLIC_API_BASE_URL=http://informatica.acostayaguayo.cl:3300
NEXT_PUBLIC_APP_ENV=development
```

`NEXT_PUBLIC_*` is required because the values are read in client components.

## Migration roadmap

For phased plan, effort estimates, per-phase definitions of done, and open questions for the backend team, see **`ROADMAP.md`** at the project root. The status table below is the short version.

## Migration status

| Route | State | Notes |
|---|---|---|
| `/login` | ✅ Done | RHF + Zod, role-based redirect on success |
| `/admin` | ✅ Done | KPI cards (uses `/kpis`) |
| `/admin/clientes` | ✅ **Template** | Full CRUD — reference for new admin pages |
| `/admin/{commodities,countries,type-containers,shipping-companies,ports}` | ✅ Done | Plain CRUD; `active` toggled via PATCH (no dedicated routes) |
| `/admin/usuarios` | ✅ Done | Includes change-password dialog. `active` via dedicated `/users/:id/{activate,deactivate}` |
| `/admin/reservas` | ✅ Done | Detail / edit / confirm / cancel dialogs. Edit/confirm/cancel gated on `Pendiente` status. |
| `/admin/itinerarios` | ✅ Done | CRUD + auto-calc transit time + Excel import + template download |
| `/cliente` | ✅ Done | Landing tiles |
| `/cliente/ver-itinerario` | ✅ Done | Read-only itineraries (`/itineraries?vigent=Y`) |
| `/cliente/ver-reservas` | ✅ Done | `/clients/:id/bookings` with detail dialog |
| `/cliente/crear-solicitud-reserva` | ✅ Done | 4-step wizard: filters → select itinerary → details → review/submit |

## Reference: legacy → new file mapping

When porting a screen, these are the source-of-truth files in `../maritimo-front`:

| New file | Source in legacy repo |
|---|---|
| `lib/api/client.ts` | `services/api.js` |
| `lib/api/auth.ts` | `nuxt.config.js` (auth module endpoints) |
| `app/page.tsx` redirect logic | `middleware/authorization.js` |
| `app/login/page.tsx` | `pages/login.vue` |
| `app/(admin)/admin/clientes/*` | `pages/admin/clientes.vue` |
| Sidebar admin links | `layouts/default-admin.vue` |
| Sidebar cliente links | `layouts/default-cliente.vue` |
| Brand color tokens | `nuxt.config.js` Vuetify theme |
| `components/admin/Reservas.vue` | (when porting `/admin/reservas`) |
| `components/FlujoReserva.vue` | (when porting `/cliente/crear-solicitud-reserva`) |
