# Agent Instructions

- Read `CODE_STYLE.md` before adding or moving files: it defines the project architecture and conventions.
- Use conventional commits.
- Always ask before committing changes for a task.
- Choose simplicity over complexity.
- Do not add unnecessary comments.
- If code seems to need a comment, first clarify whether the code can be made clearer instead.
- For every implemented feature or fix in the skill or the CLI, add an entry under `## [Unreleased]` in its changelog: `skills/commonplace-youtube-recap/CHANGELOG.md` or `packages/commonplace-cli/CHANGELOG.md`.

## Releases

The skill and the CLI are versioned separately. To release one:

1. Run `npm run release:skill:<patch|minor|major>` or `npm run release:cli:<patch|minor|major>`. These update the version in the matching JSON files (`skill.json` and the plugin manifests, or the CLI's `package.json` and `package-lock.json`).
2. In the changelog, rename `## [Unreleased]` to `## [X.Y.Z] - YYYY-MM-DD` and add a new empty `## [Unreleased]` above it.
3. Commit as `chore(skill): release X.Y.Z` or `chore(cli): release X.Y.Z`.
4. Tag that commit `commonplace-skill@X.Y.Z` or `commonplace-cli@X.Y.Z`, and push the tag with the commit. Pushing a `commonplace-cli@*` tag publishes the CLI to npm automatically (`.github/workflows/publish-cli.yml`), so push it only from a commit that is ready to ship.

## Product

**Commonplace**: a commonplace book for video. It helps people consume better content by turning YouTube videos into recaps they can skim, navigate and share: a summary, the main takeaway, timestamped highlights and sections, and a conclusion, shown next to an embedded player whose timestamps seek the video.

- **Recaps are generated in a local workspace** by the `commonplace-youtube-recap` agent skill (`skills/commonplace-youtube-recap/`), which runs the `commonplace` command from the `commonplace-cli` npm package (`packages/commonplace-cli/`): it fetches the transcript, validates the recap JSON and encodes it into a preview link.
- **The web app** (`apps/web/`) renders recaps. Today it opens anonymous preview links at `/preview`, where the recap travels in the URL fragment without server-side recap storage. The link format is in `docs/preview-link.md`.
- **Naming:** workspace packages use the `@commonplace/` scope and stay private (the scope is owned by someone else on npm); only `commonplace-cli` is published. The logo files are in `docs/branding/`.

Glossary: a **recap** is the structured summary of one video; a **timepoint** is a timestamped highlight or section point that seeks the player.

## Project knowledge

- When changing component responsibilities or package boundaries, read and update `docs/architecture.md`.
- When changing sharing behavior or privacy boundaries, read and update `docs/sharing.md`.
- When changing recap validity or link encoding, read and update `docs/preview-link.md`.
- Update the relevant docs with the implementation. Record current behavior and enduring decisions there; keep session logs and exploratory notes separate. Private notes should link to public docs rather than duplicate them.

## Private notes

An optional, ignored standalone checkout at `private/` holds private product reasoning and planning. When working on those topics, read `private/README.md` if present; otherwise continue with the public project docs. Keep its contents private unless explicitly approved for publication.
