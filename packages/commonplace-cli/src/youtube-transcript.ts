import { readFileSync, writeFileSync } from "node:fs";
import { readdir, rm } from "node:fs/promises";
import { basename, join } from "node:path";
import type { Flags } from "youtube-dl-exec";
import {
  TranscriptCatalog,
  type TranscriptMetadata,
  type TranscriptTrack,
} from "./lib/transcript-catalog.js";
import { cleanTranscript } from "./lib/transcript-cleaner.js";
import { youtubeDlAdapter, type YtDlpAdapter } from "./youtube-dl.js";

export const transcriptFile = "transcript.txt";
export const videoInfoFile = "video-info.json";

export type FetchTranscriptInput = {
  url: string;
  workDir: string;
  requestedLanguage?: string;
  cookiesFromBrowser?: string;
};

type DownloadedTranscript = {
  track: TranscriptTrack;
  path: string;
};

export function createTranscriptFetcher(ytDlp: YtDlpAdapter) {
  return {
    run(input: FetchTranscriptInput) {
      return new TranscriptFetch(input, ytDlp).run();
    },
  };
}

export const fetchTranscript = createTranscriptFetcher(youtubeDlAdapter);

class TranscriptFetch {
  constructor(
    private readonly input: FetchTranscriptInput,
    private readonly ytDlp: YtDlpAdapter,
  ) {}

  async run() {
    await this.prepareOutput();

    const metadataOutput = await this.runYtDlp({
      skipDownload: true,
      print:
        "%(.{id,title,channel,duration,webpage_url,language,subtitles,automatic_captions})j",
    });
    let metadata: TranscriptMetadata;
    try {
      metadata = JSON.parse(metadataOutput) as TranscriptMetadata;
    } catch {
      throw new Error(
        `Could not read transcript languages for ${this.input.url}`,
      );
    }

    const candidates = TranscriptCatalog.from(metadata).candidateTracks(
      this.input.requestedLanguage,
    );
    if (candidates.length === 0) {
      throw new Error(
        `No transcript languages are available for ${this.input.url}`,
      );
    }

    writeFileSync(
      this.path(videoInfoFile),
      `${JSON.stringify(metadata, null, 2)}\n`,
    );

    const downloaded = await this.downloadFirstAvailable(candidates);
    const transcript = cleanTranscript(readFileSync(downloaded.path, "utf8"));
    writeFileSync(this.path(transcriptFile), transcript);

    const lines = transcript.trim() ? transcript.trim().split("\n").length : 0;
    return [
      `transcript: ${transcriptFile} (${lines} lines, from ${downloaded.track.source}, raw: ${basename(downloaded.path)})`,
      `language: ${downloaded.track.code} (${downloaded.track.name})`,
      `video info: ${videoInfoFile}`,
    ];
  }

  private async prepareOutput() {
    await this.cleanupDownloads();
    await Promise.all(
      [transcriptFile, videoInfoFile].map((file) =>
        rm(this.path(file), { force: true }),
      ),
    );
  }

  private async downloadFirstAvailable(
    candidates: TranscriptTrack[],
  ): Promise<DownloadedTranscript> {
    const failures: string[] = [];

    for (const track of candidates) {
      let failure: string | undefined;
      try {
        await this.runYtDlp({
          ...(track.source === "uploaded subtitles"
            ? { writeSubs: true }
            : { writeAutoSubs: true }),
          skipDownload: true,
          subFormat: "vtt",
          subLangs: `^${track.code.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
          convertSubs: "srt",
          output: "transcript.%(ext)s",
          noSimulate: true,
        });
      } catch (error) {
        failure = error instanceof Error ? error.message : String(error);
      }

      const file = failure
        ? undefined
        : (await readdir(this.input.workDir)).find((candidate) =>
            /^transcript\..*\.srt$/.test(candidate),
          );
      if (file) {
        return { track, path: this.path(file) };
      }

      await this.cleanupDownloads();
      failures.push(failure ?? `${track.code} did not create a subtitle file`);
    }

    throw new Error(
      `Could not download a transcript for ${this.input.url} (tried ${candidates.map(({ code }) => code).join(", ")}): ${failures.at(-1)}`,
    );
  }

  private async cleanupDownloads() {
    const files = await readdir(this.input.workDir);
    await Promise.all(
      files
        .filter((file) => /^transcript\..*\.(srt|vtt)$/.test(file))
        .map((file) => rm(this.path(file), { force: true })),
    );
  }

  private path(file: string) {
    return join(this.input.workDir, file);
  }

  private runYtDlp(flags: Flags) {
    return this.ytDlp({
      url: this.input.url,
      flags,
      workDir: this.input.workDir,
      cookiesFromBrowser: this.input.cookiesFromBrowser,
    });
  }
}
