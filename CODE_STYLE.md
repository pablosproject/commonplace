# Code Architecture

Keep the project boring. Add folders, stores, services, and dependencies only
when the code asks for them.

Shared rules:

- Use TypeScript everywhere.
- Prefer named exports. No default exports.
- Infer types from Drizzle, Zod, Hono, and React code instead of duplicating
  them by hand.
- Keep modules deep: small interface, useful behavior inside.
- Create folders when the first real file needs them, not upfront.
- Do not add comments that explain obvious code. Make the code clearer instead.

## Backend

`apps/api` is a Hono + Drizzle API. Routes stay thin and typed; business work
lives in plain functions.

```txt
apps/api/src/
  app.ts          Hono app wiring, exports AppType
  server.ts       process entry point
  routes/         HTTP in, HTTP out
  schemas/        Zod validation and response shapes
  services/       multi-step use cases
  queries/        Drizzle reads and writes
  clients/        external systems
  middleware/     per-request concerns
  lib/            pure helpers, no I/O
  db/             schema, client, seed
```

Backend rules:

- No controller layer. Hono handlers stay inline with routes so type inference
  works.
- A route validates input, calls one function below it, shapes the response, and
  maps failures to status codes.
- Routes receive dependencies as arguments. Do not import the real database
  directly inside route files.
- Queries are plain Drizzle functions. Every query takes `db` as its first
  parameter so callers can pass either the database or a transaction.
- Add a service only when a route would otherwise coordinate multiple ordered
  steps. A route calling one query does not need a service.
- Put external integrations in `clients/`.
- Put pure helpers in `lib/`, not `utils/`.
- Slow or retryable work should leave the request path and move to a worker or
  queue when needed.
- ESM imports use `.js` extensions for relative files.

Testing:

- Use Vitest.
- Test routes through `app.request()`.
- Use PGlite for integration tests against real Postgres behavior.
- Prefer one test database per test file and truncate between tests.
- Keep factories in `test/factories.ts` so tests only specify the fields they
  care about.

## Frontend

`apps/web` is a React + Vite + TypeScript app. Think in pages first. Extract
shared code only after there is real reuse.

Start small:

```txt
apps/web/src/
  main.tsx
  App.tsx
  App.css
```

Grow toward this only when needed:

```txt
apps/web/src/
  app/              app shell, providers, router setup
  pages/            page screens and their private pieces
  shared/
    api/            typed API client and query helpers
    recap/          recap UI used by multiple pages
    ui/             reusable UI used by multiple pages
    lib/            pure helpers
  styles/           global reset, tokens, base styles
```

Frontend rules:

- Pages own screen workflows.
- A page may keep private `api.ts`, `hooks.ts`, `store.ts`, `types.ts`, and
  `*.styles.ts` files next to it.
- Do not introduce `features/` by default.
- Move code to `shared/` only after at least two pages need it.
- Consume the API through the Hono RPC client typed from `AppType`. Do not
  duplicate response types in the frontend.
- Add React Router when there is more than one real screen.
- Add TanStack Query when server state needs caching, invalidation, retries,
  polling, optimistic updates, or shared loading state.

State rules:

- Prefer URL state for filters, search terms, tabs, pagination, and anything
  worth linking to.
- Prefer server state for API-owned data.
- Prefer local component state for form drafts, toggles, open panels, and
  selection that does not need to survive navigation.
- Use custom hooks for reusable stateful behavior.
- Use Zustand only for shared client state that is not URL, server, or form
  state.
- Keep Zustand stores small and concern-specific. No root `appStore`.
- Do not mirror server data in Zustand. Store ids, preferences, or UI choices
  instead.

CSS rules:

- Use Linaria for component and page styles. Colocate styles in
  `Component.styles.ts` or page-level `*.styles.ts` files.
- Use Linaria's `styled` interface for semantic elements and reusable UI.
- Do not use Tailwind.
- Use global CSS only for reset, base typography, tokens, app shell primitives,
  and unavoidable third-party overrides.
- Prefer CSS custom properties for values supplied at runtime and `data-*`
  attributes for visual states.

Testing:

- Test pages through user-visible behavior.
- Test pure helpers directly.
- Test Zustand stores through exported selectors and actions.
- Avoid snapshot tests for ordinary markup.

## Skills

`skills/<name>/` holds agent skills, one folder per skill, named after the
skill's `name`. A skill is a thin `SKILL.md` template plus docs; it holds no
code and is not an npm workspace.

```txt
skills/commonplace-youtube-recap/
  SKILL.md        instructions the agent follows, rendered by the installer
  README.md
  LICENSE
```

The code a skill runs lives in a CLI package under `packages/`:

```txt
packages/commonplace-cli/
  src/cli.ts      command entry point, bundled to dist/cli.mjs by tsup
  src/recap.ts    recap validation and encoding
  src/lib/        pure helpers
  tests/          focused vitest suites, run by the root `npm test`
```

Skill rules:

- `SKILL.md` runs its CLI through `npx --yes <package>@<version>`; the skill
  folder needs no `npm install`.
- The CLI must work outside the repo: bundle local packages such as
  `@commonplace/video-util` into `dist/`, and keep only published packages as
  runtime `dependencies`. Resolve shipped assets relative to `import.meta.url`.
- Repository-only packages use the `@commonplace/` scope and set
  `private: true`. That scope belongs to someone else on npm, so they must never
  be published. Publishable CLI packages use an unscoped name, such as
  `commonplace-cli`, and omit `private: true`.
- Shared contracts live in local packages. The CLI imports and bundles those
  packages, such as `@commonplace/video-util`; never import application source
  from a skill or its CLI.
