# Preview link format

A preview link carries a complete video recap inside the URL, so the web app can render it without the recap ever being sent to or stored on the server. This document is the contract between the code that **produces** links (the `commonplace-cli` package, which the `commonplace-youtube-recap` agent skill runs) and the code that **consumes** them (the `/preview` route in `apps/web`).

Status: format version `v=1`, decided 2026-10-01. The `/preview` route is implemented in `apps/web`.

## At a glance

```
https://commonplace.video/preview#v=1&d=bZJBaxsxEIX_yjAXX5b1xsFxEZRSEnpoe6r...
└───────────── app URL ─────────────┘ └┬┘ └─────────────── payload ─────────────┘
                                 encoding version
```

| Part                | Value                                                               |
| ------------------- | ------------------------------------------------------------------- |
| Path                | `/preview`                                                          |
| Where the data goes | URL fragment (after `#`), never the query string                    |
| Fragment syntax     | `URLSearchParams`: `v=<encoding version>&d=<payload>`               |
| `v`                 | `1`                                                                 |
| `d` (for `v=1`)     | recap JSON → minified → UTF-8 → deflate-raw → base64url, no padding |
| Payload content     | a recap matching the recap schema (`schemaVersion: "1.0"`)          |
| Typical size        | 3–6 KB of payload for a 15–20 minute video                          |

## Why the fragment

Browsers never send the part after `#` to the server. The server only sees `GET /preview`, so:

- the recap is not uploaded, logged, or stored anywhere: the page decodes it in the browser;
- server and proxy limits on URL length do not apply (browsers accept multi-megabyte URLs; servers often stop at 8–16 KB).

The payload is compressed, **not encrypted**. Anyone who has the link can read the recap.

## Encoding (`v=1`)

Given a recap object that is valid against the schema:

