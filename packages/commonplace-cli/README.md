# Commonplace CLI

`commonplace-cli` runs the pipeline behind the `commonplace-youtube-recap` agent skill: it downloads a YouTube transcript, prepares it for the agent, validates the recap JSON the agent writes, and encodes it into a preview link for the Commonplace web app.

The CLI does not write the recap itself. The agent reads the cleaned transcript and writes the summary, takeaway, highlights, sections and conclusion; the CLI handles acquisition, preparation, validation and encoding.

The package is not published yet. It installs a `commonplace` command.

## Requirements

- Node.js 20+
- Python 3.9+ available as `python3`: `youtube-dl-exec` downloads `yt-dlp` on install, and that binary is a Python zipapp.
- `ffmpeg` on `PATH`: `fetch` uses it to convert subtitles to `.srt`.
- Network access to YouTube.

## Usage

Run every command from a per-video output directory. Recap files are read from and written to the current directory.

```bash
npx --yes commonplace-cli@0.1.0 fetch "https://www.youtube.com/watch?v=VIDEO_ID"
npx --yes commonplace-cli@0.1.0 generate-json-stub
# write video-recap-data.json from transcript.txt and video-info.json
npx --yes commonplace-cli@0.1.0 validate
npx --yes commonplace-cli@0.1.0 link
```

Until the package is published, build a tarball from the monorepo and install it anywhere:

```bash
npm run build -w commonplace-cli
(cd packages/commonplace-cli && npm pack)
npm install /path/to/commonplace-cli-0.1.0.tgz
npx commonplace --help
```

## Commands

| Command              | What it does                                                                                                                                                                     |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fetch URL`          | Downloads English subtitles (creator-uploaded first, auto-generated as fallback) and video info. Writes `transcript.txt`, `video-info.json` and the raw `transcript.<lang>.srt`. |
| `generate-json-stub` | Creates a `video-recap-data.json` skeleton if missing.                                                                                                                           |
| `validate`           | Checks `video-recap-data.json` against the shared Zod recap schema and that every `seconds` matches its `time`. Exits 1 on failure.                                              |
| `encode`             | Validates, then prints `{ "version": "1", "payload": "...", "hash": "#v=1&d=..." }` as JSON.                                                                                     |
| `link`               | Validates, then prints the full preview URL, saves it to `preview_url.txt` and opens it in the browser.                                                                          |
| `help`, `--help`     | Prints usage.                                                                                                                                                                    |

## Environment

| Variable                     | Default                         | Purpose                                              |
| ---------------------------- | ------------------------------- | ---------------------------------------------------- |
| `RECAP_APP_URL`              | `http://localhost:5173/preview` | Preview page the link points to.                     |
| `RECAP_NO_OPEN`              | unset                           | Any value prints the link without opening a browser. |
| `RECAP_COOKIES_FROM_BROWSER` | unset                           | Browser whose cookies `yt-dlp` uses, e.g. `chrome`.  |
| `DATA_JSON`                  | `video-recap-data.json`         | Recap data file.                                     |
| `LINK_OUT`                   | `preview_url.txt`               | File `link` writes the URL to.                       |

## Development (from the monorepo root)

```bash
npm run build -w commonplace-cli   # bundle dist/cli.mjs
npm test -w commonplace-cli        # transcript cleaner and link compatibility tests
```

- `dist/cli.mjs` bundles the private `@commonplace/video-util` package for shared validation and preview-link encoding; published packages such as `youtube-dl-exec` and `zod` stay runtime dependencies.
- The CLI validates with the shared Zod recap schema from `@commonplace/video-util`; the package version is the validation boundary.
- `tests/preview-link.test.ts` encodes every sample in `data/samples` and decodes it with the web app's decoder, so the CLI and the app cannot drift apart.

The link format is specified in [`docs/preview-link.md`](../../docs/preview-link.md).

## License

MIT
