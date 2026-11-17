# How Commonplace works

Commonplace separates recap generation from viewing. An agent generates a recap in a local workspace; the web app renders it from a short link, whose encrypted recap a Cloudflare Worker stores, or from a self-contained preview link. Local generation does not imply offline processing: see [sharing and privacy](sharing.md).

## Responsibilities

| Component                                                     | Responsibility                                                                                                                                                                              |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Skill](../plugin/skills/commonplace-youtube-recap/README.md) | Instructs the agent how to produce a useful recap.                                                                                                                                          |
| [CLI](../packages/commonplace-cli/README.md)                  | Downloads and cleans subtitles, prepares a recap skeleton, validates the completed recap, encrypts it and creates a short link, or generates a preview link. It does not write the summary. |
| Agent                                                         | Reads the transcript and writes the summary, takeaway, highlights, sections, and conclusion.                                                                                                |
| Shared utilities (`packages/video-util`)                      | Define recap validity, preview-link encoding and decoding, short-link encryption and the short-link API bodies.                                                                             |
| Worker (`apps/worker`)                                        | Serves the web app and the short-link API: stores encrypted recaps in Workers KV until they expire, and deletes them on invalidation. It cannot read them.                                  |
| Web app (`apps/web`)                                          | Opens and validates shared recaps, renders a seekable YouTube player, and owns the explicit browser-local library and its source-specific management credentials.                           |

## Data flow

1. The skill invokes the CLI to fetch video metadata and subtitles into a per-video output directory.
2. The agent reads the cleaned transcript and fills in the recap JSON.
3. The CLI validates the recap, encrypts it with a new key and posts only the encrypted recap to the Worker, which stores it with an expiry. The CLI prints the share link (`/r/<id>#k=<key>`) and the private manage link, and opens the manage link in the author's browser.
4. The recipient opens the share link. The web app fetches the encrypted recap by id, decrypts it with the key from the fragment, validates and renders it; timestamps seek the player.

With `link --public`, step 3 encodes the recap into a preview link instead and nothing is uploaded; in step 4 the web app decodes the recap from the link itself.

## Why a thin skill

Executable behavior belongs in the CLI so it can be tested, versioned, and used independently. The installed skill needs no scripts or dependency installation of its own. The skill guides the semantic work; the CLI handles repeatable processing.

The skill and CLI are versioned separately. The skill currently invokes `commonplace-cli@latest`, rather than pinning a particular CLI release.

## Shared contracts and compatibility

The CLI bundles `@commonplace/video-util` so it works outside the monorepo. The web app imports the same package for decoding and full recap validation. Recap validity has one implementation rather than separate CLI and web rules.

The CLI's [preview-link tests](../packages/commonplace-cli/tests/preview-link.test.ts) round-trip sample recaps through the shared encoder, decoder, and validator used by the web app, and check link generation. Its [short-link tests](../packages/commonplace-cli/tests/short-link.test.ts) run `link` against a mocked service and decrypt what it uploads. These are contract tests, not browser rendering tests.

The [preview-link specification](preview-link.md) defines the long link's wire format and its two independent versions: encoding version and recap schema version. The [short-link specification](short-link.md) defines the encryption, the stored record and the Worker API. Changes must account for links already shared.

## Browser library

The web app can explicitly save a complete recap and optional management credentials in `localStorage`, with one entry per YouTube video. The homepage preserves the product introduction and shows a small saved-recap return strip when the library is nonempty. `/saved` shows saved recaps alphabetically as a list (thumbnail, title, main takeaway, channel and length) or a grid (thumbnail, title, channel and length), with the view kept in the URL as `?view=grid` and playback progress shown under each thumbnail; `/saved/:videoId` opens the local content without fetching a link. The local URL is not a share link.

`apps/web/src/shared/library` owns versioned storage validation, save/replace/remove operations, cross-tab updates and library controls. Pages own navigation and loading workflows. `shared/sharing` owns the shared short-link API client and management UI used by both original-link and local-copy pages. `RecapActions` supplies the header's minimal save/check menu and reuses the original management menu for both manage-link and local-copy pages. It does not add panels to the recap notes. Each saved recap keeps at most one set of administrator credentials. `RecapView` remains a renderer with a slot for page-owned header controls; it does not persist recaps.

No library data is uploaded. Each saved entry holds a recap and optional management credentials, without recording the original reader or preview link. A retained administrator link can refer to an older recap and is not offered for sharing as the current content. Only recaps with management access can be shared from the app. The library does not track link invalidation; the shared management menu calls the Worker without changing saved copies. Local saving changes neither Worker retention nor the existing wire formats.

See [coding conventions](../CODE_STYLE.md) for implementation rules and [sharing decisions](sharing.md) for the current product boundary.
