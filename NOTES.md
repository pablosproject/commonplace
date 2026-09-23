# Notes

## MVP usefulness test

A first version is probably useful enough if a user can:

1. Find a video recap by browsing or searching.
2. Understand what the video is about without watching the whole thing.
3. See the important moments.
4. Click a moment and start watching from there.
5. Submit another recap if they have one.

## Early risk

The biggest early risk is trying to build recap generation, ingestion, search, auth, ranking, and a polished player all at once.

Separate the problem:

- First prove the consumption interface using seeded/sample data.
- Then accept submitted recap JSON.
- Then add registered-user actions.
- Then improve generation/sharing workflow.

## Data inspected

Initial sample copied from:

`/Users/paolo/Downloads/youtube-recaps/wc8FBhQtdsA`

Repo copies:

- `data/video-recap.schema.json`
- `data/samples/wc8FBhQtdsA/video-recap-data.json`
- `data/samples/wc8FBhQtdsA/reference-render.html`

Observed recap schema:

- `schemaVersion`: currently `1.0`.
- `video`: `id`, `url`, `title`, optional `channel`, optional `duration`.
- `abstract`: short summary.
- `mainTakeaway`: strongest idea.
- `highlights`: flat list of timestamped points.
- `sections`: grouped lists of timestamped points.
- `conclusion`: closing summary.
- `footerText`: optional render text.
- `generation`: optional metadata.

Timestamped points include:

- `time`: `HH:MM:SS` string.
- `seconds`: integer offset.
- `title`.
- `description`.
- optional `emphasis` strings.

Product implication:

- The first app model can store the original JSON as the source of truth, plus extracted/indexed columns for browse/search/sort.
- Highlights and section points are both recap timepoints, but highlights are a curated subset for quick scanning.
- The existing `reference-render.html` is a useful visual reference for the first recap page.
