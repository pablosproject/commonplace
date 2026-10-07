import {
  hasTranscript,
  readVideoInfo,
  transcriptFile,
  writeRecapStub,
  type VideoInfo,
} from "./workspace.js";

function formatDuration(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  return [hours, minutes, remainingSeconds]
    .map((part) => String(part).padStart(2, "0"))
    .join(":");
}

function buildJsonStub(videoInfo: VideoInfo) {
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

export async function generateJsonStub(
  dataJson: string,
  bin: string,
  workDir = process.cwd(),
) {
  if (!hasTranscript(workDir)) {
    throw new Error(`No ${transcriptFile} found. Run: ${bin} fetch VIDEO_URL`);
  }

  writeRecapStub(workDir, dataJson, buildJsonStub(readVideoInfo(workDir)));

  return [
    `Transcript: ${transcriptFile}`,
    `Fill in ${dataJson}, then run: ${bin} validate && ${bin} link`,
  ];
}
