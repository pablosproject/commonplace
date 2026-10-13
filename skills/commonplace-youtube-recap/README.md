# Commonplace YouTube Recap Skill

Turn long YouTube videos into structured recaps your agent hands you as a single link to the Commonplace web app.

The recap travels inside the link, so nothing is uploaded or stored: the app decodes and renders it in the browser.

It lives in the Commonplace monorepo next to the app it feeds. It was previously the standalone `pablosproject/youtube-recap-skilll` repository, now archived.

Skill changes are tracked in [`CHANGELOG.md`](CHANGELOG.md). The private skill version and source metadata are stored in [`skill.json`](skill.json), and the skill version drives the repository plugin manifest versions.

## What it creates

Each recap includes a concise summary, the main takeaway, timestamped highlights, timestamped sections following the video's flow, and a conclusion. The web app shows it next to an embedded YouTube player, with timestamps that seek the player.

## Architecture

The skill is a thin instruction file. All executable work lives in the npm CLI package [`commonplace-cli`](../../packages/commonplace-cli/README.md), which `SKILL.md` invokes with `npx`:

```bash
npx --yes commonplace-cli@latest fetch "VIDEO_URL"
npx --yes commonplace-cli@latest generate-json-stub
npx --yes commonplace-cli@latest validate
npx --yes commonplace-cli@latest link
```

- The CLI downloads and cleans the transcript, writes a recap skeleton with the video's details, validates the recap JSON, and encodes the preview link.
- The agent reads the transcript and fills in `video-recap-data.json`, following `SKILL.md`.
- `link` opens the preview and prints the full URL in its tool result; the agent's final reply can stay short.
- The skill folder holds no scripts and needs no `npm install`.

`SKILL.md` uses `commonplace-cli@latest` so each run fetches the latest published CLI package through `npx`.

## Requirements

- An agent harness that supports Agent Skills / `SKILL.md` directories
- Node.js 20+ with `npx`
- Python 3.10+ available as `python3` (the `yt-dlp` that `youtube-dl-exec` downloads is a Python zipapp)
- `ffmpeg` on `PATH` (used to convert subtitles to `.srt`)
- The Commonplace web app reachable at the link's address (by default `https://commonplace.video`)

## Installation

### Agent Skills CLI

Install the skill with the [Agent Skills CLI](https://skills.sh/docs/cli):

```bash
npx skills add pablosproject/commonplace --skill commonplace-youtube-recap
```

The installer detects supported agents and lets you choose where to install the skill. To target Pi directly:

```bash
npx skills add pablosproject/commonplace --skill commonplace-youtube-recap --agent pi
```

### Manual installation

Clone the repository, then copy the entire `skills/commonplace-youtube-recap` folder into your agent's skills directory. The installed path must contain the folder name, for example `~/.agents/skills/commonplace-youtube-recap/SKILL.md`.

Common destinations:

| Destination                         | Skills directory           |
| ----------------------------------- | -------------------------- |
| Pi user skills                      | `~/.pi/agent/skills`       |
| Agent Skills-compatible user skills | `~/.agents/skills`         |
| Claude Code user skills             | `~/.claude/skills`         |
| Project-local skills                | `<project>/.agents/skills` |

## Usage

```text
Use the commonplace-youtube-recap skill to summarize https://www.youtube.com/watch?v=VIDEO_ID
```

Environment variables for the CLI (`RECAP_APP_URL`, `RECAP_NO_OPEN`, `RECAP_COOKIES_FROM_BROWSER`, and others) are documented in the [CLI README](../../packages/commonplace-cli/README.md#environment).

The link format is specified in [`docs/preview-link.md`](../../docs/preview-link.md).

## License

MIT
