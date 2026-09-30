import { z } from "zod";

export const videoParamsSchema = z.object({
  youtubeVideoId: z.string().trim().min(1).max(64),
});

export const searchQuerySchema = z.object({
  q: z.string().trim().min(1).max(200),
});

export const videoCardSchema = z.object({
  youtubeVideoId: z.string(),
  url: z.string(),
  title: z.string(),
  channel: z.string().nullable(),
  durationSeconds: z.number().nullable(),
  durationFormatted: z.string().nullable(),
  abstract: z.string(),
  mainTakeaway: z.string(),
  createdAt: z.date(),
});

export type VideoCard = z.infer<typeof videoCardSchema>;
