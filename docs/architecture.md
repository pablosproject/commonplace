# How Commonplace works

Commonplace separates recap generation from viewing. An agent generates a recap in a local workspace; the web app renders it from a self-contained preview link. Local generation does not imply offline processing: see [sharing and privacy](sharing.md).

## Responsibilities

| Component                                              | Responsibility                                                                                                                                         |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [Skill](../skills/commonplace-youtube-recap/README.md) | Instructs the agent how to produce a useful recap.                                                                                                     |
| [CLI](../packages/commonplace-cli/README.md)           | Downloads and cleans subtitles, prepares a recap skeleton, validates the completed recap, and generates a preview link. It does not write the summary. |
| Agent                                                  | Reads the transcript and writes the summary, takeaway, highlights, sections, and conclusion.                                                           |
| Shared utilities (`packages/video-util`)               | Define recap validity and preview-link encoding and decoding.                                                                                          |
| Web app (`apps/web`)                                   | Decodes and validates the link, then renders the recap beside an embedded YouTube player.                                                              |

## Data flow

1. The skill invokes the CLI to fetch video metadata and subtitles into a per-video output directory.
2. The agent reads the cleaned transcript and fills in the recap JSON.
3. The CLI validates the recap and encodes it into a preview link.
4. The recipient opens the link. The web app decodes the recap in the browser and renders it; timestamps seek the player.

## Why a thin skill

Executable behavior belongs in the CLI so it can be tested, versioned, and used independently. The installed skill needs no scripts or dependency installation of its own. The skill guides the semantic work; the CLI handles repeatable processing.

The skill and CLI are versioned separately. The skill currently invokes `commonplace-cli@latest`, rather than pinning a particular CLI release.

## Shared contracts and compatibility

The CLI bundles `@commonplace/video-util` so it works outside the monorepo. The web app imports the same package for decoding and full recap validation. Recap validity has one implementation rather than separate CLI and web rules.

The CLI's [preview-link tests](../packages/commonplace-cli/tests/preview-link.test.ts) round-trip sample recaps through the shared encoder, decoder, and validator used by the web app, and check link generation. These are contract tests, not browser rendering tests.

The [preview-link specification](preview-link.md) defines the wire format and its two independent versions: encoding version and recap schema version. Changes must account for links already shared.

See [coding conventions](../CODE_STYLE.md) for implementation rules and [sharing decisions](sharing.md) for the current product boundary.
