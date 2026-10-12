<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/branding/commonplace-logo-white.svg">
    <img src="docs/branding/commonplace-logo.svg" alt="Commonplace" width="360">
  </picture>
</p>

<p align="center"><strong>A commonplace book for video.</strong></p>

For centuries readers kept commonplace books: notebooks where they copied the best passages from what they read, to keep and pass on. Commonplace does the same for YouTube. It turns a video into a recap you can skim, navigate and share, so you spend your time on what is worth watching.

Each recap has a short summary, the main takeaway, timestamped highlights, the video's sections with their key points, and a conclusion. It opens next to an embedded player, and every timestamp jumps the video to that moment.

## How it works

1. **Generate a recap with your agent.** The [`commonplace-youtube-recap`](skills/commonplace-youtube-recap/README.md) agent skill runs the `commonplace` command from the [`commonplace-cli`](packages/commonplace-cli/README.md) package. The command downloads the transcript, the agent writes the recap, and the command validates it and turns it into a link.
2. **Open the link.** The recap travels inside the link itself, in the URL fragment, so nothing is uploaded or stored. The web app decodes it and shows it next to the video. The format is specified in [`docs/preview-link.md`](docs/preview-link.md).
3. **Browse and search** (in progress). The API stores recaps in Postgres for browsing, search and, later, sharing from an account.

## Repository layout

| Path                               | What it is                                             |
| ---------------------------------- | ------------------------------------------------------ |
| `apps/web`                         | React + Vite web app that renders recaps               |
| `apps/api`                         | Hono API with Postgres (Drizzle ORM) for stored recaps |
| `packages/video-util`              | Shared recap schema and preview-link encoding          |
| `packages/commonplace-cli`         | The `commonplace` command the agent skill runs         |
| `skills/commonplace-youtube-recap` | The agent skill                                        |
| `data/samples`                     | Sample recaps used for development and tests           |
| `docs`                             | Preview-link format and brand files (`docs/branding`)  |

## Development

Install dependencies, then run the web app and the API together:

```sh
npm install
npm run dev
```

Or run either side on its own with `npm run dev:web` or `npm run dev:api`. The web app runs on `http://localhost:5173` and proxies `/api` to the API on `http://localhost:3000`.

Open a sample recap in the local web app without the API:

```sh
RECAP_APP_URL=http://localhost:5173/preview npm run preview:link -- vS-gfLhxYDg
```

Without the override, preview links point to `https://commonplace.video/preview`.

Check and test everything:

```sh
npm run check
npm test
```

## Database

Start Postgres and copy the API env file:

```sh
docker compose up -d
cp apps/api/.env.example apps/api/.env
```

Run the migrations and seed the sample recap:

```sh
npm run db:migrate
npm run db:seed
```

Submit or replace a recap manually:

```sh
curl --request POST \
  --header 'Content-Type: application/json' \
  --data @data/samples/wc8FBhQtdsA/video-recap-data.json \
  http://localhost:3000/api/videos
```

## Brand

The logo is black and white only. Logo, mark, wordmark and app-icon files are in [`docs/branding`](docs/branding/README.md).
