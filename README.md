# maritimo-front-next

Next.js 16 + shadcn/ui rewrite of the legacy Nuxt 2 / Vuetify [`maritimo-front`](../maritimo-front) reservation system for **Acosta y Aguayo Intermodal Logistic Services**.

## Quick start

```bash
pnpm install
cp .env.local.example .env.local        # adjust if your backend isn't the default
pnpm dev
```

Open http://localhost:3000.

## Environment

| Variable | Default | Purpose |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | `http://informatica.acostayaguayo.cl:3300` | Backend base URL (axios + interceptors) |
| `NEXT_PUBLIC_APP_ENV` | `development` | Drives the env banner; hidden when `production` |

Both are `NEXT_PUBLIC_*` because they're read in client components.

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Dev server (Turbopack) on :3000 |
| `pnpm build` | Production build — also runs TypeScript |
| `pnpm start` | Serve the built app |
| `pnpm lint` | ESLint (strict React 19 rules) |
| `pnpm exec tsc --noEmit` | Standalone type-check |

## What's implemented

- ✅ Login (`/login`) with role-based redirect
- ✅ Admin shell (sidebar + header + role guard) at `/admin`
- ✅ Admin dashboard (`/admin`) — KPI cards
- ✅ **`/admin/clientes` — full CRUD vertical slice**, used as the template for other admin maintainers
- ✅ Cliente shell + landing (`/cliente`)
- 🟡 13 routes scaffolded as stubs — see `AGENTS.md` for the full migration table

## Architecture in 30 seconds

- **Client-rendered SPA.** Token in `localStorage`, role gate in client layouts.
- **Auth flow** ported as-is from the old `services/api.js` — request interceptor injects the bearer token, response interceptor refreshes-and-retries on 401.
- **Server state** via TanStack Query. Mutations invalidate query keys; no manual loading state.
- **Forms** via React Hook Form + Zod.
- **UI** via shadcn/ui primitives over Radix + Tailwind 4. Brand palette in `app/globals.css`.

For the full picture (decisions, conventions, how to add a new CRUD page), read **`AGENTS.md`**. For the phased migration plan (what's left, in what order, with effort estimates), read **`ROADMAP.md`**.

## Project structure

```
app/             # App Router routes + layouts
  (admin)/       # Admin role-group
  (cliente)/     # Cliente role-group
  login/
components/
  ui/            # shadcn primitives
  layout/        # Sidebar, header, env indicator, auth shell
  data-table/    # TanStack Table wrapper
lib/
  api/           # axios instance, auth, domain wrappers (clients.ts is the template)
  auth/          # AuthProvider + useAuth() + token storage
  hooks/         # TanStack Query hooks per domain
types/           # Shared TS types (domain + api)
```

## Backend

This frontend is paired with the maritime reservation backend at `../maritimo-back`. The frontend doesn't own any data models — see that project for the source of truth on schemas and endpoints.

## License & attribution

Internal project for Acosta y Aguayo. Not published.
