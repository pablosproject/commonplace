import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import type { Database } from "../db/client.js";
import { searchVideos } from "../queries/videos.js";
import { searchQuerySchema } from "../schemas/videos.js";

export const createSearchRoutes = ({ db }: { db: Database }) =>
  new Hono().get("/", zValidator("query", searchQuerySchema), async (c) => {
    const { q } = c.req.valid("query");
    const videos = await searchVideos(db, { q });

    return c.json({ query: q, videos });
  });
