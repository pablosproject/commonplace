# Sharing recaps

Commonplace currently shares recaps through anonymous, read-only preview links. The recap is carried in the URL fragment and decoded in the browser; no account or server-side recap storage is required.

## Why this approach

People can generate and share recaps without authentication, a database-backed publishing workflow, or anonymous public writes. This keeps the initial sharing experience useful without introducing account management and write-abuse controls.

A preview link is a portable copy of a recap, not a reference to an editable server record. Changing the local recap and generating another link does not update links already shared.

## Privacy boundary

The URL fragment (the part after `#`) is not included in the HTTP request for the preview page. The Commonplace app decodes the recap in the browser rather than uploading it to a recap-storage service.

The payload is compressed, not encrypted. Anyone with the complete link can read the recap. Treat sharing the link as sharing its contents; browser history, extensions, and the messaging services used to share it may retain or access the full link.

Local generation does not mean every operation is offline:

- The CLI contacts YouTube to retrieve metadata and subtitles.
- The agent may send transcript content to its configured model provider.
- The preview page loads an embedded YouTube player, which contacts YouTube.

The link format is not an end-to-end encryption or anonymity mechanism.

## Current limitations

- Long links can be truncated by messaging apps. Commonplace does not currently provide hosted short links.
- Preview recaps are not saved to a searchable library on the site.
- Links depend on a compatible web app remaining available at their embedded address.
- There is no server-side recap record to edit or revoke. A recipient can retain a copy of the link or decoded recap.

Hosted sharing or account-backed storage would be separate product changes requiring explicit privacy, authentication, retention, and abuse-control decisions. They are not prerequisites for the current workflow.

See the [preview-link specification](preview-link.md) for encoding and compatibility details and the [architecture overview](architecture.md) for component responsibilities.
