import { z } from "zod";

const timestampedPointSchema = z.strictObject({
  time: z.string().regex(/^\d{2}:\d{2}:\d{2}$/),
  seconds: z.number().int().min(0),
  title: z.string().min(1),
  description: z.string().min(1),
  emphasis: z.array(z.string()).optional(),
});

export const recapSchema = z.strictObject({
  schemaVersion: z.literal("1.0"),
  video: z.strictObject({
    id: z.string().min(1),
    url: z.url(),
    title: z.string().min(1),
    channel: z.string().optional(),
    duration: z
      .strictObject({
        seconds: z.number().int().min(0),
        formatted: z.string().regex(/^\d{1,2}:\d{2}:\d{2}$/),
      })
      .optional(),
  }),
  abstract: z.string().min(1),
  mainTakeaway: z.string().min(1),
  highlights: z.array(timestampedPointSchema).min(1),
  sections: z
    .array(
      z.strictObject({
        title: z.string().min(1),
        points: z.array(timestampedPointSchema).min(1),
      }),
    )
    .min(1),
  conclusion: z.string().min(1),
  footerText: z.string().optional(),
  generation: z
    .strictObject({
      transcriptFile: z.string().optional(),
      createdAt: z.iso.datetime({ offset: true }).optional(),
      notes: z.string().optional(),
    })
    .optional(),
});

export type Recap = z.infer<typeof recapSchema>;
