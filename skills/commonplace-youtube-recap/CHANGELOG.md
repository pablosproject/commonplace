# Changelog

All notable changes to the Commonplace YouTube Recap skill are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.1.0] - 2026-10-12

### Added

- Started private skill versioning with `skill.json`, including source metadata for manual installs.
- Added plugin-distributable installs for Claude, Codex and Copilot through the repository plugin manifests.
- Added Agent Skills CLI installation instructions for `pablosproject/commonplace --skill commonplace-youtube-recap`.
- Documented common manual install destinations for Agent Skills-compatible harnesses.

### Changed

- Renamed the skill from `youtube-recap` to `commonplace-youtube-recap` as part of the Commonplace project rename.
- Moved executable work out of the skill folder and into the published `commonplace-cli` package; the skill now runs the CLI through `npx`.
- Switched skill commands to `commonplace-cli@latest` so runs use the latest published CLI package.
- Updated the workflow to generate `video-recap-data.json` from a stub, fill every `TODO`, validate while iterating and then create the link.
- Updated the default recap link target from local development to `https://commonplace.video/preview`.
- Tightened prerequisites and tool access around Node.js 20+, Python 3.10+, `ffmpeg`, `node --version` and the `commonplace-cli` commands.
- Improved recap-writing guidance for highlights, section points and final replies, including examples of specific timestamped moments.

### Fixed

- Clarified that failed age/login-restricted YouTube fetches can be retried with `RECAP_COOKIES_FROM_BROWSER=chrome`.
- Clarified that a recap should stop rather than invent content when no transcript can be obtained.
