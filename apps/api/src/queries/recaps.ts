import { eq } from "drizzle-orm";
import type { Database } from "../db/client.js";
import { videoRecaps, videos } from "../db/schema.js";

type VideoValues = typeof videos.$inferInsert;

export const upsertVideo = async (db: Database, values: VideoValues) => {
  const [inserted] = await db
    .insert(videos)
    .values(values)
    .onConflictDoNothing({ target: videos.youtubeVideoId })
    .returning({ id: videos.id });

  if (inserted) {
    return { id: inserted.id, created: true };
  }

  const [updated] = await db
    .update(videos)
    .set(values)
    .where(eq(videos.youtubeVideoId, values.youtubeVideoId))
    .returning({ id: videos.id });

  if (!updated) {
    throw new Error("Failed to update video");
  }

  return { id: updated.id, created: false };
};

export const upsertRecap = async (
  db: Database,
  values: typeof videoRecaps.$inferInsert,
) => {
  await db
    .insert(videoRecaps)
    .values(values)
    .onConflictDoUpdate({
      target: videoRecaps.videoId,
      set: {
        schemaVersion: values.schemaVersion,
        recapJson: values.recapJson,
        createdAt: new Date(),
      },
    });
};
