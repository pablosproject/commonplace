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

### 3. First database model

Use original recap JSON as source of truth, plus extracted columns for browse/search.

- [ ] `videos` table:
  - [ ] YouTube video id.
  - [ ] URL.
  - [ ] title.
  - [ ] channel.
  - [ ] duration seconds/formatted.
  - [ ] abstract.
  - [ ] main takeaway.
  - [ ] created/submitted timestamp.
- [ ] `video_recaps` table:
  - [ ] video reference.
  - [ ] schema version.
  - [ ] full recap JSONB payload.
- [ ] Defer `users` and `upvotes` until after browse/detail works.

### 4. API for seeded browsing

- [ ] `GET /api/videos` returns indexed video cards.
- [ ] `GET /api/videos/:id` returns full recap data.
- [ ] `GET /api/search?q=...` or query param on `/api/videos` for simple search.
- [ ] Add health check endpoint.

### 5. Consumption UI thin slice

- [ ] Homepage/browse page with seeded videos.
- [ ] Search box over title, abstract, and maybe main takeaway.
- [ ] Video card with title, channel, duration, abstract, and placeholder upvote count.
- [ ] Video recap detail page.
- [ ] Embedded YouTube player.
- [ ] Highlights list.
- [ ] Sections/timepoints list.
- [ ] Clicking a timestamp jumps the player to that second.
- [ ] Use `reference-render.html` as inspiration, not as code to preserve exactly.

### 6. Ingestion after the UI proves useful

- [ ] Decide validation library: Ajv matches existing JSON Schema; Zod may be nicer for app types.
- [ ] Add endpoint to submit recap JSON.
- [ ] Validate against `data/video-recap.schema.json` or equivalent runtime schema.
- [ ] Extract indexed fields into `videos`.
- [ ] Store full original payload in `video_recaps.recap_json`.
- [ ] Return friendly validation errors.
- [ ] Initially allow local/manual submission; require login later.

### 7. Auth after ingestion shape is clear

- [ ] Pick MVP auth approach.
- [ ] Add registration/login.
- [ ] Restrict submitting videos to registered users.
- [ ] Record submitter on videos.

### 8. Upvotes after auth

- [ ] Add `upvotes` table.
- [ ] Add upvote/un-upvote endpoint.
- [ ] Prevent duplicate upvotes by same user.
- [ ] Show upvote count on cards and detail page.
- [ ] Add popular sort.

### 9. Companion recap skill/tool later

- [ ] Define how users generate recap JSON from a YouTube video.
- [ ] Ensure generated JSON matches ingestion schema.
- [ ] Decide sharing flow: copy/paste JSON, API token, or direct upload.

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
