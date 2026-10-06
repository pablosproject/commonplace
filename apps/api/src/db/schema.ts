import { relations } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import type { Recap } from "video-util";

export const videos = pgTable(
  "videos",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    youtubeVideoId: text("youtube_video_id").notNull().unique(),
    url: text("url").notNull(),
    title: text("title").notNull(),
    channel: text("channel"),
    durationSeconds: integer("duration_seconds"),
    durationFormatted: text("duration_formatted"),
    abstract: text("abstract").notNull(),
    mainTakeaway: text("main_takeaway").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("videos_title_idx").on(table.title),
    index("videos_channel_idx").on(table.channel),
  ],
);

export const videoRecaps = pgTable("video_recaps", {
  id: uuid("id").defaultRandom().primaryKey(),
  videoId: uuid("video_id")
    .notNull()
    .unique()
    .references(() => videos.id, { onDelete: "cascade" }),
  schemaVersion: text("schema_version").notNull(),
  recapJson: jsonb("recap_json").$type<Recap>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const videosRelations = relations(videos, ({ one }) => ({
  recap: one(videoRecaps, {
    fields: [videos.id],
    references: [videoRecaps.videoId],
  }),
}));

export const videoRecapsRelations = relations(videoRecaps, ({ one }) => ({
  video: one(videos, {
    fields: [videoRecaps.videoId],
    references: [videos.id],
  }),
}));
