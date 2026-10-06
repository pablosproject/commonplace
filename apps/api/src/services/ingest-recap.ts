import {
  fetchYouTubeVideoMetadata,
  type YouTubeMetadataClient,
} from "../clients/youtube.js";
import type { Database } from "../db/client.js";
import { upsertRecap, upsertVideo } from "../queries/recaps.js";
import type { Recap } from "video-util";

export const ingestRecap = async (
  db: Database,
  recap: Recap,
  fetchMetadata: YouTubeMetadataClient = fetchYouTubeVideoMetadata,
) => {
  const metadata = await fetchMetadata(recap.video);
  const enrichedRecap: Recap = {
    ...recap,
    video: {
      ...recap.video,
      title: metadata?.title ?? recap.video.title,
      channel: metadata?.channel ?? recap.video.channel,
    },
  };

  return db.transaction(async (tx) => {
    const video = await upsertVideo(tx, {
      youtubeVideoId: enrichedRecap.video.id,
      url: enrichedRecap.video.url,
      title: enrichedRecap.video.title,
      channel: enrichedRecap.video.channel ?? null,
      durationSeconds: enrichedRecap.video.duration?.seconds ?? null,
      durationFormatted: enrichedRecap.video.duration?.formatted ?? null,
      abstract: enrichedRecap.abstract,
      mainTakeaway: enrichedRecap.mainTakeaway,
    });

    await upsertRecap(tx, {
      videoId: video.id,
      schemaVersion: enrichedRecap.schemaVersion,
      recapJson: enrichedRecap,
    });

    return { youtubeVideoId: enrichedRecap.video.id, created: video.created };
  });
};
