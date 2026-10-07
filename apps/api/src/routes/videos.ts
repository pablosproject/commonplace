import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import type { YouTubeMetadataClient } from "../clients/youtube.js";
import type { Database } from "../db/client.js";
import { getVideoByYoutubeId, listVideos } from "../queries/videos.js";
import { validRecapSchema } from "video-util";
import { videoParamsSchema } from "../schemas/videos.js";
import { ingestRecap } from "../services/ingest-recap.js";

export const createVideosRoutes = ({
  db,
  fetchYouTubeMetadata,
}: {
  db: Database;
  fetchYouTubeMetadata?: YouTubeMetadataClient;
}) =>
  new Hono()
    .post(
      "/",
      zValidator("json", validRecapSchema, (result, c) => {
        if (!result.success) {
          return c.json(
            {
              error: "Invalid recap",
              issues: result.error.issues.map((issue) => ({
                path: issue.path.join("."),
                message: issue.message,
              })),
            },
            422,
          );
        }
      }),
      async (c) => {
        const result = await ingestRecap(
          db,
          c.req.valid("json"),
          fetchYouTubeMetadata,
        );

        c.header(
          "Location",
          `/api/videos/${encodeURIComponent(result.youtubeVideoId)}`,
        );

        return c.json(
          {
            video: { youtubeVideoId: result.youtubeVideoId },
            created: result.created,
          },
          result.created ? 201 : 200,
        );
      },
    )
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
