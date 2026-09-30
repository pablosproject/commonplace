import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import type { Database } from "../db/client.js";
import { createTestDb, truncateAll } from "../test/db.js";
import { insertVideo } from "../test/factories.js";

let db: Database;
let app: ReturnType<typeof createApp>;

const search = async (query: string) => {
  const response = await app.request(
    `/api/search?q=${encodeURIComponent(query)}`,
  );
  const body = (await response.json()) as {
    videos?: { youtubeVideoId: string }[];
  };

  return { status: response.status, body };
};

beforeAll(async () => {
  db = await createTestDb();
  app = createApp({ db });
});

beforeEach(async () => {
  await truncateAll(db);
});

describe("GET /api/search", () => {
  it("matches title, channel, abstract and main takeaway", async () => {
    await insertVideo(db, {
      youtubeVideoId: "by-title",
      title: "Hono routing",
    });
    await insertVideo(db, {
      youtubeVideoId: "by-channel",
      channel: "Hono Weekly",
    });
    await insertVideo(db, {
      youtubeVideoId: "by-abstract",
      abstract: "Explains Hono middleware",
    });
    await insertVideo(db, {
      youtubeVideoId: "by-takeaway",
      mainTakeaway: "Use Hono factories",
    });
    await insertVideo(db, { youtubeVideoId: "unrelated", title: "Gardening" });

    const { status, body } = await search("hono");

    expect(status).toBe(200);
    expect(body.videos?.map((video) => video.youtubeVideoId).sort()).toEqual([
      "by-abstract",
      "by-channel",
      "by-takeaway",
      "by-title",
    ]);
  });

  it("ignores case", async () => {
    await insertVideo(db, {
      youtubeVideoId: "mixed",
      title: "PostgreSQL Tips",
    });

    const { body } = await search("postgresql tips");

    expect(body.videos).toHaveLength(1);
  });

  it("returns an empty list when nothing matches", async () => {
    await insertVideo(db, { title: "Gardening" });

    const { status, body } = await search("hono");

    expect(status).toBe(200);
    expect(body.videos).toEqual([]);
  });

  it("treats wildcards in the query as literal characters", async () => {
    await insertVideo(db, {
      youtubeVideoId: "literal",
      title: "100% coverage",
    });
    await insertVideo(db, { youtubeVideoId: "other", title: "Gardening" });

    const { body } = await search("%");

    expect(body.videos?.map((video) => video.youtubeVideoId)).toEqual([
      "literal",
    ]);
  });

  it("rejects a missing query", async () => {
    const response = await app.request("/api/search");

    expect(response.status).toBe(400);
  });

  it("rejects a blank query", async () => {
    const { status } = await search("   ");

    expect(status).toBe(400);
  });

  it("caps the number of results", async () => {
    for (let index = 0; index < 55; index += 1) {
      await insertVideo(db, { title: "Hono episode" });
    }

    const { body } = await search("hono");

    expect(body.videos).toHaveLength(50);
  });
});
