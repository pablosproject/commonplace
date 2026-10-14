import youtubedl from "youtube-dl-exec";
import type { Flags } from "youtube-dl-exec";

export type YtDlpRequest = {
  url: string;
  flags: Flags;
  workDir: string;
  cookiesFromBrowser?: string;
};

export type YtDlpAdapter = (request: YtDlpRequest) => Promise<string>;

export const youtubeDlAdapter: YtDlpAdapter = async ({
  url,
  flags,
  workDir,
  cookiesFromBrowser,
}) => {
  try {
    const { stdout } = await youtubedl.exec(
      url,
      cookiesFromBrowser ? { ...flags, cookiesFromBrowser } : flags,
      { cwd: workDir },
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
    throw new Error(output.trim() || String(error));
  }
};
