import { z } from "zod";

const timestampedPointSchema = z.strictObject({
  time: z.string().regex(/^\d{2}:\d{2}:\d{2}$/),
  seconds: z.number().int().min(0),
  title: z.string().min(1),
  description: z.string().min(1),
});

export const recapSchema = z.strictObject({
  schemaVersion: z.literal("1.0"),
  video: z.strictObject({
    id: z.string().regex(/^[A-Za-z0-9_-]{11}$/),
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

export const validRecapSchema = recapSchema.superRefine((recap, context) => {
  for (const [index, point] of recap.highlights.entries()) {
    validateTimepoint(point, ["highlights", index], context);
  }

  for (const [sectionIndex, section] of recap.sections.entries()) {
    for (const [pointIndex, point] of section.points.entries()) {
      validateTimepoint(
        point,
        ["sections", sectionIndex, "points", pointIndex],
        context,
      );
    }
  }
});

export function parseRecap(value: unknown): Recap {
  return validRecapSchema.parse(value);
}

export function safeParseRecap(value: unknown) {
  return validRecapSchema.safeParse(value);
}

function validateTimepoint(
  point: { time: string; seconds: number },
  path: Array<string | number>,
  context: z.RefinementCtx,
) {
  const match = /^(\d{2}):(\d{2}):(\d{2})$/.exec(point.time);

  if (!match) {
    return;
  }

  const expected =
    Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]);

  if (point.seconds !== expected) {
    context.addIssue({
      code: "custom",
      path: [...path, "seconds"],
      message: `Timestamp mismatch for ${point.time}: expected ${expected}, got ${point.seconds}`,
    });
  }
}
