# Video Recaps

Early MVP for browsing and searching generated YouTube recap data.

## Stack

- React + Vite + TypeScript frontend in `apps/web`
- Hono + TypeScript API in `apps/api`

## Development

Install dependencies:

```sh
npm install
```

Run the frontend and API together:

```sh
npm run dev
```

Or run either side directly:

```sh
npm run dev:web
npm run dev:api
```

The web app runs on `http://localhost:5173` and proxies `/api` to the API on `http://localhost:3000`.
