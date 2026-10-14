<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/branding/commonplace-logo-white.svg">
    <img src="docs/branding/commonplace-logo.svg" alt="Commonplace" width="360">
  </picture>
</p>

<p align="center"><strong>A commonplace book for video.</strong></p>

For centuries readers kept commonplace books: notebooks where they copied the best passages from what they read, to keep and pass on. Commonplace does the same for YouTube. It turns a video into a recap you can skim, navigate and share, so you spend your time on what is worth watching.

Each recap has a short summary, the main takeaway, timestamped highlights, the video's sections with their key points, and a conclusion. It opens next to an embedded player, and every timestamp jumps the video to that moment.

## Install the skill

Install the Commonplace YouTube recap skill with the [Agent Skills CLI](https://skills.sh/docs/cli):

```sh
npx skills add pablosproject/commonplace --skill commonplace-youtube-recap
```

Use a managed plugin install when your agent supports it, or `skills.sh` when you want editable copied files. Pick one install path per agent to avoid duplicate skills.

### Agent-specific install options

<details>
<summary><strong>Claude Code</strong></summary>

```sh
claude plugin marketplace add pablosproject/commonplace
claude plugin install commonplace-skills@commonplace
```

Installs the managed plugin from this repository marketplace.

</details>

<details>
<summary><strong>Codex</strong></summary>

```sh
codex plugin marketplace add pablosproject/commonplace
codex plugin add commonplace-skills@commonplace
```

Installs the managed plugin from this repository marketplace.

</details>

<details>
<summary><strong>GitHub Copilot</strong> (CLI)</summary>

```sh
copilot plugin marketplace add pablosproject/commonplace
copilot plugin install commonplace-skills@commonplace
```

Installs the managed plugin from this repository marketplace.

</details>

<details>
<summary><strong>Any other Agent Skills-compatible agent, or editable files</strong></summary>

Just use [skills.sh](https://www.skills.sh/).

```sh
npx skills add pablosproject/commonplace --skill commonplace-youtube-recap
```

Or copy the skill files manually. See the [skill README](skills/commonplace-youtube-recap/README.md#manual-installation) for common destinations, requirements and usage.

</details>

## How it works

1. **Generate a recap with your agent.** The [`commonplace-youtube-recap`](skills/commonplace-youtube-recap/README.md) agent skill runs the `commonplace` command from the [`commonplace-cli`](packages/commonplace-cli/README.md) package. The command downloads the transcript, the agent writes the recap, and the command validates it and turns it into a link.
2. **Open the returned link.** Nothing is stored; the recap is self-contained in the URL.

## Development

Install dependencies, then run the web app:

```sh
npm install
npm run dev
```

The web app runs on `http://localhost:5173`.

Open a sample recap in the local web app:

```sh
RECAP_APP_URL=http://localhost:5173/preview npm run preview:link -- vS-gfLhxYDg
```

Without the override, preview links point to `https://commonplace.video/preview`.

Check and test everything:

```sh
npm run check
npm test
```

## Brand

The logo is black and white only. Logo, mark, wordmark and app-icon files are in [`docs/branding`](docs/branding/README.md).

## TODO

### Skill

- Detect the user's browser when retrying with browser cookies to avoid hardcoding Chrome and help with rate limiting.

### CLI

- Add support for multi-language subtitle selection.
