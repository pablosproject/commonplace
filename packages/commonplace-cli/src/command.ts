import { encodePreview } from "@commonplace/video-util";
import { validateRecap } from "./recap.js";
import { generateJsonStub } from "./recap-stub.js";
import {
  defaultDataJson,
  defaultLinkOut,
  recapPath,
  writePreviewUrl,
} from "./workspace.js";
import { fetchTranscript } from "./youtube-transcript.js";

const bin = "commonplace";
const defaultAppUrl = "https://commonplace.video/preview";

type CommandEnv = Record<string, string | undefined>;

export type CommandResult = {
  stdout?: string;
  stderr?: string;
  exitCode: number;
  openUrl?: string;
};

function usage(dataJson: string) {
  return `Commonplace: turn a YouTube video into a recap preview link.

Run from the per-video output directory. Recap files are read from and written
to the current directory.

Usage:
  ${bin} fetch 'https://www.youtube.com/watch?v=VIDEO_ID'
  ${bin} generate-json-stub
  ${bin} validate
  ${bin} encode
  ${bin} link
  ${bin} help

Commands:
  fetch                 download English subtitles and video info, write transcript.txt
  generate-json-stub    create ${dataJson} if missing
  validate              check ${dataJson} against the recap schema and its timestamps
  encode                validate, then print {"version","payload","hash"} as JSON
  link                  validate, then print, save and open the preview link

Environment:
  RECAP_APP_URL                 preview page the link points to (default: ${defaultAppUrl})
  RECAP_NO_OPEN                 set to any value to print the link without opening a browser
  RECAP_COOKIES_FROM_BROWSER    browser name for yt-dlp cookies, e.g. chrome
  DATA_JSON                     recap data file (default: video-recap-data.json)
  LINK_OUT                      file the link is saved to (default: preview_url.txt)`;
}

function readRecap(workDir: string, dataJson: string) {
  return validateRecap(recapPath(workDir, dataJson));
}

export async function runYoutubeRecapCommand(
  args: string[],
  env: CommandEnv,
  workDir = process.cwd(),
): Promise<CommandResult> {
  const appUrl = env.RECAP_APP_URL ?? defaultAppUrl;
  const dataJson = env.DATA_JSON ?? defaultDataJson;
  const linkOut = env.LINK_OUT ?? defaultLinkOut;
  const [command, arg] = args;

  switch (command) {
    case "fetch":
      if (!arg) throw new Error(`Usage: ${bin} fetch VIDEO_URL`);
      return {
        stdout: (await fetchTranscript(arg, workDir)).join("\n"),
        exitCode: 0,
      };
    case "generate-json-stub":
      return {
        stdout: (await generateJsonStub(dataJson, bin, workDir)).join("\n"),
        exitCode: 0,
      };
    case "validate":
      readRecap(workDir, dataJson);
      return { stdout: `valid: ${dataJson}`, exitCode: 0 };
    case "encode": {
      const encoded = await encodePreview(readRecap(workDir, dataJson));
      return {
        stdout: JSON.stringify(encoded, null, 2),
        exitCode: 0,
      };
    }
    case "link": {
      const encoded = await encodePreview(readRecap(workDir, dataJson));
      const link = `${appUrl}${encoded.hash}`;
      writePreviewUrl(workDir, linkOut, link);
      return {
        stdout: link,
        exitCode: 0,
        openUrl: env.RECAP_NO_OPEN ? undefined : link,
      };
    }
    case "help":
    case "--help":
    case "-h":
      return { stdout: usage(dataJson), exitCode: 0 };
    default:
      return { stderr: usage(dataJson), exitCode: 1 };
  }
}
