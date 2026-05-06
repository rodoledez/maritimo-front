# Migration roadmap — `maritimo-front` (Nuxt 2 / Vuetify) → `maritimo-front-next` (Next 16 / shadcn)

This roadmap drives the Vue 2 → React 19 migration to completion. Each phase is independently shippable: at the end of every phase the app is still usable and the legacy frontend can keep running in parallel until Phase 6 (cutover).

**Read first:** `AGENTS.md` (architecture, conventions, "How to add a new admin CRUD page") and `README.md` (commands, env).

---

## Status snapshot

| Phase | Scope | State |
|---|---|---|
| 0 | Foundation, auth, layouts, `/admin/clientes` template | ✅ Done |
| 1 | Five plain admin maintainers (commodities, countries, ports, shipping-companies, type-containers) | ✅ Done |
| 2 | `/admin/usuarios` (CRUD + change-password sub-flow) | ✅ Done |
| 3 | `/admin/reservas` (bookings table + confirm/cancel + detail dialog + edit) | ✅ Done |
| 4 | `/admin/itinerarios` (CRUD + Excel import + template download) | ✅ Done |
| 5 | Cliente read-only views (`ver-itinerario`, `ver-reservas`) | ✅ Done |
| 6 | Multi-step booking wizard (`/cliente/crear-solicitud-reserva`) | ✅ Done |
| 7 | Polish (error boundary, CI). Forgot-password / Playwright E2E / prod cutover deferred. | 🟡 Partial |

All routes build and pass TypeScript + ESLint. Phases 1–6 are wired against the documented backend contract; verify each end-to-end with the live backend before declaring production-ready.

---

## Phase 0 — Foundation (✅ done)

What landed:

- Next 16 (App Router) + React 19 + Tailwind 4 + shadcn/ui scaffold
- Brand theme (`#0099DA`, `#09005d`, status palette) ported from Vuetify
- `lib/api/client.ts` — axios + bearer interceptor + `/auth/refresh` retry
- `lib/auth/auth-context.tsx` — `useAuth()`, `localStorage` hydration via initial state
- `(admin)` and `(cliente)` route groups with role gates in `auth-shell.tsx`
- `/login`, `/admin` (KPI cards), `/admin/clientes` (full CRUD) — the **template**
- Stubs for the 13 remaining routes so sidebar links resolve
- Lint + build clean

This is the reference implementation. Everything from Phase 1 onward should look like this.

---

## Phase 1 — Plain admin maintainers (5 pages)

**Pages:** `/admin/commodities`, `/admin/countries`, `/admin/ports`, `/admin/shipping-companies`, `/admin/type-containers`

All five are simple list-and-edit screens — same shape as `clientes`, smaller schemas. Mechanical clone-and-tweak.

**Per page (~1 hour):**

1. Read the legacy file `pages/admin/<name>.vue` — copy field list, validation rules, table columns.
2. Add the entity type to `types/domain.ts`.
3. Create `lib/api/<name>.ts` mirroring `lib/api/clients.ts` (list/create/update/delete; some have activate/deactivate).
4. Create `lib/hooks/use-<name>.ts` mirroring `lib/hooks/use-clients.ts`.
5. Create the form dialog: copy `app/(admin)/admin/clientes/client-form-dialog.tsx`, swap schema and fields.
6. Create the page: copy `app/(admin)/admin/clientes/page.tsx`, swap columns and dialog.
7. `pnpm lint && pnpm build`.

**Endpoint map (already cataloged):**

| Page | Endpoints |
|---|---|
| commodities | `GET/POST /commodities`, `PATCH/DELETE /commodities/:id` |
| countries | `GET/POST /countries`, `PATCH/DELETE /countries/:id` |
| ports | `GET/POST /ports`, `PATCH/DELETE /ports/:id` |
| shipping-companies | `GET/POST /shipping-companies`, `PATCH/DELETE /shipping-companies/:id` |
| type-containers | `GET/POST /type-containers`, `PATCH/DELETE /type-containers/:id` |

**Definition of done:** all five pages allow create / edit / delete against the live backend, with sonner toasts on success/error and Spanish error mapping.

**Risk:** low. If a schema diverges from the clientes template (e.g., needs a `Country` foreign key dropdown), wire that with shadcn `Select` populated from the corresponding query — not a fundamental change.

---

## Phase 2 — `/admin/usuarios`

**Why separated:** has a sub-flow the others don't — change-password dialog (`PUT /users/:id/change-password`).

**Endpoints:** `GET/POST /users`, `PATCH /users/:id`, `PUT /users/:id/activate|deactivate`, `PUT /users/:id/change-password`.

**Sub-tasks:**

