# YouTube Recap Skill

Turn long YouTube videos into structured recaps your agent hands you as a single link to the video recap web app.

The recap travels inside the link, so nothing is uploaded or stored: the app decodes and renders it in the browser.

It lives in the `video-project` monorepo next to the app it feeds. It was previously the standalone `pablosproject/youtube-recap-skilll` repository, now archived.

## What it creates

Each recap includes a concise summary, the main takeaway, timestamped highlights, timestamped sections following the video's flow, and a conclusion. The web app shows it next to an embedded YouTube player, with timestamps that seek the player.

## Architecture

The skill is a thin instruction file. All executable work lives in the npm CLI package [`@video-recap/youtube-recap-cli`](../../packages/youtube-recap-cli/README.md), which `SKILL.md` invokes with `npx`:

```bash
npx --yes @video-recap/youtube-recap-cli@<version> fetch "VIDEO_URL"
npx --yes @video-recap/youtube-recap-cli@<version> validate
npx --yes @video-recap/youtube-recap-cli@<version> link
```

- The CLI downloads and cleans the transcript, validates the recap JSON, and encodes the preview link.
- The agent reads the transcript and writes `video-recap-data.json`, following `SKILL.md`.
- The skill folder holds no scripts and needs no `npm install`.

`SKILL.md` is a template. The installer renders its placeholders:

| Placeholder           | Rendered as                                                               |
| --------------------- | ------------------------------------------------------------------------- |
| `{{PACKAGE_NAME}}`    | CLI package name                                                          |
| `{{PACKAGE_VERSION}}` | CLI package version                                                       |
| `{{PACKAGE_SPEC}}`    | `name@version` (pinned by default), the spec every command uses via `npx` |

The `<!-- managed-by: ... -->` marker records which package version installed the skill.

## Requirements

- An agent harness that supports Agent Skills / `SKILL.md` directories
- Node.js 20+ with `npx`
- Python 3.9+ available as `python3` (the `yt-dlp` that `youtube-dl-exec` downloads is a Python zipapp)
- `ffmpeg` on `PATH` (used to convert subtitles to `.srt`)
- The recap web app reachable at the link's address (by default `http://localhost:5173`)

## Installation

The CLI will install the rendered skill with:

```bash
npx --yes @video-recap/youtube-recap-cli@<version> install --agent pi
```

The `install` command is not implemented yet, and the package is not published yet.

### Known install destinations

| Destination                         | Path                 |
| ----------------------------------- | -------------------- |
| Pi user skills                      | `~/.pi/agent/skills` |
| Agent Skills-compatible user skills | `~/.agents/skills`   |
| Claude Code user skills             | `~/.claude/skills`   |
| Project-local skills                | `.agents/skills`     |
| Custom destination                  | `--dest <path>`      |

### Other harnesses

To be written.

## Usage

```text
Use the youtube-recap skill to summarize https://www.youtube.com/watch?v=VIDEO_ID
```

Environment variables for the CLI (`RECAP_APP_URL`, `RECAP_NO_OPEN`, `RECAP_COOKIES_FROM_BROWSER`, and others) are documented in the [CLI README](../../packages/youtube-recap-cli/README.md#environment).

The link format is specified in [`docs/preview-link.md`](../../docs/preview-link.md).

## License

MIT
