# YouTube Recap Skill

Turn long YouTube videos into structured recaps your agent hands you as a single link to the video recap web app.

This Agent Skill downloads a transcript with `yt-dlp`, captures the recap as JSON validated against the recap schema, and encodes it into a `/preview` link. The recap travels inside the link, so nothing is uploaded or stored: the app decodes and renders it in the browser.

It lives in the `video-project` monorepo next to the app it feeds. It was previously the standalone `pablosproject/youtube-recap-skilll` repository, now archived.

## What it creates

Each recap includes a concise summary, the main takeaway, timestamped highlights, timestamped sections following the video's flow, and a conclusion. The web app shows it next to an embedded YouTube player, with timestamps that seek the player.

## Requirements

- An agent harness that supports Agent Skills / `SKILL.md` directories
- [`yt-dlp`](https://github.com/yt-dlp/yt-dlp) on `PATH` (`brew install yt-dlp` or `pipx install yt-dlp`)
- Node.js 18+ and npm
- The recap web app reachable at the link's address (by default `http://localhost:5173`)

## Installation

How the skill is installed and kept up to date is still open (see `TODO.md`). Until then, copy this folder into your harness's skills directory and install its dependencies there:

```bash
cp -R skills/youtube-recap ~/.claude/skills/youtube-recap
(cd ~/.claude/skills/youtube-recap && npm install --omit=dev)
```

Other harnesses use their own skills directory (for example `~/.pi/agent/skills/` or `~/.codex/skills/`). Re-copy after updating the repository.

## Usage

```text
Use the youtube-recap skill to summarize https://www.youtube.com/watch?v=VIDEO_ID
```

The underlying pipeline runs from a per-video output directory:

```bash
/path/to/youtube-recap/scripts/recap-pipeline.sh fetch "https://www.youtube.com/watch?v=VIDEO_ID"
# the agent writes video-recap-data.json from transcript.txt and video-info.json
/path/to/youtube-recap/scripts/recap-pipeline.sh validate
/path/to/youtube-recap/scripts/recap-pipeline.sh link
```

- `fetch` prefers the creator's uploaded subtitles over auto-generated captions and writes `transcript.txt` (one `[HH:MM:SS] text` line per caption, without the repetition of rolling auto-captions) and `video-info.json` (id, title, channel, duration, URL).
- `link` validates the recap, prints the preview link, saves it to `preview_url.txt` and opens it. `RECAP_APP_URL` changes the target page; `RECAP_NO_OPEN=1` skips opening the browser.

## Development (from the monorepo root)

```bash
npm install                      # installs every workspace, including this one
npm test                         # schema check, API tests, this skill's tests
npm run schema:generate          # regenerate schemas/video-recap.schema.json from the Zod schema
npm run preview:link -- <sample-id|recap.json> [app-url] [--no-open]
```

- `schemas/video-recap.schema.json` is **generated** from `apps/api/src/schemas/recaps.ts`. Do not edit it by hand; `npm test` fails when it is stale.
- `tests/preview-link.test.ts` round-trips every recap in `data/samples/` through this skill's encoder and the web app's decoder (`apps/web/src/pages/preview/previewLink.ts`), and checks the cases the app must reject.
- `tests/transcript.test.ts` covers the transcript cleaner.
- `evals/evals.json` holds the prompts used to evaluate the skill with the skill-creator workflow.

The link format is specified in [`docs/preview-link.md`](../../docs/preview-link.md); the decisions behind it are in [`docs/sharing-modes.md`](../../docs/sharing-modes.md).

## Files

```text
SKILL.md                         instructions the agent follows
scripts/recap-pipeline.sh        fetch, generate-json-stub, validate, link
scripts/recap-link.mjs           link encoder
scripts/clean-transcript.mjs     .srt to transcript.txt
schemas/video-recap.schema.json  generated recap schema
tests/                           vitest suites
evals/evals.json                 evaluation prompts
```

## License

MIT