1. Standard CRUD page following Phase 1 recipe.
2. Add a "Cambiar contraseña" item in the row actions dropdown that opens a separate `Dialog` with two fields (`newPassword`, `confirmPassword`) and a Zod refinement that they match.
3. Mutation in `lib/hooks/use-users.ts` invalidates nothing on success (password change has no list-level side effect) but raises a toast.

**Definition of done:** admins can create users, edit user metadata, toggle active state, and reset passwords.

---

## Phase 3 — `/admin/reservas` (bookings)

**Source files in legacy:** `pages/admin/reservas.vue`, `components/admin/Reservas.vue`, `components/DetalleReserva.vue`.

**Endpoints:** `GET /bookings`, `PUT /bookings/:id`, `PUT /bookings/:id/confirm`, `PUT /bookings/:id/cancel`. The `Booking` type is already in `types/domain.ts`.

**What's different from Phase 1:**

- Many columns; status is a colored badge (`Pendiente / Confirmado / Cancelado`) — use the brand palette already defined.
- Row actions: **Ver detalle**, **Editar**, **Confirmar**, **Cancelar** — confirm/cancel are status transitions, not deletes; gate them by current status.
- "Ver detalle" opens a read-only dialog that ports `DetalleReserva.vue` — large summary, not a form. Keep it as its own component (`booking-detail-dialog.tsx`).
- "Editar" opens a form dialog, but with many more fields than `clientes`. Plan to break the form into sections inside the dialog (general / containers / temperatura) using `<div className="grid">` blocks — no need for tabs.

**Definition of done:** admins can list, filter, confirm, cancel, edit, and view details for bookings. Confirm/cancel actions show optimistic feedback via TanStack Query mutations.

**Risk:** medium. The booking shape is wider than what's in `types/domain.ts` — expect to extend the type as you wire up edit fields. Prefer growing the type to matching backend reality over guessing.

---

## Phase 4 — `/admin/itinerarios`

**Source file in legacy:** `pages/admin/itinerarios.vue`.

**Endpoints:** `GET/POST /itineraries`, `PUT /itineraries/:id/activate|deactivate`, `POST /import-excels/import-itinerary`, `GET /import-excels/template-itinerary`.

**Two non-trivial bits:**

1. **Excel import.** A "Importar desde Excel" button opens a dialog with a file input. POST the file as `multipart/form-data` to `/import-excels/import-itinerary`. Use a custom `axios` call (not `apiPost`) because the body is `FormData` and the JSON content-type must be omitted. Show progress / result toast.
2. **Template download.** A "Descargar plantilla" button calls `GET /import-excels/template-itinerary` with `responseType: 'blob'`, then triggers a browser download (`URL.createObjectURL` + invisible `<a download>` click).

For client-side parsing if needed later, the `xlsx` package is already in the sibling `portal-hermes-react` project and can be added here. Probably not needed for Phase 4 — server does the parsing.

**Definition of done:** admins can list itineraries, create them manually, activate/deactivate, import bulk via Excel, and download the template.

---

## Phase 5 — Cliente read-only views

**Pages:** `/cliente/ver-itinerario`, `/cliente/ver-reservas`.

**Endpoints:** `GET /itineraries` (with query filters), `GET /clients/:clientId/bookings`. The `clientId` comes from `useAuth().user.Client.id`.

**Sub-tasks per page (~1 hour each):**

1. `lib/api/<name>.ts` + `lib/hooks/use-<name>.ts`.
2. Page renders `DataTable` (read-only, no row actions) with the same status badges introduced in Phase 3.
3. For `ver-itinerario`: add a search/filter form above the table (origin/destination ports, week, carrier). Use `<Input>` + `<Select>` bound to query params via TanStack Query's `queryKey` so refetches happen automatically.

**Definition of done:** logged-in clients see their reservations and the published itineraries.

---

## Phase 6 — Multi-step booking wizard ⚠ biggest scope

**Page:** `/cliente/crear-solicitud-reserva`.

**Source file in legacy:** `components/FlujoReserva.vue` — 52 KB, 4 steps. This is the heaviest single component in the project.

**Recommended approach:** dedicate a separate session. Don't try to bolt it onto a Phase 1–5 PR.

**High-level structure:**

```
app/(cliente)/cliente/crear-solicitud-reserva/
├── page.tsx                          # owns wizard state + submit
├── steps/
│   ├── step-1-search-itinerary.tsx   # filters + result list
│   ├── step-2-select-itinerary.tsx   # confirm chosen itinerary
│   ├── step-3-booking-details.tsx    # the big form (commodities, containers, …)
│   └── step-4-review.tsx             # summary + submit
└── stepper.tsx                       # custom stepper UI (shadcn doesn't ship one)
```

**Form state strategy:**

