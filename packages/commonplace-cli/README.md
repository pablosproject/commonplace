# Commonplace CLI

`commonplace-cli` runs the pipeline behind the `commonplace-youtube-recap` agent skill: it downloads a YouTube transcript, prepares it for the agent, validates the recap JSON the agent writes, and turns it into a short share link for the Commonplace web app.

The CLI does not write the recap itself. The agent reads the cleaned transcript and writes the summary, takeaway, highlights, sections and conclusion; the CLI handles acquisition, preparation, validation, encryption and sharing.

The package is published on npm and installs a `commonplace` command.

## Requirements

- Node.js 20+
- Python 3.10+ available as `python3`: `youtube-dl-exec` downloads `yt-dlp` on install, and that binary is a Python zipapp.
- `ffmpeg` on `PATH`: `fetch` uses it to convert subtitles to `.srt`.
- Network access to YouTube, and to the short-link service for `link`.

## Usage

Run every command from a per-video output directory. Recap files are read from and written to the current directory.

```bash
npx --yes commonplace-cli@latest fetch "https://www.youtube.com/watch?v=VIDEO_ID"
npx --yes commonplace-cli@latest fetch "https://www.youtube.com/watch?v=VIDEO_ID" --language it
npx --yes commonplace-cli@latest generate-json-stub
# fill in video-recap-data.json from transcript.txt
npx --yes commonplace-cli@latest validate
npx --yes commonplace-cli@latest link
npx --yes commonplace-cli@latest link --ttl 7d
npx --yes commonplace-cli@latest link --public
```

`--language` accepts a [BCP 47 language tag](https://www.rfc-editor.org/rfc/rfc5646), using an ISO 639 language code with optional script or region subtags. Examples: `it` for Italian, `en` for English, `pt-BR` for Brazilian Portuguese and `zh-Hans` for Simplified Chinese.

For local package testing, build and install a tarball from the monorepo:

```bash
npm run build -w commonplace-cli
npm pack -w commonplace-cli
npm install /path/to/commonplace-cli-VERSION.tgz
npx commonplace --help
```

## Commands

| Command                       | What it does                                                                                                                                                                                                                                                           |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fetch URL [--language CODE]` | Downloads subtitles and video info. A requested language falls back to English, then the original language; without one, the original language is preferred. Writes `transcript.txt`, `video-info.json` and the raw `transcript.<lang>.srt`.                           |
| `generate-json-stub`          | Creates a `video-recap-data.json` skeleton if missing.                                                                                                                                                                                                                 |
| `validate`                    | Checks `video-recap-data.json` against the shared Zod recap schema and that every `seconds` matches its `time`. Exits 1 on failure.                                                                                                                                    |
| `encode`                      | Validates, then prints `{ "version": "1", "payload": "...", "hash": "#v=1&d=..." }` as JSON.                                                                                                                                                                           |
| `link [--ttl DURATION]`       | Validates, encrypts the recap on this machine and uploads only the ciphertext to the short-link service. Prints `Share link:`, `Manage link (private):` and `Expires:`, saves the share link to `preview_url.txt` and opens the manage link in the browser. See below. |
| `link --public`               | Validates, then prints the long preview link, which holds the recap itself unencrypted, saves it to `preview_url.txt` and opens it. Nothing is uploaded and the link never expires.                                                                                    |
| `help`, `--help`              | Prints usage.                                                                                                                                                                                                                                                          |

## Short links

`link` keeps the decryption key in the link's fragment (`#k=…`), which browsers never send to the server. The service stores only the encrypted recap until it expires.

- `--ttl DURATION` sets the lifetime: a whole number followed by `h`, `d` or `y`, such as `1h`, `7d` or `2y`. The default is 15 days, the maximum 2 years.
- The service returns an owner secret once. The CLI adds it to the **manage link** (`#k=…&m=…`), prints it and opens it in the browser, where you can invalidate the link. Nothing is stored locally: the manage link is the only way to invalidate, so keep it private and don't lose it.
- If the service is unreachable, times out after 15 seconds, is rate limited or answers unexpectedly, `link` exits 1 and suggests `--public`. It never falls back to the long link on its own. Other rejections exit 1 with the service's message.

The format is specified in [`docs/short-link.md`](../../docs/short-link.md).

## Environment

| Variable                     | Default                             | Purpose                                              |
| ---------------------------- | ----------------------------------- | ---------------------------------------------------- |
| `RECAP_SHARE_URL`            | `https://commonplace.video`         | Short-link service and the app share links open in.  |
| `RECAP_APP_URL`              | `https://commonplace.video/preview` | Preview page `--public` links point to.              |
| `RECAP_NO_OPEN`              | unset                               | Any value prints the link without opening a browser. |
| `RECAP_COOKIES_FROM_BROWSER` | unset                               | Browser whose cookies `yt-dlp` uses, e.g. `chrome`.  |
| `DATA_JSON`                  | `video-recap-data.json`             | Recap data file.                                     |
| `LINK_OUT`                   | `preview_url.txt`                   | File `link` writes the URL to.                       |

## Development (from the monorepo root)

```bash
npm run build -w commonplace-cli   # bundle dist/cli.mjs
npm test -w commonplace-cli        # transcript cleaner, link compatibility and short-link tests
```

- `dist/cli.mjs` bundles the private `@commonplace/video-util` package for shared validation, preview-link encoding and short-link encryption; published packages such as `youtube-dl-exec` and `zod` stay runtime dependencies.
- The CLI validates with the shared Zod recap schema from `@commonplace/video-util`; the package version is the validation boundary.
- `tests/preview-link.test.ts` encodes every sample in `data/samples` and decodes it with the web app's decoder, so the CLI and the app cannot drift apart.
- `tests/short-link.test.ts` runs `link` against a mocked service and decrypts what it uploads; tests never call the live service.

The long link format is specified in [`docs/preview-link.md`](../../docs/preview-link.md).

## License

MIT
