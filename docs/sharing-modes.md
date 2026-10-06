# Sharing modes: decisions

Status: decided 2026-10-01. Anonymous mode is built: the `youtube-recap` skill produces preview links and `apps/web` renders them at `/preview`. The link format itself is specified in [`preview-link.md`](preview-link.md).

## Goal

People generate recaps locally with the `youtube-recap` agent skill (`skills/youtube-recap/`): it downloads a YouTube transcript, writes the recap as JSON validated against the recap schema, and hands it to the web app for viewing. The web app does the rendering.

## Modes

| Mode                 | Stored on server? | Result for the user                                                  | Status    |
| -------------------- | ----------------- | -------------------------------------------------------------------- | --------- |
| Anonymous, read-only | No                | A link that renders the recap. The server never receives the data.   | **Built** |
| Logged in            | Yes               | A permanent recap tied to your account. Authentication is undecided. | Later     |

Dropped: an "anonymous but stored" mode, where recaps would be saved publicly and grouped by a UUID generated on the user's machine. A UUID identifies but does not authenticate, and anonymous public writes need abuse controls the project does not want yet.

Logged-in mode needs `POST /api/videos` to change first: today it has no authentication and replaces the existing recap of the same video.

## Decisions and why

- **The recap travels in the URL fragment** (`/preview#v=1&d=...`). Browsers never send the fragment to the server, so nothing is uploaded, logged, or stored, and server URL-length limits do not apply. Content is compressed, not encrypted.
- **deflate-raw + base64url.** 3–6 KB per real recap, and native in both Node (`zlib`) and browsers (`DecompressionStream`). Brotli is ~20% smaller but needs a library in the web bundle. Measurements are in `preview-link.md`.
- **`v=1` versions the encoding; `schemaVersion` versions the recap shape.** They change independently.
- **The skill embeds the app URL** (`http://localhost:5173/preview` until the app is deployed). `RECAP_APP_URL` overrides it.
- **The Zod schema in `packages/video-util/src/codec.ts` is the single source of truth.** The skill's JSON schema is generated from it (`npm run schema:generate`), and `npm test` fails if the generated file is stale.
- **The skill is self-contained at runtime.** It needs only Node built-ins and `ajv`, and keeps its own small encoder and generated schema, so it still works when its folder is copied out of the repo. The monorepo's tests keep it honest: they round-trip every sample recap through the skill's encoder and the web app's real decoder. A shared package for the encoder and decoder may come later (see `TODO.md`).
- **Chat-app truncation of long links is deferred.**

## Findings from Plannotator

Source: `github.com/backnotprop/plannotator`, read 2026-10-01 and 2026-10-05.

- **Encoding** (`packages/core/compress.ts`): the same scheme as ours, deflate-raw + base64url in the fragment, one implementation shared by server and UI. Build the binary string with a loop, not `String.fromCharCode(...arr)`, which throws `RangeError` on large arrays.
- **Truncation:** messaging apps may cut URLs above about 2 KB. Their answer is an opt-in short link: the browser encrypts the payload with AES-256-GCM, uploads only ciphertext to a paste service, and keeps the key in the fragment (`/p/<id>#key=...`).
- **Hosted uploads** (`adr/implementation/guide-share-hosting.md`), useful when stored recaps arrive: unguessable random ids, a delete token returned once and stored only as a hash, a size cap (`413`), creation-only rate limiting (`429` + `Retry-After`) that fails open in local development, and generic `500` errors with details logged server-side.
- **Installing and updating:**
  - Claude Code: the repository is a plugin marketplace (`.claude-plugin/marketplace.json` at the root, pointing to a plugin folder with `.claude-plugin/plugin.json`). Users run `/plugin marketplace add backnotprop/plannotator`, then `/plugin install plannotator@plannotator`; `/plugin marketplace update` brings new versions.
  - Other agents: an `install.sh` (`curl -fsSL https://plannotator.ai/install.sh | bash`) installs a binary and the skills (via `npx skills add`); re-running it updates. The binary has an opt-in daily auto-update.
  - Open questions for us: the marketplace approach needs the user's git to reach this private repository, and the skill's `ajv` dependency has to be installed after the plugin is copied.