- Single `useForm` at the page level with the union schema for all four steps.
- Per-step Zod schemas via `schema.pick({...})` — validate only the current step's fields on "Next".
- Persist progress in `sessionStorage` via a small `useFormPersist` hook (so a refresh mid-wizard doesn't wipe progress).

**Endpoints:** `GET /itineraries` (step 1), `GET /commodities` + `GET /type-containers` (step 3 dropdowns), `POST /bookings` (step 4 submit).

**Reuse from prior phases:**

- The `Booking` type from Phase 3 + extensions (the wizard captures more fields than the admin edit form).
- Itinerary list rendering from Phase 5's `ver-itinerario`.

**Definition of done:** a logged-in client can complete the four-step flow and create a booking that appears in `/cliente/ver-reservas` and `/admin/reservas`.

**Risk:** high. Plan for ~1 day of focused work. Open the legacy `FlujoReserva.vue` side-by-side and translate one step at a time.

---

## Phase 7 — Polish + production cutover

Only attempt after Phases 1–6 are merged.

- [ ] **Forgot-password flow.** Currently the link in `/login` is a placeholder. Wire to whatever the backend exposes (the legacy code references `/rest/user/resetPassword` with a `querystring` body — confirm with backend team).
- [ ] **Error boundary** at the app shell. Wrap `<main>` in `auth-shell.tsx` with a React error boundary that shows a friendly fallback + reset.
- [ ] **CI.** Add a GitHub Actions workflow: `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build` on PR.
- [ ] **Production env.** Decide hosting — likely PM2 + Node like the sibling `portal-hermes-react`. Copy its `ecosystem.config.js` and `Dockerfile` patterns.
- [ ] **Smoke E2E.** A single Playwright test that logs in, opens `/admin/clientes`, creates and deletes a record. Catches regressions cheaply.
- [ ] **Logo asset audit.** The legacy app has SVG icons under `assets/img/icon-*.svg`. They're now mostly unused (`lucide-react` replaces them). Keep only `logo.png` and `login-illustration.svg` in `public/`.
- [ ] **Decommission legacy.** Once all phases pass UAT, redirect the production domain to this app and archive `maritimo-front`.

---

## Cross-cutting concerns

### Backend assumptions to verify before each phase

The legacy frontend was forgiving about response shapes (`response.data || response`). The new code is stricter. Before starting a phase, confirm with a quick `curl` (or DevTools network tab) what each endpoint actually returns:

```bash
curl -H "Authorization: Bearer $TOKEN" \
  $NEXT_PUBLIC_API_BASE_URL/clients | jq .
```

If a response is wrapped in `{ data: [...] }`, mirror the `unwrap()` helper in `lib/api/clients.ts`. If unwrapping is needed in three places, lift it into `lib/api/client.ts`.

### Effort guide

Estimates assume one developer with the patterns already in their head. Adjust upward for the first one of each kind.

| Phase | Best case | Realistic |
|---|---|---|
| 1 (5 pages) | 4 h | 1 day |
| 2 | 2 h | 4 h |
| 3 | 1 day | 2 days |
| 4 | 4 h | 1 day |
| 5 | 4 h | 1 day |
| 6 | 1 day | 2–3 days |
| 7 | 2 days | 1 week |

### How to ship a phase

1. Create a feature branch off `master`: `feat/migration-phase-N-<scope>`.
2. Land the phase with a self-contained PR. Reference the matching section of this roadmap in the description.
3. Update the **Status snapshot** table at the top of this file as part of the PR.
4. Merge, then delete the corresponding stub if the phase replaced one.

### When to deviate from the template

The `clientes` template covers ~80% of the surface. You'll hit cases it doesn't (bookings detail dialog, Excel upload, the wizard). When that happens:

- Add the new pattern as a **new** primitive in `components/` — don't overload the existing one.
- Update **`AGENTS.md`** with a short note on when to use the new primitive.
- Don't update the `clientes` slice retroactively unless the new pattern strictly subsumes the old one.

---

## Open questions

These need answers before the corresponding phase can start. Put them to the backend team (or the customer) early.

- [ ] Forgot-password endpoint contract — does the backend send an email, or expose a "reset to default" action only? (Phase 7)
- [ ] Booking edit — which fields are editable post-creation, vs. immutable after `Confirmar`? (Phase 3)
- [ ] Excel import — does the backend return per-row validation errors, or only aggregate success/failure? Affects the import dialog UX. (Phase 4)
- [ ] Client booking history pagination — is `GET /clients/:id/bookings` paginated server-side? If so, switch from `useQuery` to `useInfiniteQuery`. (Phase 5)
- [ ] Wizard draft persistence — should drafts persist to the backend, or is `sessionStorage` enough? (Phase 6)
