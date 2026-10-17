import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  encodePreview,
  safeParseRecap,
  type Recap,
} from "@commonplace/video-util";
import { z } from "zod";
import { transcriptFile, videoInfoFile } from "./youtube-transcript.js";

const videoInfoSchema = z.object({
  id: z.string().optional(),
  title: z.string().optional(),
  channel: z.string().optional(),
  duration: z.number().optional(),
  webpage_url: z.string().optional(),
  language: z.string().nullable().optional(),
});

type VideoInfo = z.infer<typeof videoInfoSchema>;

export function getRecap({
  workDir,
  dataJson,
}: {
  workDir: string;
  dataJson: string;
}): Recap {
  const dataPath = join(workDir, dataJson);
  if (!existsSync(dataPath)) {
    throw new Error(
      `No recap data at ${dataPath}. Run: commonplace generate-json-stub`,
    );
  }

  let value: unknown;
  try {
    value = JSON.parse(readFileSync(dataPath, "utf8"));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid JSON in ${dataPath}: ${message}`);
  }

  const parsed = safeParseRecap(value);

  if (!parsed.success) {
    const details = parsed.error.issues.map((issue) => {
      const path = issue.path.length ? `/${issue.path.join("/")}` : "/";
      return `- ${path} ${issue.message}`;
    });
    throw new Error(["Schema validation failed:", ...details].join("\n"));
  }

  const placeholders = findPlaceholders(parsed.data);
  if (placeholders.length) {
    throw new Error(
      [
        `${dataJson} still has TODO placeholders:`,
        ...placeholders.map((path) => `- ${path}`),
      ].join("\n"),
    );
  }

  return parsed.data;
}

function findPlaceholders(value: unknown, path = ""): string[] {
  if (value === "TODO") return [path || "/"];
  if (typeof value !== "object" || value === null) return [];
  return Object.entries(value).flatMap(([key, child]) =>
    findPlaceholders(child, `${path}/${key}`),
  );
}

export function generateJsonStub({
  workDir,
  dataJson,
  bin,
}: {
  workDir: string;
  dataJson: string;
  bin: string;
}) {
  if (!existsSync(join(workDir, transcriptFile))) {
    throw new Error(`No ${transcriptFile} found. Run: ${bin} fetch VIDEO_URL`);
  }

  const videoInfoPath = join(workDir, videoInfoFile);
  const videoInfo = videoInfoSchema.parse(
    existsSync(videoInfoPath)
      ? JSON.parse(readFileSync(videoInfoPath, "utf8"))
      : {},
  );
  const dataPath = join(workDir, dataJson);
  if (!existsSync(dataPath)) {
    writeFileSync(
      dataPath,
      `${JSON.stringify(buildJsonStub(videoInfo), null, 2)}\n`,
    );
  }

  return [
    `Transcript: ${transcriptFile}`,
    `Fill in ${dataJson}, then run: ${bin} validate && ${bin} link`,
  ];
}

export async function createPreviewLink({
  workDir,
  dataJson,
  appUrl,
  linkOut,
}: {
  workDir: string;
  dataJson: string;
  appUrl: string;
  linkOut: string;
}) {
  const encoded = await encodePreview(getRecap({ workDir, dataJson }));
  const link = `${appUrl}${encoded.hash}`;
  writeFileSync(join(workDir, linkOut), `${link}\n`);
  return link;
}

function formatDuration(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  return [hours, minutes, remainingSeconds]
    .map((part) => String(part).padStart(2, "0"))
    .join(":");
}

function buildJsonStub(videoInfo: VideoInfo): Recap {
  return {
    schemaVersion: "1.0",
    video: {
      id: videoInfo.id ?? "TODO",
      url: videoInfo.webpage_url ?? "TODO",
      title: videoInfo.title ?? "TODO",
      ...(videoInfo.channel ? { channel: videoInfo.channel } : {}),
      ...(typeof videoInfo.duration === "number"
        ? {
            duration: {
              seconds: videoInfo.duration,
              formatted: formatDuration(videoInfo.duration),
            },
          }
        : {}),
    },
    abstract: "TODO",
    mainTakeaway: "TODO",
    highlights: [
      {
        time: "00:00:00",
        seconds: 0,
        title: "TODO",
        description: "TODO",
      },
    ],
    sections: [
      {
        title: "TODO",
        points: [
          {
            time: "00:00:00",
            seconds: 0,
            title: "TODO",
            description: "TODO",
          },
        ],
      },
    ],
    conclusion: "TODO",
  };
}
