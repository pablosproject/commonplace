import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import type { Database } from "../db/client.js";
import { createTestDb, truncateAll } from "../test/db.js";
import { insertRecap, insertVideo } from "../test/factories.js";

const currentFile = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(currentFile), "../../../..");
const samplePath = path.join(
  repoRoot,
  "data/samples/wc8FBhQtdsA/video-recap-data.json",
);

let db: Database;
let app: ReturnType<typeof createApp>;

beforeAll(async () => {
  db = await createTestDb();
  app = createApp({ db });
});

beforeEach(async () => {
  await truncateAll(db);
});

describe("GET /api/videos", () => {
  it("returns an empty list when nothing is seeded", async () => {
    const response = await app.request("/api/videos");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ videos: [] });
  });

  it("returns card fields without exposing the internal id", async () => {
    await insertVideo(db, {
      youtubeVideoId: "wc8FBhQtdsA",
      title: "Hono Deep Dive",
      channel: "Some Channel",
      durationSeconds: 620,
      durationFormatted: "10:20",
      abstract: "An abstract",
      mainTakeaway: "A takeaway",
    });

    const response = await app.request("/api/videos");
    const body = (await response.json()) as {
      videos: Record<string, unknown>[];
    };

    expect(body.videos).toHaveLength(1);
    expect(body.videos[0]).toMatchObject({
      youtubeVideoId: "wc8FBhQtdsA",
      title: "Hono Deep Dive",
      channel: "Some Channel",
      durationSeconds: 620,
      durationFormatted: "10:20",
      abstract: "An abstract",
      mainTakeaway: "A takeaway",
    });
    expect(body.videos[0]).not.toHaveProperty("id");
  });

  it("returns the newest video first", async () => {
    await insertVideo(db, {
      youtubeVideoId: "older",
      createdAt: new Date("2026-01-01T00:00:00Z"),
    });
    await insertVideo(db, {
      youtubeVideoId: "newer",
      createdAt: new Date("2026-06-01T00:00:00Z"),
    });

    const response = await app.request("/api/videos");
    const body = (await response.json()) as {
      videos: { youtubeVideoId: string }[];
    };

    expect(body.videos.map((video) => video.youtubeVideoId)).toEqual([
      "newer",
      "older",
    ]);
  });
});

describe("GET /api/videos/:youtubeVideoId", () => {
  it("returns the stored recap payload for the sample recap", async () => {
    const recapJson = JSON.parse(await readFile(samplePath, "utf8"));
    const video = await insertVideo(db, { youtubeVideoId: "wc8FBhQtdsA" });

    await insertRecap(db, video.id, recapJson, recapJson.schemaVersion);

    const response = await app.request("/api/videos/wc8FBhQtdsA");
    const body = (await response.json()) as {
      video: {
        youtubeVideoId: string;
        recap: { schemaVersion: string; recapJson: unknown };
      };
    };

    expect(response.status).toBe(200);
    expect(body.video.youtubeVideoId).toBe("wc8FBhQtdsA");
    expect(body.video).not.toHaveProperty("id");
    expect(body.video.recap.schemaVersion).toBe(recapJson.schemaVersion);
    expect(body.video.recap.recapJson).toEqual(recapJson);
  });

  it("returns 404 for an unknown video", async () => {
    const response = await app.request("/api/videos/missing");

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "Video not found",
    });
  });
});
