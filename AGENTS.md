# Agent Instructions

- Read `CODE_STYLE.md` before adding or moving files: it defines the API architecture and conventions.
- Use conventional commits.
- Always ask before committing changes for a task.
- Choose simplicity over complexity.
- Do not add unnecessary comments.
- If code seems to need a comment, first clarify whether the code can be made clearer instead.

## Product

**Commonplace**: a commonplace book for video. It helps people consume better content by turning YouTube videos into recaps they can skim, navigate and share: a summary, the main takeaway, timestamped highlights and sections, and a conclusion, shown next to an embedded player whose timestamps seek the video.

- **Recaps are generated locally** by the `youtube-recap` agent skill (`skills/youtube-recap/`), which runs the `@video-recap/youtube-recap-cli` package (`packages/youtube-recap-cli/`): it fetches the transcript, validates the recap JSON and encodes it into a preview link.
- **The web app** (`apps/web/`) renders recaps. Today it opens anonymous preview links at `/preview`, where the recap travels in the URL fragment and nothing is stored. The link format is in `docs/preview-link.md`.
- **The API** (`apps/api/`, Hono + Postgres) is for stored recaps, browsing and search, and later logged-in sharing.
- **Branding:** the logo files are in `docs/branding/`. Packages, the repository and infrastructure still use the old `video-recap` names until they are renamed.

Glossary: a **recap** is the structured summary of one video; a **timepoint** is a timestamped highlight or section point that seeks the player.

## Private notes

Product reasoning, decisions and planning (task list, branding rationale, sharing-mode decisions) live in the private repository `pablosproject/commonplace-private`, mounted at `private/` as a Git submodule. Read `private/README.md` for its contents. Run `git submodule update --init` if the folder is empty. Never copy its contents into this repository: it is meant to stay private when this one is public.
