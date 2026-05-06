# /login — overrides

**Inherits from:** ../MASTER.md
**Status:** active

## Why this page deviates

Login is the **only branded marketing-style surface** in the app. It uses a gradient, an illustration panel, and the full logo. Everywhere else inside the authenticated shell stays operations-dense per MASTER §3.

## Overrides

- **Surface treatment** — full-bleed gradient (`from-secondary via-[#1e1382] to-primary`) is allowed here only. Don't reuse it on dashboards.
- **Card width** — `max-w-4xl` two-column layout (illustration + form) instead of the usual content container.
- **Illustration** — `public/login-illustration.svg` on `bg-brand-celeste` panel; hidden below `md`.
- **Logo prominence** — full logo (180×70) displayed; everywhere else inside the app uses the smaller header version.
- **CTA copy** — "Ingresar" (not "Login" or "Sign in"). Loading state shows "Ingresando…".
- **Error copy** — generic "Usuario y contraseña son inválidos, favor verificar." for 401s; preserves backend message for everything else (matches legacy contract).
- **Mobile fallback** — illustration panel collapses; form takes the full card. Verified at 375px.

## Reference (legacy)

- Source: `../maritimo-front/pages/login.vue` (Vuetify implementation)
- Auth contract: `../maritimo-front/nuxt.config.js` (`@nuxtjs/auth-next` strategy)
