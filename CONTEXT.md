# Video Project Context

## One-line idea

Help people consume YouTube videos faster by turning indexed videos into a summary, key timepoints, and a sleek interface for jumping directly to the parts they care about.

## Current phase

Early MVP discovery. Keep the process lightweight: notes + TODOs, no issue tracker yet.

## Users

- Anonymous / browsing users:
  - Browse indexed videos.
  - Search for videos.
  - View video recap pages.
- Registered users:
  - Submit videos/data for ingestion.
  - Upvote videos.

## Initial MVP

The first MVP should prove that people can:

1. Submit already-generated video recap data.
2. Browse submitted videos.
3. Search submitted videos.
4. Open a useful video recap page.
5. Upvote videos when logged in.

The system does **not** need to generate summaries automatically in the first web MVP if recap data is already provided externally.

## Product shape

A web application with:

- React frontend.
- Node/TypeScript server.
- Lightweight API framework with good middleware support, likely Hono or Fastify rather than Express.
- Dockerized Postgres, close to expected production shape.
- Authentication for submit/upvote actions.
- Public browsing/search.

A later companion skill/tool should help a user generate recap data for themselves and eventually share it into the app.

## Data

Input will be provided externally and indexed in the system.

Known shape:

- JSON schema exists or will be provided.
- Some sample data exists or will be provided.
- Data represents YouTube videos plus recap information.

Expected concepts:

- Video metadata: title, channel, URL/video ID, thumbnail, duration.
- Summary.
- Key timepoints / chapters / highlights.
- Searchable text.
- Submitter.
- Upvotes.

## Suggested stack

Keep boring and familiar:

- TypeScript.
- Node.js.
- React.
- Minimal full-stack framework or simple API + Vite frontend.
- Hono or Fastify for the API layer.
- Docker Postgres for local development.
- Drizzle ORM for database access.

Default bias for speed: start with a single repo and production-like local infrastructure without overbuilding.

## Glossary

- **Video**: a YouTube video indexed by the app.
- **Recap**: the generated/ingested summary and key timepoints for a video.
- **Timepoint**: a timestamped item that lets the user jump to a specific interesting part of the video.
- **Ingestion**: receiving structured recap data from a user or external tool and storing it.
- **Registered user activity**: submitting videos and upvoting.

## Product principles

- Move fast with a small MVP.
- Prefer simple files and notes over issue tracking until the project demands more structure.
- Treat recap generation as separate from recap browsing at first.
- Make the first version useful even if ingestion is manual or JSON-based.

## Open questions

1. What exact JSON schema should the app accept? User already has schema/data; inspect before designing app model.
2. Is authentication email/password, OAuth, magic link, or something simpler for MVP?
3. Should users submit raw YouTube URLs, full recap JSON, or both?
4. Should submitted videos be public immediately or require moderation?
5. What does search need for MVP: title-only, full-text across summaries/timepoints, or semantic search?
6. What makes a recap page feel “sleek” enough for the first version?
7. Where will this be deployed?
8. Should the API use Hono or Fastify? Current lean: Hono.
