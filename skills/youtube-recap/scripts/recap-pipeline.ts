import { spawn } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { readdir, unlink } from "node:fs/promises";
import { createRequire } from "node:module";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import youtubedl from "youtube-dl-exec";
import type { Flags } from "youtube-dl-exec";
import { cleanTranscript } from "./clean-transcript.js";
import { buildPreviewLink } from "./preview-link.js";

type YtDlpFlags = Flags & { printToFile?: string | string[] };

const scriptDir = dirname(fileURLToPath(import.meta.url));
const skillRoot = dirname(scriptDir);

const defaultAppUrl = "http://localhost:5173/preview";
const appUrl = process.env.RECAP_APP_URL ?? defaultAppUrl;
const dataJson = process.env.DATA_JSON ?? "video-recap-data.json";
const schemaJson =
  process.env.SCHEMA_JSON ?? join(skillRoot, "schemas/video-recap.schema.json");
const linkOut = process.env.LINK_OUT ?? "preview_url.txt";

function usage() {
  console.error(`YouTube recap pipeline for this skill.

Run from the per-video output directory. The script reads the schema from the
skill repo and reads/writes recap files in the current directory.

Usage:
  ${basename(process.argv[1])} fetch 'https://www.youtube.com/watch?v=VIDEO_ID'
  ${basename(process.argv[1])} generate-json-stub
  ${basename(process.argv[1])} validate
  ${basename(process.argv[1])} link

Environment:
  RECAP_APP_URL                 preview page the link points to (default: the embedded app URL)
  RECAP_NO_OPEN                 set to any value to print the link without opening a browser
  RECAP_COOKIES_FROM_BROWSER    browser name for yt-dlp cookies, e.g. chrome`);
}

async function findSrt() {
  const files = await readdir(process.cwd());
  return files.find((file) => /^transcript\..*\.srt$/.test(file));
}

async function removeTranscriptArtifacts() {
  const files = await readdir(process.cwd());
  await Promise.all(
    files
      .filter((file) => /^transcript\..*\.(srt|vtt)$/.test(file))
      .map((file) => unlink(file)),
  );
}

async function runYtDlp(url: string, flags: YtDlpFlags) {
  const cookiesFromBrowser = process.env.RECAP_COOKIES_FROM_BROWSER;
  try {
    await youtubedl.exec(
      url,
      cookiesFromBrowser ? { ...flags, cookiesFromBrowser } : flags,
      { cwd: process.cwd() },
    );
  } catch (error) {
    const details = error as { stderr?: string; stdout?: string; message?: string };
    const output = details.stderr ?? details.stdout ?? details.message ?? String(error);
    if (output.trim()) console.error(output.trim());
  }
}

async function fetchTranscript(url: string | undefined) {
  if (!url) throw new Error(`Usage: ${process.argv[1]} fetch VIDEO_URL`);

  await removeTranscriptArtifacts();

  let source = "uploaded subtitles";
  await runYtDlp(url, {
    skipDownload: true,
    writeSubs: true,
    subLangs: "en.*",
    subFormat: "vtt",
    convertSubs: "srt",
    output: "transcript.%(ext)s",
    printToFile: "%(.{id,title,channel,duration,webpage_url})j video-info.json",
  });

  let srt = await findSrt();
  if (!srt) {
    source = "auto-generated captions";
    await runYtDlp(url, {
      skipDownload: true,
      writeAutoSubs: true,
      subLangs: "en",
      subFormat: "vtt",
      convertSubs: "srt",
      output: "transcript.%(ext)s",
    });
    srt = await findSrt();
  }

  if (!srt) {
    throw new Error(`No English transcript downloaded for ${url} (see yt-dlp errors above)`);
  }

  const transcript = cleanTranscript(readFileSync(srt, "utf8"));
  writeFileSync("transcript.txt", transcript);
  const lines = transcript.trim() ? transcript.trim().split("\n").length : 0;
  console.log(
    `transcript: transcript.txt (${lines} lines, from ${source}, raw: ${srt})`,
  );
  console.log("video info: video-info.json");
}

async function generateJsonStub() {
  const transcript = await findSrt();
  if (!transcript) throw new Error(`No transcript found. Run: ${process.argv[1]} fetch VIDEO_URL`);

  if (!existsSync(dataJson)) {
    writeFileSync(
      dataJson,
      `${JSON.stringify(
        {
          schemaVersion: "1.0",
          video: {
            id: "TODO",
            url: "TODO",
            title: "TODO",
          },
          abstract: "TODO",
          mainTakeaway: "TODO",
          highlights: [],
          sections: [],
          conclusion: "TODO",
        },
        null,
        2,
      )}\n`,
    );
  }

  console.log(`Transcript: ${transcript}`);
  console.log(`Fill in ${dataJson} (schema: ${schemaJson}), then run: ${process.argv[1]} link`);
}

function validateJson() {
  const require = createRequire(import.meta.url);
  const Ajv2020 = require("ajv/dist/2020").default;
  const addFormats = require("ajv-formats").default;

  const schema = JSON.parse(readFileSync(schemaJson, "utf8"));
  const data = JSON.parse(readFileSync(dataJson, "utf8"));

  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  const validate = ajv.compile(schema);

  if (!validate(data)) {
    console.error("Schema validation failed:");
    for (const error of validate.errors ?? []) {
      console.error(`- ${error.instancePath || "/"} ${error.message ?? ""}`.trim());
    }
    process.exit(1);
  }

  const points = [
    ...data.highlights,
    ...data.sections.flatMap((section: { points: unknown[] }) => section.points),
  ];
  for (const point of points) {
    const { time, seconds } = point as { time: string; seconds: number };
    const match = /^(\d{2}):(\d{2}):(\d{2})$/.exec(time);
    if (!match) throw new Error(`Invalid timestamp: ${time}`);
    const expected = Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]);
    if (seconds !== expected) {
      throw new Error(`Timestamp mismatch for ${time}: expected ${expected}, got ${seconds}`);
    }
  }

  console.log(`valid: ${dataJson}`);
}

function openUrl(url: string) {
  const command = process.platform === "darwin" ? "open" : "xdg-open";
  const child = spawn(command, [url], { detached: true, stdio: "ignore" });
  child.on("error", () => undefined);
  child.unref();
}

async function linkRecap() {
  validateJson();
  const link = await buildPreviewLink(appUrl, JSON.parse(readFileSync(dataJson, "utf8")));
  writeFileSync(linkOut, `${link}\n`);
  if (!process.env.RECAP_NO_OPEN) openUrl(link);
  console.log(link);
}

async function main() {
  const [command, arg] = process.argv.slice(2);
  switch (command) {
    case "fetch":
      await fetchTranscript(arg);
      break;
    case "generate-json-stub":
      await generateJsonStub();
      break;
    case "validate":
      validateJson();
      break;
    case "link":
      await linkRecap();
      break;
    default:
      usage();
      process.exit(1);
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
