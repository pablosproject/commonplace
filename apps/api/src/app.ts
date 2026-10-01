import { Hono } from "hono";
import type { YouTubeMetadataClient } from "./clients/youtube.js";
import type { Database } from "./db/client.js";
import { createHealthRoutes } from "./routes/health.js";
import { createSearchRoutes } from "./routes/search.js";
import { createVideosRoutes } from "./routes/videos.js";

export const createApp = (deps: {
  db: Database;
  fetchYouTubeMetadata?: YouTubeMetadataClient;
}) =>
  new Hono()
    .route("/api/health", createHealthRoutes())
    .route("/api/videos", createVideosRoutes(deps))
    .route("/api/search", createSearchRoutes(deps));

export type AppType = ReturnType<typeof createApp>;
