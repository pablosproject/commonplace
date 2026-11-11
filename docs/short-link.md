# Short link format

A short link points to an encrypted recap stored by the Commonplace Worker. It keeps links short enough for chat apps, which truncate the long [preview links](preview-link.md), while the server stores only data it cannot read. This document is the contract between the code that **creates** short links (the CLI), the **Worker** that stores them (`apps/worker`), and the **web app** that opens them (`/r/:id` in `apps/web`).

Status: record version `v: 1`.

## At a glance

```
https://commonplace.video/r/HTUfp9aUTZhyYLWq0U8biQ#k=x5EPXsuVdc4MH4FifxcIKJfU_WLqsitM8AREBNP9bdY
└──────── app URL ───────┘ └──────── id ────────┘ └──────────────── key ─────────────────┘
                            sent to the server       stays in the browser (fragment)
```

| Part     | Value                                                                                    |
| -------- | ---------------------------------------------------------------------------------------- |
| Path     | `/r/<id>`, where `id` is 16 random bytes in base64url (22 characters)                    |
| Fragment | `k=<key>`: the 32-byte AES-256 key in base64url (43 characters)                          |
| Manage   | the same link plus `&m=<owner secret>` (32 random bytes, 43 characters); keep it private |
| Stored   | the encrypted recap (`data`), never the key                                              |

Browsers never send the fragment (after `#`) to the server, so the Worker sees only the id. Anyone with the full link can read the recap: the link is the permission.

## Encryption

`encryptRecap(recap)` in `packages/video-util/src/short-link.ts` returns `{ data, key }`:

```
encryptRecap: recap JSON → deflate-raw → AES-256-GCM encrypt → base64url
decryptRecap: base64url → AES-256-GCM decrypt → inflate (1 MB cap) → recap JSON
```

1. **Key.** 32 random bytes from `crypto.getRandomValues`. Every link gets a new key.
2. **Initialization vector.** 12 more random bytes. It isn't secret; it makes two encryptions of the same recap produce different output.
3. **Compress.** `JSON.stringify` → UTF-8 → `deflate-raw`, as in preview links. Compression must come first: encrypted bytes look random and don't compress.
4. **Encrypt.** AES-GCM with the key and initialization vector. It hides the content and appends a 16-byte authentication **tag**: if any stored byte changes, decryption fails instead of returning altered data.
5. **Pack.** The initialization vector is needed to decrypt, so it goes at the front of `data`.
6. **Encode.** `data` and `key` are encoded as base64url without padding ([RFC 4648 §5](https://www.rfc-editor.org/rfc/rfc4648#section-5)).

### Data layout

```
data = [ initialization vector (12 bytes) | encrypted recap (N bytes) | tag (16 bytes) ]
```

The shortest valid `data` is therefore 28 bytes. The Worker rejects anything shorter, or anything that isn't base64url, before storing it.

`decryptRecap(data, key)` checks that the key is 32 bytes and `data` at least 28 bytes, decrypts, and stops inflating past 1 MB to guard against decompression bombs. It returns untrusted JSON: the web app validates it against the recap schema before rendering.

## API

All routes are under `/api`, return JSON, and send `Cache-Control: no-store`, `X-Content-Type-Options: nosniff` and `X-Robots-Tag: noindex`. There are no CORS headers. Error bodies are `{ "error": "<message>" }` with a generic message.

### `POST /api/r`: create

Request:

```json
{ "data": "<base64url>", "ttlSeconds": 1296000 }
```

| Field        | Rules                                                                        |
| ------------ | ---------------------------------------------------------------------------- |
| `data`       | base64url, at least 28 bytes; the whole body is at most 64 KB                |
| `ttlSeconds` | optional integer from 60 (1 minute) to 63,072,000 (2 years); default 15 days |

Unknown fields are rejected.

| Status | Body                                   | When                   |
| ------ | -------------------------------------- | ---------------------- |
| `201`  | `{ "id", "ownerSecret", "expiresAt" }` | created                |
| `400`  | error                                  | invalid body           |
| `413`  | error                                  | body larger than 64 KB |
| `429`  | error, `Retry-After: 60`               | rate limit reached     |

`ownerSecret` is returned only once. The Worker stores its SHA-256 hash, never the secret itself.

### `GET /api/r/:id`: read

| Status | Body                              | When                                  |
| ------ | --------------------------------- | ------------------------------------- |
| `200`  | `{ "v": 1, "data", "expiresAt" }` | the link exists and hasn't expired    |
| `404`  | error                             | malformed id, expired, or invalidated |
| `429`  | error, `Retry-After: 60`          | rate limit reached                    |

### `POST /api/r/:id/invalidate`: delete

Request: `{ "ownerSecret": "<43 characters>" }`. The secret goes in the body, not a header or the URL, so it doesn't end up in request logs. The Worker compares hashes in constant time.

| Status | When                                   |
| ------ | -------------------------------------- |
| `204`  | deleted                                |
| `403`  | missing or wrong owner secret          |
| `404`  | malformed id, expired, or already gone |
| `429`  | rate limit reached                     |

Storage is eventually consistent: an invalidated link can keep working for up to about a minute in other locations.

## Limits and privacy

- **Rate limits** per client IP: 1 create and 30 reads or invalidations per minute. They are approximate and per Cloudflare location.
- **Expiry.** Records are stored with a TTL and are also refused past `expiresAt`.
- **Logging.** Request bodies, `data`, keys and owner secrets are never logged.
- **Indexing.** `/r/*` pages and API responses carry `X-Robots-Tag: noindex` and `Cache-Control: no-store`.

## Where the code lives

| Side         | Location                                                                                          |
| ------------ | ------------------------------------------------------------------------------------------------- |
| Shared codec | `packages/video-util/src/short-link.ts` (encryption, link builders, request and response schemas) |
| Worker       | `apps/worker/src/` (`api.ts` routes, `shortLinks.ts` storage, `rateLimit.ts`)                     |
| Config       | `wrangler.toml` (KV namespace `SHORT_LINKS`, rate limits, static assets)                          |
| Tests        | `packages/video-util/tests/short-link.test.ts`, `apps/worker/tests/`                              |
