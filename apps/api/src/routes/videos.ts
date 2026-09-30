import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import type { Database } from "../db/client.js";
import { getVideoByYoutubeId, listVideos } from "../queries/videos.js";
import { videoParamsSchema } from "../schemas/videos.js";

export const createVideosRoutes = ({ db }: { db: Database }) =>
  new Hono()
    .get("/", async (c) => {
      const videos = await listVideos(db);

      return c.json({ videos });
    })
    .get(
      "/:youtubeVideoId",
      zValidator("param", videoParamsSchema),
      async (c) => {
        const { youtubeVideoId } = c.req.valid("param");
        const video = await getVideoByYoutubeId(db, youtubeVideoId);

        if (!video) {
          return c.json({ error: "Video not found" }, 404);
        }

        return c.json({ video });
      },
    );
