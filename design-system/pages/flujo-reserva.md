# /cliente/crear-solicitud-reserva — overrides

**Inherits from:** ../MASTER.md
**Status:** draft (port pending — its own session per AGENTS.md)

## Why this page deviates

This is **the** customer-facing primary task — submitting a booking request. The legacy `FlujoReserva.vue` is a 1587-line, 5-step Vuetify stepper. It deviates from MASTER's "form-in-a-dialog" default because:

- The form is too long for one screen.
- Steps depend on each other (step 2 lists itineraries derived from step 1's route).
- A failed submission must not lose 5 screens of input.

This is the **only customer-facing page where multi-step UX is allowed**.

## Overrides

### Layout

- Full-page form, not a dialog. Container: `mx-auto max-w-4xl py-6`.
- Page header: title "Nueva solicitud de reserva", subtitle "Completa los pasos para enviar tu solicitud."
- Right side of the page header: a small `Guardar borrador` ghost button (when autosave is wired) showing the last-saved time ("Guardado hace 2 min").

### Stepper

Use shadcn primitives (no `v-stepper` direct equivalent) — compose with `<Tabs>` styled as a stepper, or build a small `<Stepper>` component if reused. Five steps, in this order:

1. **Ruta y fechas** — origen, destino, ETD deseado, tipo de carga.
2. **Itinerario** — table of available itineraries filtered by step 1; row select.
3. **Carga** — dimensions, weight, container type, special handling.
4. **Datos de contacto** — contact name/email/phone (prefilled from `user.Client`).
5. **Revisión** — read-only summary of all steps + "Enviar solicitud" CTA.

- Step indicator: dot + label per step; current step is `bg-primary text-primary-foreground`, completed steps are `bg-brand-success text-white` with a `Check` icon, future steps are `bg-muted text-muted-foreground`.
- Connector line between dots fills as steps complete.
- Steps are clickable **only if** they're already completed (allow back-jump, not forward-skip).
- On mobile (<768px) the labels collapse — keep numbered dots only, current step's label appears below the bar.

### Per-step behavior

- **Validation** — validate the current step on `Continuar`. Don't re-validate prior steps unless their inputs are touched.
- **Navigation buttons** — bottom of each step:
  - Left: `Atrás` (ghost, hidden on step 1).
  - Right: `Continuar` (primary). On step 5 it becomes `Enviar solicitud`.
- **Step 2 (itinerario table)** — same data-table conventions as `pages/clientes.md`; selection via radio column, not row-click (avoids accidental selection on scroll). Empty state: "No hay itinerarios disponibles para esta ruta. Cambia las fechas o contacta al equipo."
- **Step 5 (revisión)** — each section has an `Editar` link that jumps back to that step preserving all entered data. The `Enviar solicitud` button shows a `<Loader2>` and is disabled during submit.

### Persistence

- Wizard state is held in a top-level `useReducer` or `zustand` store scoped to this page. Don't lift it to a global store.
- **Autosave to backend** every 5s of idle if any field changed (debounced). Endpoint: `POST /reservas/draft` (when the backend exposes it; until then, persist to `localStorage` under `reserva-draft:{userId}`).
- On mount, if a draft exists, show a non-blocking banner above the stepper: "Tienes un borrador guardado el {date}. ¿Continuar o descartar?" — two buttons. **Don't** silently restore — the user might have moved on.
- Successful submit clears the draft and navigates to `/cliente/ver-reservas` with a success toast: "Solicitud enviada".

### Error handling

- Per-field errors: same as MASTER §4 (under the input, Spanish copy).
- Submit error: stay on step 5; show `<Alert variant="destructive">` above the summary with `errorMessage(error, "No se pudo enviar la solicitud")`. Keep the `Enviar solicitud` button enabled so the user can retry.
- If the user closes the tab mid-flow with unsaved changes, fire `beforeunload` warning.

### Accessibility

- Each step's content is its own `role="tabpanel"` with the step indicator as `role="tablist"` / `role="tab"`.
- Focus moves to the first input of the new step on `Continuar` (not the step indicator).
- The `Enviar solicitud` button announces success/failure via `aria-live="polite"` (sonner toast handles this if configured with `richColors`).

## Anti-patterns specific to this page

- A single giant form with collapsible sections. Customers will abandon it.
- Forward-skipping steps. If step 2 depends on step 1, locking step 2 behind step 1 is the point.
- Losing user input on validation failure. Step state survives until the user explicitly discards the draft or submits successfully.
- Validating all steps on every keystroke — heavy, noisy, and customers haven't even reached the later steps.

## Reference (legacy)

- Source: `../maritimo-front/components/FlujoReserva.vue` (1587 lines — port section by section)
- The legacy file uses `v-stepper` with steps 1–5; mapping above mirrors that.
- Customer's `Client.id` is read from `user.Client?.id` (see legacy lines 1148, 1223). Prefill, but don't expose it as an editable field.
