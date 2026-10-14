import { parseArgs } from "node:util";
import { encodePreview } from "@commonplace/video-util";
import { LanguageUtils } from "typesbcp47";
import { createPreviewLink, generateJsonStub, getRecap } from "./recap.js";
import { fetchTranscript } from "./youtube-transcript.js";

const bin = "commonplace";
const defaultAppUrl = "https://commonplace.video/preview";
const defaultDataJson = "video-recap-data.json";
const defaultLinkOut = "preview_url.txt";

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
  ${bin} fetch 'https://www.youtube.com/watch?v=VIDEO_ID' [--language CODE]
  ${bin} generate-json-stub
  ${bin} validate
  ${bin} encode
  ${bin} link
  ${bin} help

Commands:
  fetch                 download subtitles and video info, write transcript.txt
  generate-json-stub    create ${dataJson} if missing
  validate              check ${dataJson} against the recap schema and its timestamps
  encode                validate, then print {"version","payload","hash"} as JSON
  link                  validate, then print, save and open the preview link

Options:
  --language CODE       BCP 47 language tag (ISO 639 code), e.g. it or pt-BR

Environment:
  RECAP_APP_URL                 preview page the link points to (default: ${defaultAppUrl})
  RECAP_NO_OPEN                 set to any value to print the link without opening a browser
  RECAP_COOKIES_FROM_BROWSER    browser name for yt-dlp cookies, e.g. chrome
  DATA_JSON                     recap data file (default: video-recap-data.json)
  LINK_OUT                      file the link is saved to (default: preview_url.txt)`;
}

export function parseFetchArgs(args: string[]) {
  const { positionals, values } = parseArgs({
    args,
    allowPositionals: true,
    options: {
      language: { type: "string" },
    },
  });
  const [url, extra] = positionals;

  if (!url || extra) {
    throw new Error(`Usage: ${bin} fetch VIDEO_URL [--language CODE]`);
  }

  let language = undefined;
  if (values.language) {
    language = LanguageUtils.normalizeCode(values.language);
    if (!language || !LanguageUtils.isValidLanguageTag(values.language)) {
      throw new Error(
        `Invalid language code: ${values.language}. Use an ISO language code such as en, it, pt-BR, or zh-Hans.`,
      );
    }
  }

  return { url, language };
}

export async function runYoutubeRecapCommand(
  args: string[],
  env: CommandEnv,
  workDir = process.cwd(),
): Promise<CommandResult> {
  const appUrl = env.RECAP_APP_URL ?? defaultAppUrl;
  const dataJson = env.DATA_JSON ?? defaultDataJson;
  const linkOut = env.LINK_OUT ?? defaultLinkOut;
  const [command, ...commandArgs] = args;

  switch (command) {
    case "fetch": {
      const { url, language } = parseFetchArgs(commandArgs);
      return {
        stdout: (
          await fetchTranscript.run({
            url,
            workDir,
            requestedLanguage: language,
            cookiesFromBrowser: env.RECAP_COOKIES_FROM_BROWSER,
          })
        ).join("\n"),
        exitCode: 0,
      };
    }
    case "generate-json-stub":
      return {
        stdout: generateJsonStub({ workDir, dataJson, bin }).join("\n"),
        exitCode: 0,
      };
    case "validate":
      getRecap({ workDir, dataJson });
      return { stdout: `valid: ${dataJson}`, exitCode: 0 };
    case "encode": {
      const encoded = await encodePreview(getRecap({ workDir, dataJson }));
      return {
        stdout: JSON.stringify(encoded, null, 2),
        exitCode: 0,
      };
    }
    case "link": {
      const link = await createPreviewLink({
        workDir,
        dataJson,
        appUrl,
        linkOut,
      });
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
