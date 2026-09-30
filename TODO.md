# TODO

## Approved stack

- React + Vite + TypeScript frontend.
- Hono + TypeScript API.
- Docker Postgres for local development.
- Drizzle ORM for DB access and migrations.
- Ajv or Zod for validating recap JSON uploads.
- No issue tracker yet: keep this file as the working backlog.

## Current source data

- Schema: `data/video-recap.schema.json`
- Sample recap: `data/samples/wc8FBhQtdsA/video-recap-data.json`
- Visual reference: `data/samples/wc8FBhQtdsA/reference-render.html`

## Build order

### 1. Scaffold the runnable app

- [x] Initialize package/workspace structure.
- [x] Add Vite React TypeScript frontend.
- [x] Add Hono TypeScript API server.
- [x] Defer shared TypeScript types package/folder until useful.
- [x] Add basic dev scripts for frontend, API, and full dev mode.
- [x] Add minimal formatting/linting only if it does not slow MVP down.

### 2. Add Postgres + Drizzle

- [x] Add `docker-compose.yml` with local Postgres.
- [x] Add env config for API database connection.
- [x] Install and configure Drizzle.
- [x] Add initial Drizzle schema.
- [x] Add migration generation/run scripts.
- [x] Add seed script using `data/samples/wc8FBhQtdsA/video-recap-data.json`.

### 3. API for seeded browsing

Architecture and testing conventions live in `CODE_STYLE.md`.

- [x] `GET /api/videos` returns indexed video cards.
- [x] `GET /api/videos/:youtubeVideoId` returns full recap data.
- [x] `GET /api/search?q=...` for simple search.
- [x] Add health check endpoint.
- [x] Add route integration tests on PGlite.

### 4. Consumption UI thin slice

- [x] Homepage/browse page with seeded videos.
- [x] Search box over title, abstract, and maybe main takeaway.
- [x] Video card with title, channel, duration, abstract, and placeholder upvote count.
- [x] Video recap detail page.
- [x] Embedded YouTube player.
- [x] Highlights list.
- [x] Sections/timepoints list.
- [x] Clicking a timestamp jumps the player to that second.
- [x] Use `reference-render.html` as inspiration, not as code to preserve exactly.

### 5. Ingestion after the UI proves useful

- [x] Decide validation library: Zod, already used for route validation.
- [x] Add endpoint to submit recap JSON.
- [x] Validate against `data/video-recap.schema.json` or equivalent runtime schema.
- [x] Extract indexed fields into `videos`.
- [x] Store full original payload in `video_recaps.recap_json`.
- [x] Return friendly validation errors.
- [x] Initially allow local/manual submission; require login later.

### 6. Auth after ingestion shape is clear

- [ ] Pick MVP auth approach.
- [ ] Add registration/login.
- [ ] Restrict submitting videos to registered users.
- [ ] Record submitter on videos.

### 7. Upvotes after auth

- [ ] Add `upvotes` table.
- [ ] Add upvote/un-upvote endpoint.
- [ ] Prevent duplicate upvotes by same user.
- [ ] Show upvote count on cards and detail page.
- [ ] Add popular sort.

### 8. Companion recap skill/tool later

- [ ] Define how users generate recap JSON from a YouTube video.
- [ ] Ensure generated JSON matches ingestion schema.
- [ ] Decide sharing flow: copy/paste JSON, API token, or direct upload.

### 9. Proper database design

The current schema (`apps/api/src/db/schema.ts`) is temporary: `videos` with extracted browse fields plus `video_recaps` holding the full recap JSONB. Build on it for now; design it properly once the app shape is clear.

- [ ] Review `data/video-recap.schema.json` and decide which entities deserve their own tables (sections, highlights, timepoints) vs. staying in JSONB.
- [ ] Decide the source of truth: original recap JSON, normalized tables, or both.
- [ ] Design search support (Postgres full-text search, indexes).
- [ ] Design recap versioning (multiple recaps per video, schema version upgrades).
- [ ] Design `users`, `upvotes`, and submitter relations properly.
- [ ] Write the new schema and migrate away from the temporary one.

## Possible improvements

Not blocking anything; pick up when the pain is felt.

- [ ] Speed up test-database startup. Booting PGlite dominates test time (3 boots measured at 5-8s, 14 boots at 14-17s) while queries take 1-50ms. Options, cheapest first:
  - [ ] Reuse the compiled WASM module across instances via PGlite's `pgliteWasmModule` option, compiling `pglite.wasm` once per worker.
  - [ ] Memoize one instance per worker process and run test files in a single process, so the suite boots once instead of once per file.
  - [ ] Prepare one instance and `clone()` it per test file.
  - [ ] Benchmark before adopting: the win was never measured, only the API confirmed to exist.

## First milestone

The first useful milestone is complete when:

- [ ] The app runs locally with one command or a small documented sequence.
- [ ] Postgres runs in Docker.
- [ ] The provided sample recap is seeded into the DB.
- [ ] A user can browse videos.
- [ ] A user can search videos.
- [ ] A user can open the sample recap page.
- [ ] A user can click timepoints to jump the embedded YouTube player.

## Not yet

- [ ] Automatic YouTube summarization inside the app.
- [ ] Semantic search.
- [ ] Recommendations.
- [ ] Comments.
- [ ] Playlists.
- [ ] Complex moderation.
- [ ] Complex issue tracking.
