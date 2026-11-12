# Sharing recaps

Commonplace shares recaps through anonymous, read-only links. No account is needed. There are two kinds:

- **Short links** (the default): `https://commonplace.video/r/<id>#k=<key>`. The recap is encrypted on the author's machine and stored by Commonplace until the link expires. See the [short-link format](short-link.md).
- **Preview links** (`commonplace link --public`): `https://commonplace.video/preview#v=1&d=<payload>`. The recap travels inside the link and is stored nowhere. See the [preview-link format](preview-link.md).

## Why this approach

People can generate and share recaps without authentication or a publishing workflow. Preview links came first and need no server at all, but at 3 to 6 KB they get cut off by chat apps. Short links fix that while keeping the server unable to read what it stores.

A link is a copy of a recap, not a reference to an editable record. Changing the local recap and generating another link does not update links already shared.

## Short links

What is stored: the encrypted recap, its expiry date and a hash of the owner secret. Never the key, the plain recap or the video it is about. Request bodies are never logged.

For how long: 15 days by default. The author can choose from 1 hour up to 2 years with `--ttl`. The record is deleted when the link expires.

Who can read it: anyone with the full link. The key is in the fragment (after `#`), which browsers do not send to the server, so Commonplace and its host see only the encrypted data. Links have 128 random bits in their id, so they cannot be guessed.

Invalidation: creating a link also returns an owner secret, once. The CLI prints a private **manage link** and opens it in the author's browser, where the recap page offers to invalidate the link. Nothing is stored on the author's machine: whoever holds the manage link controls the link. Invalidating deletes the stored recap; it can take about a minute to stop working everywhere. Expired, invalidated and unknown links all show the same message.

Short-link pages and API responses ask search engines not to index them and browsers not to cache them. Creating and reading links are rate-limited per client.

If the service is unavailable, the CLI fails and suggests `--public`. It never falls back to a long link on its own; the skill re-runs with `--public` and tells the author why.

## Preview links

The URL fragment is not included in the HTTP request for the preview page. The Commonplace app decodes the recap in the browser; nothing is uploaded.

The payload is compressed, not encrypted. Anyone with the complete link can read the recap. Preview links never expire and cannot be revoked.

## For both

Treat sharing a link as sharing its contents: browser history, extensions, and the messaging services used to share it may retain the full link, key included. A recipient can keep a copy of the recap.

Local generation does not mean every operation is offline:

- The CLI contacts YouTube to retrieve metadata and subtitles.
- The agent may send transcript content to its configured model provider.
- The CLI uploads the encrypted recap when it creates a short link.
- The recap page loads an embedded YouTube player, which contacts YouTube.

Links are not an anonymity mechanism.

## Current limitations

- Preview links are long and can be truncated by messaging apps.
- Recaps are not saved to a searchable library on the site. Short links are not a step toward one: nothing is kept past a link's lifetime.
- Links depend on a compatible web app remaining available at their embedded address.
- A shared recap cannot be edited. Generate a new link instead.

Account-backed storage would be a separate product change requiring explicit privacy, authentication, retention, and abuse-control decisions.

See the [architecture overview](architecture.md) for component responsibilities.
