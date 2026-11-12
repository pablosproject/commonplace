# Scripts

Run every script from the repository root through its npm script.

## Test links

Scripts in `test/` turn a sample recap into a link you can open, to try the web
app. Both take a sample id from `data/samples/` or a path to a recap JSON file,
and open the link unless you pass `--no-open`. Run either one without arguments
to list the sample ids.

### `npm run preview:link`

`test/preview-link.ts` builds a public preview link: the recap is compressed
into the URL fragment and nothing is uploaded.

```bash
npm run dev                              # in another terminal
npm run preview:link -- vS-gfLhxYDg
npm run preview:link -- vS-gfLhxYDg https://commonplace.video/preview
npm run preview:link -- path/to/video-recap-data.json --no-open
```

The optional second argument is the preview page (default:
`http://localhost:5173/preview`, or `RECAP_APP_URL`).

### `npm run short:link`

`test/short-link.ts` encrypts the recap, uploads it to the short-link API and
prints the expiry, the share link and the manage link. It opens the manage link.

```bash
npm run dev:worker                       # in another terminal
npm run short:link -- vS-gfLhxYDg
npm run short:link -- vS-gfLhxYDg --no-open
```

The optional second argument is the short-link service (default:
`http://localhost:8787`, or `RECAP_SHARE_URL`). `npm run dev:worker` uses
relaxed rate limits, so you can create many links in a row.

## Releases

These keep the skill version in sync across its manifests. See "Releases" in
`AGENTS.md` for the full release steps.

| npm script                            | Script                    | What it does                                                                                                     |
| ------------------------------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `release:skill:<patch\|minor\|major>` | `bump-skill-version.ts`   | Bumps the version in `skills/commonplace-youtube-recap/skill.json`, then runs `plugins:sync-version`.            |
| `plugins:sync-version`                | `sync-plugin-version.ts`  | Copies the skill version into `.claude-plugin/plugin.json`, `plugin.json` and `.github/plugin/marketplace.json`. |
| `plugins:check-version`               | `check-plugin-version.ts` | Fails if those manifests don't match `skill.json`. CI runs it in `changelog-guard.yml`.                          |
