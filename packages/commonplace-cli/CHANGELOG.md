# Changelog

All notable changes to `commonplace-cli` are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Fixed

- Made `validate` and `link` reject a recap that still has `TODO` placeholders from `generate-json-stub`, listing each unfilled field.

## [0.3.0] - 2026-10-14

### Added

- Added `fetch --language CODE` with language discovery and selected-track reporting.

### Changed

- Made `fetch` prefer the video's original transcript when no language is requested.

## [0.2.0] - 2026-10-12

### Fixed

- Fetch original English auto-captions through YouTube's `en-orig` track before falling back to the translated `en` track, which can return HTTP 429.

## [0.1.1] - 2026-10-12

### Changed

- Default preview links now point to `https://commonplace.video/preview` instead of the local development app.
- Updated CLI documentation to show the hosted Commonplace preview URL as the default `RECAP_APP_URL`.

### Added

- Added coverage for the default hosted preview URL and the `RECAP_APP_URL` override.

## [0.1.0] - 2026-10-09

### Added

- Initial published release of the `commonplace` command for the `commonplace-youtube-recap` skill.
- Added `fetch` to download YouTube transcript and video metadata into a per-video workspace.
- Added `generate-json-stub` to create a recap JSON skeleton from the fetched video details.
- Added `validate` to check `video-recap-data.json` against the Commonplace recap schema.
- Added `link` to encode a validated recap into a Commonplace preview link and write it to `preview_url.txt`.
- Added tests for transcript handling and preview-link compatibility with the web app decoder.

### Changed

- Renamed the package from `youtube-recap-cli` to `commonplace-cli` as part of the Commonplace project rename.

### Fixed

- `validate` now reports a clear error when recap data is missing and tells the user to run `commonplace generate-json-stub`.
