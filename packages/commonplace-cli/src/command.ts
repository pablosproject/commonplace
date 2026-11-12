import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { encodePreview } from "@commonplace/video-util";
import { LanguageUtils } from "typesbcp47";
import { generateJsonStub, getRecap } from "./recap.js";
import { createShortLink } from "./short-link.js";
import { fetchTranscript } from "./youtube-transcript.js";

const bin = "commonplace";
const defaultAppUrl = "https://commonplace.video/preview";
const defaultShareUrl = "https://commonplace.video";
const defaultDataJson = "video-recap-data.json";
const defaultLinkOut = "preview_url.txt";
const ttlUnitSeconds: Record<string, number> = {
  h: 60 * 60, // 1 hour
  d: 24 * 60 * 60, // 1 day
  y: 365 * 24 * 60 * 60, // 1 year
};

type CommandEnv = Record<string, string | undefined>;

export type CommandResult = {
  stdout?: string;
  stderr?: string;
  exitCode: number;
  openUrl?: string;
};

function usage(dataJson: string) {
  return `Commonplace: turn a YouTube video into a recap share link.

Run from the per-video output directory. Recap files are read from and written
to the current directory.

Usage:
  ${bin} fetch 'https://www.youtube.com/watch?v=VIDEO_ID' [--language CODE]
  ${bin} generate-json-stub
  ${bin} validate
  ${bin} encode
  ${bin} link [--ttl DURATION] [--public]
  ${bin} help

Commands:
  fetch                 download subtitles and video info, write transcript.txt
  generate-json-stub    create ${dataJson} if missing
  validate              check ${dataJson} against the recap schema and its timestamps
  encode                validate, then print {"version","payload","hash"} as JSON
  link                  validate, encrypt and upload the recap, then print the
                        share and manage links, save the share link and open
                        the manage link

Options:
  --language CODE       BCP 47 language tag (ISO 639 code), e.g. it or pt-BR
  --ttl DURATION        share link lifetime: a number followed by h, d or y,
                        e.g. 1h, 7d or 2y (default: 15d, at most 2y)
  --public              print the long preview link instead: unencrypted,
                        not uploaded, never expires

Environment:
  RECAP_SHARE_URL               short-link service (default: ${defaultShareUrl})
  RECAP_APP_URL                 preview page for --public links (default: ${defaultAppUrl})
  RECAP_NO_OPEN                 set to any value to not open a browser
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

function parseLinkArgs(args: string[]) {
  const { values } = parseArgs({
    args,
    options: {
      public: { type: "boolean" },
      ttl: { type: "string" },
    },
  });

  const match = values.ttl ? /^([1-9]\d*)([hdy])$/.exec(values.ttl) : null;

  if (values.ttl && !match) {
    throw new Error(
      `Invalid --ttl: ${values.ttl}. Use a number followed by h, d or y, such as 1h, 7d or 2y.`,
    );
  }

  return {
    public: values.public,
    ttlSeconds: match ? Number(match[1]) * ttlUnitSeconds[match[2]] : undefined,
  };
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
      const linkArgs = parseLinkArgs(commandArgs);
      const recap = getRecap({ workDir, dataJson });

      let saved: string;
      let stdout: string;
      let open: string;

      if (linkArgs.public) {
        saved = `${appUrl}${(await encodePreview(recap)).hash}`;
        stdout = saved;
        open = saved;
      } else {
        const link = await createShortLink({
          recap,
          shareUrl: env.RECAP_SHARE_URL ?? defaultShareUrl,
          ttlSeconds: linkArgs.ttlSeconds,
        });
        saved = link.shareUrl;
        stdout = `Share link: ${link.shareUrl}\nManage link (private): ${link.manageUrl}\nExpires: ${link.expiresAt.slice(0, 10)}`;
        open = link.manageUrl;
      }

      writeFileSync(join(workDir, linkOut), `${saved}\n`);
      return {
        stdout,
        exitCode: 0,
        openUrl: env.RECAP_NO_OPEN ? undefined : open,
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
