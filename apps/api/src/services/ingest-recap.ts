import type { Database } from "../db/client.js";
import { upsertRecap, upsertVideo } from "../queries/recaps.js";
import type { Recap } from "../schemas/recaps.js";

export const ingestRecap = async (db: Database, recap: Recap) =>
  db.transaction(async (tx) => {
    const video = await upsertVideo(tx, {
      youtubeVideoId: recap.video.id,
      url: recap.video.url,
      title: recap.video.title,
      channel: recap.video.channel ?? null,
      durationSeconds: recap.video.duration?.seconds ?? null,
      durationFormatted: recap.video.duration?.formatted ?? null,
      abstract: recap.abstract,
      mainTakeaway: recap.mainTakeaway,
    });

    await upsertRecap(tx, {
      videoId: video.id,
      schemaVersion: recap.schemaVersion,
      recapJson: recap,
    });

    return { youtubeVideoId: recap.video.id, created: video.created };
  });
