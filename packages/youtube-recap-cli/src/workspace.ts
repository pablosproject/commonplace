import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { readdir, unlink } from "node:fs/promises";
import { join } from "node:path";

export const transcriptFile = "transcript.txt";
export const videoInfoFile = "video-info.json";
export const defaultDataJson = "video-recap-data.json";
export const defaultLinkOut = "preview_url.txt";

export type VideoInfo = {
  id?: string;
  title?: string;
  channel?: string;
  duration?: number;
  webpage_url?: string;
};

export function transcriptPath(workDir: string) {
  return join(workDir, transcriptFile);
}

export function videoInfoPath(workDir: string) {
  return join(workDir, videoInfoFile);
}

export function recapPath(workDir: string, dataJson: string) {
  return join(workDir, dataJson);
}

export function previewUrlPath(workDir: string, linkOut: string) {
  return join(workDir, linkOut);
}

export function hasTranscript(workDir: string) {
  return existsSync(transcriptPath(workDir));
}

export function readVideoInfo(workDir: string): VideoInfo {
  const path = videoInfoPath(workDir);
  if (!existsSync(path)) return {};
  return JSON.parse(readFileSync(path, "utf8")) as VideoInfo;
}

export function writeVideoInfoIfMissing(workDir: string, videoInfo: string) {
  const path = videoInfoPath(workDir);
  if (videoInfo && !existsSync(path)) writeFileSync(path, `${videoInfo}\n`);
}

export function writeTranscript(workDir: string, transcript: string) {
  writeFileSync(transcriptPath(workDir), transcript);
}

export function writeRecapStub(workDir: string, dataJson: string, value: unknown) {
  const path = recapPath(workDir, dataJson);
  if (!existsSync(path)) writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

export function writePreviewUrl(workDir: string, linkOut: string, url: string) {
  writeFileSync(previewUrlPath(workDir, linkOut), `${url}\n`);
}

export async function findDownloadedSrt(workDir: string) {
  const files = await readdir(workDir);
  const file = files.find((candidate) => /^transcript\..*\.srt$/.test(candidate));
  return file ? join(workDir, file) : undefined;
}

export async function cleanupTranscriptArtifacts(workDir: string) {
  const files = await readdir(workDir);
  await Promise.all(
    files
      .filter(
        (file) =>
          /^transcript\..*\.(srt|vtt)$/.test(file) ||
          file === transcriptFile ||
          file === videoInfoFile,
      )
      .map((file) => unlink(join(workDir, file))),
  );
}
