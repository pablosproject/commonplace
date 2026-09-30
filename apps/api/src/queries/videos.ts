import { eq, ilike, or } from "drizzle-orm";
import type { Database } from "../db/client.js";
import { videos } from "../db/schema.js";
import { escapeLikePattern } from "../lib/like.js";

const SEARCH_LIMIT = 50;

const withoutInternalId = { id: false } as const;

export const listVideos = async (db: Database) =>
  db.query.videos.findMany({
    columns: withoutInternalId,
    orderBy: (video, { desc }) => desc(video.createdAt),
  });

export const getVideoByYoutubeId = async (
  db: Database,
  youtubeVideoId: string,
) => {
  const video = await db.query.videos.findFirst({
    columns: withoutInternalId,
    where: eq(videos.youtubeVideoId, youtubeVideoId),
    with: {
      recap: { columns: { schemaVersion: true, recapJson: true } },
    },
  });

  return video ?? null;
};

export const searchVideos = async (db: Database, { q }: { q: string }) => {
  const pattern = `%${escapeLikePattern(q)}%`;

  return db.query.videos.findMany({
    columns: withoutInternalId,
    where: or(
      ilike(videos.title, pattern),
      ilike(videos.channel, pattern),
      ilike(videos.abstract, pattern),
      ilike(videos.mainTakeaway, pattern),
    ),
    orderBy: (video, { desc }) => desc(video.createdAt),
    limit: SEARCH_LIMIT,
  });
};
