import { existsSync, readFileSync } from "node:fs";
import { basename } from "node:path";
import youtubedl from "youtube-dl-exec";
import type { Flags } from "youtube-dl-exec";
import {
  cleanupTranscriptArtifacts,
  findDownloadedSrt,
  transcriptFile,
  videoInfoPath,
  writeTranscript,
  writeVideoInfoIfMissing,
} from "./workspace.js";

const timing = /^(\d{2}:\d{2}:\d{2})[,.]\d{3} --> /;

function parseCues(srt: string) {
  const lines = srt
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim());
  const cues: Array<{ time: string; lines: string[] }> = [];

  lines.forEach((line, index) => {
    const match = timing.exec(line);
    if (match) {
      cues.push({ time: match[1], lines: [] });
      return;
    }
    const isCueNumber =
      /^\d+$/.test(line) && timing.test(lines[index + 1] ?? "");
    if (line && !isCueNumber && cues.length > 0) cues.at(-1)!.lines.push(line);
  });

  return cues.filter((cue) => cue.lines.length > 0);
}

export function cleanTranscript(srt: string): string {
  const output: string[] = [];
  let previousLines: string[] = [];

  for (const cue of parseCues(srt)) {
    const newLines = cue.lines.filter((line) => !previousLines.includes(line));
    previousLines = cue.lines;
    if (newLines.length > 0) output.push(`[${cue.time}] ${newLines.join(" ")}`);
  }

  return output.length ? `${output.join("\n")}\n` : "";
}

async function runYtDlp(
  url: string,
  flags: Flags,
  options: { allowFailure?: boolean; workDir?: string } = {},
) {
  const cookiesFromBrowser = process.env.RECAP_COOKIES_FROM_BROWSER;
  try {
    const { stdout } = await youtubedl.exec(
      url,
      cookiesFromBrowser ? { ...flags, cookiesFromBrowser } : flags,
      { cwd: options.workDir ?? process.cwd() },
    );
    return stdout.trim();
  } catch (error) {
    const details = error as {
      stderr?: string;
      stdout?: string;
      message?: string;
    };
    const output =
      details.stderr || details.stdout || details.message || String(error);
    if (options.allowFailure) {
      if (output.trim()) console.error(output.trim());
      return details.stdout?.trim() ?? "";
    }
    throw new Error(output.trim() || String(error));
  }
}

async function fetchSubtitles(
  url: string,
  flags: Flags,
  options: { allowFailure?: boolean; workDir?: string } = {},
) {
  const workDir = options.workDir ?? process.cwd();
  const videoInfo = await runYtDlp(
    url,
    {
      ...flags,
      skipDownload: true,
      subFormat: "vtt",
      convertSubs: "srt",
      output: "transcript.%(ext)s",
      noSimulate: true,
      print: "%(.{id,title,channel,duration,webpage_url})j",
    },
    options,
  );
  writeVideoInfoIfMissing(workDir, videoInfo);
}

export async function fetchTranscript(url: string, workDir = process.cwd()) {
  await cleanupTranscriptArtifacts(workDir);

  let source = "uploaded subtitles";
  await fetchSubtitles(
    url,
    { writeSubs: true, subLangs: "en.*" },
    { allowFailure: true, workDir },
  );

  let srt = await findDownloadedSrt(workDir);
  if (!srt) {
    source = "auto-generated captions";
    await fetchSubtitles(
      url,
      { writeAutoSubs: true, subLangs: "en" },
      { workDir },
    );
    srt = await findDownloadedSrt(workDir);
  }

  if (!srt) {
    throw new Error(
      `No English transcript downloaded for ${url} (see yt-dlp errors above)`,
    );
  }

  const transcript = cleanTranscript(readFileSync(srt, "utf8"));
  writeTranscript(workDir, transcript);
  const lines = transcript.trim() ? transcript.trim().split("\n").length : 0;
  const output = [
    `transcript: ${transcriptFile} (${lines} lines, from ${source}, raw: ${basename(srt)})`,
  ];
  if (existsSync(videoInfoPath(workDir))) {
    output.push(`video info: ${basename(videoInfoPath(workDir))}`);
  }
  return output;
}
