import { eq } from "drizzle-orm";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { db, sql } from "./client.js";
import { videoRecaps, videos } from "./schema.js";

type RecapData = {
  schemaVersion: string;
  video: {
    id: string;
    url: string;
    title: string;
    channel?: string;
    duration?: {
      seconds: number;
      formatted: string;
    };
  };
  abstract: string;
  mainTakeaway: string;
};

const currentFile = fileURLToPath(import.meta.url);
const apiDir = path.resolve(path.dirname(currentFile), "../..");
const repoRoot = path.resolve(apiDir, "../..");
const samplePath = path.join(
  repoRoot,
  "data/samples/wc8FBhQtdsA/video-recap-data.json",
);

const recap = JSON.parse(await readFile(samplePath, "utf8")) as RecapData;

const [video] = await db
  .insert(videos)
  .values({
    youtubeVideoId: recap.video.id,
    url: recap.video.url,
    title: recap.video.title,
    channel: recap.video.channel,
    durationSeconds: recap.video.duration?.seconds,
    durationFormatted: recap.video.duration?.formatted,
    abstract: recap.abstract,
    mainTakeaway: recap.mainTakeaway,
  })
  .onConflictDoUpdate({
    target: videos.youtubeVideoId,
    set: {
      url: recap.video.url,
      title: recap.video.title,
      channel: recap.video.channel,
      durationSeconds: recap.video.duration?.seconds,
      durationFormatted: recap.video.duration?.formatted,
      abstract: recap.abstract,
      mainTakeaway: recap.mainTakeaway,
    },
  })
  .returning();

if (!video) {
  throw new Error("Seed failed to upsert video");
}

await db.delete(videoRecaps).where(eq(videoRecaps.videoId, video.id));

await db.insert(videoRecaps).values({
  videoId: video.id,
  schemaVersion: recap.schemaVersion,
  recapJson: recap,
});

await sql.end();

console.log(`Seeded ${recap.video.id}`);
