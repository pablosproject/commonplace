# Changelog

All notable changes to the Commonplace YouTube Recap skill are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.3.0] - 2026-10-17

### Added

- Added progress updates: a short line before each step and a checklist of step results, repeated in the final reply.

## [0.2.0] - 2026-10-14

### Added

- Added support for generating recaps in a requested language.

## [0.1.2] - 2026-10-13

### Changed

- Condensed the workflow while retaining the original purpose, recap quality guidelines and JSON examples.
- Added Node, Python and ffmpeg preflight checks and preferred per-video output outside the repository.
- Directed agents to deliver the long preview URL through the `link` tool result instead of regenerating it in the final reply.

## [0.1.1] - 2026-10-12

### Changed

- Documented rerunning `fetch` with a PATH that resolves `python3` to Python 3.10+ if the bundled `yt-dlp` hits the system Python.
- Updated failed fetch guidance to retry immediately once without assuming Chrome is installed.

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

- Clarified that a recap should stop rather than invent content when no transcript can be obtained.