1. **Minify.** `JSON.stringify(recap)` with no indentation. "Minification" means removing whitespace only: keys, key order and values are unchanged. Key names are not shortened because compression already removes most of their cost (repeated keys like `"description"` compress to a few bits each), and readable JSON keeps the format debuggable.
2. **UTF-8.** Encode the string as UTF-8 bytes. Recaps contain non-ASCII text (curly quotes, en dashes, non-English titles).
3. **Deflate-raw.** Compress with DEFLATE ([RFC 1951](https://www.rfc-editor.org/rfc/rfc1951)) **without** a zlib or gzip header or checksum. The shared codec uses the cross-runtime `CompressionStream('deflate-raw')` API.
4. **base64url.** Encode the bytes with the URL-safe alphabet ([RFC 4648 §5](https://www.rfc-editor.org/rfc/rfc4648#section-5)): `+` becomes `-`, `/` becomes `_`, and trailing `=` padding is removed. The result needs no further URL escaping.
5. **Assemble.** `<app URL>#v=1&d=<payload>`.

Producer reference:

```js
import { encodePreview, parseRecap } from "@commonplace/video-util";

const recap = parseRecap(value);
const encoded = await encodePreview(recap);
const link = `${appUrl}${encoded.hash}`;
```

Different DEFLATE implementations (Node's zlib, the browser's `CompressionStream`, compression levels) can produce **different bytes for the same input**, and all of them decode correctly. Never compare payload strings; compare decoded JSON.

### Why these choices

Measured on the 8 sample recaps in `data/samples` (minified JSON, then encoded):

| Method                     | Encoded size   | Decoding in the browser                                    |
| -------------------------- | -------------- | ---------------------------------------------------------- |
| none (raw JSON, base64url) | 9.5–21 KB      | n/a                                                        |
| **deflate-raw**            | **3.0–6.1 KB** | native `DecompressionStream('deflate-raw')`                |
| gzip                       | 3.1–6.1 KB     | native, adds an 18-byte header and checksum for no benefit |
| brotli                     | 2.4–4.8 KB     | needs a WASM or JS library in the bundle                   |

deflate-raw needs no dependency on either side. Brotli is about 20% smaller but would add a library to the web bundle. If that trade ever changes, it becomes `v=2` (see Versioning).

The same scheme (deflate-raw + base64url in the fragment) is used by Plannotator's share links (`packages/core/compress.ts` in `backnotprop/plannotator`).

## Decoding

The `/preview` route should:

1. Read `location.hash` and parse it with `URLSearchParams` (after dropping the leading `#`).
2. Reject the link if `v` is not a version it supports (today only `1`) or if `d` is missing.
3. Reverse the encoding: base64url → bytes → inflate with `DecompressionStream('deflate-raw')` → UTF-8 decode → `JSON.parse`.
4. **Stop inflating past a size limit.** A few hundred bytes of crafted payload can inflate into hundreds of megabytes (a "decompression bomb"). Real recaps inflate to 7–16 KB; 1 MB is a generous cap.
5. **Validate the result** with the API's recap Zod schema before rendering, and reject an unknown `schemaVersion`. The link can be written by anyone, so the decoded value is untrusted input.
6. Render every field as text (no `dangerouslySetInnerHTML`). Build the player embed and thumbnail from `video.id`, not from `video.url`.

Each failure should end on a readable error state ("This preview link is invalid or incomplete"), not a blank page. A link cut off by a chat app usually fails at step 3.

The shared encoding, decoding and recap validation building blocks live in `packages/video-util`. The web app imports its decoder and validates the decoded value before rendering.

## The payload: recap schema

The decoded payload is a recap object, the same shape `POST /api/videos` accepts and `video_recaps.recap_json` stores.

- **Source of truth:** the shape schema and full recap validity module in `packages/video-util/src/recap.ts`.
- **CLI validation:** `packages/commonplace-cli` imports and bundles `@commonplace/video-util`, so it validates with the same full recap validity module before encoding. The CLI package version is the validation boundary; no generated JSON Schema is shipped for runtime validation.

Every object is strict: unknown properties are rejected.

| Field                      | Type                                                  | Required        | Notes                                             |
| -------------------------- | ----------------------------------------------------- | --------------- | ------------------------------------------------- |
| `schemaVersion`            | `"1.0"`                                               | yes             | constant; see Versioning                          |
| `video.id`                 | string                                                | yes             | YouTube video id, e.g. `UF8uR6Z6KLc`              |
| `video.url`                | string (URI)                                          | yes             | canonical watch URL                               |
| `video.title`              | string                                                | yes             |                                                   |
| `video.channel`            | string                                                | no              |                                                   |
| `video.duration.seconds`   | integer ≥ 0                                           | with `duration` |                                                   |
| `video.duration.formatted` | `H:MM:SS` or `HH:MM:SS`                               | with `duration` |                                                   |
| `abstract`                 | string                                                | yes             | 1–2 sentence summary                              |
| `mainTakeaway`             | string                                                | yes             | the single strongest idea                         |
| `highlights`               | timestamped point[]                                   | yes, ≥ 1        | best moments to jump to                           |
| `sections`                 | `{ title, points: timestamped point[] }[]`            | yes, ≥ 1        | the video's parts, in order; each needs ≥ 1 point |
| `conclusion`               | string                                                | yes             |                                                   |
| `footerText`               | string                                                | no              |                                                   |
| `generation`               | `{ transcriptFile?, createdAt? (date-time), notes? }` | no              | provenance, not meant for display                 |

A **timestamped point**:

| Field         | Type        | Required | Notes                                                                |
| ------------- | ----------- | -------- | -------------------------------------------------------------------- |
| `time`        | `HH:MM:SS`  | yes      | zero-padded, e.g. `00:04:07`                                         |
| `seconds`     | integer ≥ 0 | yes      | the same moment in seconds (`247`); the CLI checks it matches `time` |
| `title`       | string      | yes      |                                                                      |
| `description` | string      | yes      |                                                                      |

## Versioning

Two independent version numbers:

|                 | Lives in           | Covers                     | Bump when                                                     |
| --------------- | ------------------ | -------------------------- | ------------------------------------------------------------- |
| `v`             | the fragment       | how the payload is encoded | compression or encoding changes (e.g. brotli would be `v=2`)  |
| `schemaVersion` | inside the payload | the shape of the recap     | the recap schema changes in a way old consumers would misread |

Consumers reject what they do not know. Links already shared keep working as long as the app still decodes their `v` and `schemaVersion`, so dropping support for an old version breaks those links.

## Test vector

A minimal valid recap and a link the CLI produced for it. A decoder is correct if decoding this fragment yields exactly this JSON.

Recap (formatted here; it is minified before encoding, 683 bytes minified):

```json
{
  "schemaVersion": "1.0",
  "video": {
    "id": "UF8uR6Z6KLc",
    "url": "https://www.youtube.com/watch?v=UF8uR6Z6KLc",
    "title": "Steve Jobs' 2005 Stanford Commencement Address"
  },
  "abstract": "Three stories from Jobs' life about connecting the dots, love and loss, and death.",
  "mainTakeaway": "Your time is limited, so don't waste it living someone else's life.",
  "highlights": [
    {
      "time": "00:05:07",
      "seconds": 307,
      "title": "Connecting the dots",
      "description": "You can only connect the dots looking backwards."
    }
  ],
  "sections": [
    {
      "title": "Death",
      "points": [
        {
          "time": "00:12:32",
          "seconds": 752,
          "title": "Your time is limited",
          "description": "Don't live someone else's life."
        }
      ]
    }
  ],
  "conclusion": "Stay hungry. Stay foolish."
}
```

Link (398 bytes compressed, 531 characters of payload):

```
https://commonplace.video/preview#v=1&d=bZJBaxsxEIX_yjAXX5b1xsFxEZRSEnpoe6rTQhpy0EpjS1irMZrZXYzxfy_rJE2Lc9OA3nufnuaI4gJ19hcViZzR4FXdYIVD9MRojhg9Gvz55UP_4-b3zbfvDivsS0KDQXUvZj4fx7E-cK99S7Xjbj5adeHT8PF_jUZNhAbXSgPBV25lBoumWcJabd5w8XDLXUfZUUdZ4bP3hUTwVKFtRYt1igbvQyECUS6RBDaFuxenFDcEtuVewXHO5DTmLWgg8KxSQeKBwGYPiUWq88mT1VBjhZ2N-d7uyI72gAYfuC-gsSOIAil2UclXIAye80xhtKIEUSHFYcoQ7ogzASWhmZxBJtMQtyHFbVBB83jEyQ8NNo1plqZZYYVCjrMXNNfN6q2d20t4rNCTuBL3-vw_D9yDsxk4p8Pra__ehsS8m-StdbvRFi81np7OcZP8leY57W6qACvcc8wXoFcLc734F3S1XLyBvtfSBendubEUB3q_ptPThOY4u9S_LN9a7QFCn7flUMN52DCnKKHG0x8
```

Cases a decoder should reject:

| Fragment                                                                     | Expected                |
| ---------------------------------------------------------------------------- | ----------------------- |
| `#v=2&d=...`                                                                 | unsupported version     |
| `#v=1`                                                                       | missing data            |
| the link above with its last 50 characters removed (a truncated paste)       | decode or parse error   |
| a valid payload whose recap has `"schemaVersion": "2.0"` or an unknown field | schema validation error |

## Known limitations

- **Chat apps truncate long links.** Some messaging apps cut URLs past roughly 2 KB, and every real recap link is longer. Not handled yet. One option, used by Plannotator, is an opt-in short link that stores only an encrypted payload and keeps the key in the fragment.
- **The app URL is embedded in every link.** The CLI defaults to `https://commonplace.video/preview`; `RECAP_APP_URL` can point links at another deployment or a local development server.
- **Nothing is saved.** A recap opened from a preview link is not searchable on the site. Storing recaps is planned for logged-in users.

## Where the code lives

| Side           | Location                                                                                                                                                      |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Shared codec   | `packages/video-util`                                                                                                                                         |
| Producer       | `packages/commonplace-cli` (`commonplace encode` / `link`: validates, encodes the hash with `@commonplace/video-util`, assembles the app URL locally)         |
| Dev shortcut   | `npm run preview:link -- <sample-id\|recap.json> [app-url] [--no-open]` (validates and encodes with `@commonplace/video-util`, assembles the app URL locally) |
| Consumer       | `apps/web/src/pages/preview/PreviewPage.tsx`                                                                                                                  |
| Contract tests | `packages/video-util/tests/`, `packages/commonplace-cli/tests/preview-link.test.ts`                                                                           |
| Recap schema   | `packages/video-util/src/recap.ts`                                                                                                                            |
