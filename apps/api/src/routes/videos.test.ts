import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { testClient } from "hono/testing";
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
let client: ReturnType<typeof testClient<ReturnType<typeof createApp>>>;

beforeAll(async () => {
  db = await createTestDb();
  app = createApp({ db });
  client = testClient(app);
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

    const response = await client.api.videos.$get();

    if (response.status !== 200) {
      throw new Error("Expected the video list");
    }

    const body = await response.json();

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

    const response = await client.api.videos.$get();

    if (response.status !== 200) {
      throw new Error("Expected the video list");
    }

    const body = await response.json();

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

    const response = await client.api.videos[":youtubeVideoId"].$get({
      param: { youtubeVideoId: "wc8FBhQtdsA" },
    });

    if (response.status !== 200) {
      throw new Error("Expected the stored video");
    }

    const body = await response.json();

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

describe("POST /api/videos", () => {
  it("stores a valid recap and returns its location", async () => {
    const recapJson = JSON.parse(await readFile(samplePath, "utf8"));

    const response = await app.request("/api/videos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(recapJson),
    });

    expect(response.status).toBe(201);
    expect(response.headers.get("Location")).toBe("/api/videos/wc8FBhQtdsA");
    await expect(response.json()).resolves.toEqual({
      video: { youtubeVideoId: "wc8FBhQtdsA" },
      created: true,
    });

    const storedResponse = await client.api.videos[":youtubeVideoId"].$get({
      param: { youtubeVideoId: "wc8FBhQtdsA" },
    });

    if (storedResponse.status !== 200) {
      throw new Error("Expected the stored video");
    }

    const storedBody = await storedResponse.json();

    expect(storedBody.video.recap.recapJson).toEqual(recapJson);
  });

  it("replaces an existing video and recap", async () => {
    const original = JSON.parse(await readFile(samplePath, "utf8"));
    const replacement = structuredClone(original);
    replacement.video.title = "Updated title";
    replacement.abstract = "Updated abstract";
    delete replacement.video.channel;
    delete replacement.video.duration;

    await app.request("/api/videos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(original),
    });
    const videoBeforeReplacement = await db.query.videos.findFirst({
      where: (video, { eq }) => eq(video.youtubeVideoId, "wc8FBhQtdsA"),
    });

    if (!videoBeforeReplacement) {
      throw new Error("Expected the original video");
    }

    const response = await app.request("/api/videos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(replacement),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      video: { youtubeVideoId: "wc8FBhQtdsA" },
      created: false,
    });

    const storedResponse = await client.api.videos[":youtubeVideoId"].$get({
      param: { youtubeVideoId: "wc8FBhQtdsA" },
    });
    const videoAfterReplacement = await db.query.videos.findFirst({
      where: (video, { eq }) => eq(video.youtubeVideoId, "wc8FBhQtdsA"),
    });

    if (storedResponse.status !== 200 || !videoAfterReplacement) {
      throw new Error("Expected the replaced video");
    }

    const storedBody = await storedResponse.json();

    expect(videoAfterReplacement.id).toBe(videoBeforeReplacement.id);
    expect(videoAfterReplacement.createdAt).toEqual(
      videoBeforeReplacement.createdAt,
    );
    expect(storedBody.video.title).toBe("Updated title");
    expect(storedBody.video.abstract).toBe("Updated abstract");
    expect(storedBody.video.channel).toBeNull();
    expect(storedBody.video.durationSeconds).toBeNull();
    expect(storedBody.video.recap.recapJson).toEqual(replacement);
  });

  it("returns useful validation errors without storing invalid data", async () => {
    const recapJson = JSON.parse(await readFile(samplePath, "utf8"));
    delete recapJson.abstract;

    const response = await app.request("/api/videos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(recapJson),
    });

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toMatchObject({
      error: "Invalid recap",
      issues: [{ path: "abstract" }],
    });

    const listResponse = await app.request("/api/videos");
    await expect(listResponse.json()).resolves.toEqual({ videos: [] });
  });

  it("accepts a recap without optional video metadata", async () => {
    const recapJson = JSON.parse(await readFile(samplePath, "utf8"));
    delete recapJson.video.channel;
    delete recapJson.video.duration;
    delete recapJson.footerText;
    delete recapJson.generation;

    const response = await app.request("/api/videos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(recapJson),
    });

    expect(response.status).toBe(201);

    const storedResponse = await client.api.videos[":youtubeVideoId"].$get({
      param: { youtubeVideoId: "wc8FBhQtdsA" },
    });

    if (storedResponse.status !== 200) {
      throw new Error("Expected the stored video");
    }

    const storedBody = await storedResponse.json();

    expect(storedBody.video.channel).toBeNull();
    expect(storedBody.video.durationSeconds).toBeNull();
  });
});
