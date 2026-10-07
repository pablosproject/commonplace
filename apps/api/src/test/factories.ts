import type { Database } from "../db/client.js";
import { videoRecaps, videos } from "../db/schema.js";
import type { Recap } from "@commonplace/video-util";

type VideoOverrides = Partial<typeof videos.$inferInsert>;

let counter = 0;

export const insertVideo = async (
  db: Database,
  overrides: VideoOverrides = {},
) => {
  counter += 1;

  const [video] = await db
    .insert(videos)
    .values({
      youtubeVideoId: `video-${counter}`,
      url: `https://www.youtube.com/watch?v=video-${counter}`,
      title: `Video ${counter}`,
      abstract: `Abstract ${counter}`,
      mainTakeaway: `Takeaway ${counter}`,
      ...overrides,
    })
    .returning();

  if (!video) {
    throw new Error("Failed to insert test video");
  }

  return video;
};

export const insertRecap = async (
  db: Database,
  videoId: string,
  recapJson: Recap,
  schemaVersion = "1.0.0",
) => {
  const [recap] = await db
    .insert(videoRecaps)
    .values({ videoId, schemaVersion, recapJson })
    .returning();

  if (!recap) {
    throw new Error("Failed to insert test recap");
  }

  return recap;
};
