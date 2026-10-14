import {
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, test } from "vitest";

import { TranscriptCatalog } from "../src/lib/transcript-catalog.js";
import { cleanTranscript } from "../src/lib/transcript-cleaner.js";
import { createTranscriptFetcher } from "../src/youtube-transcript.js";

test("keeps each caption line once, stamped with the cue where it first appears", () => {
  const rollingAutoCaptions = `1
00:00:01,570 --> 00:00:07,510

[Music]

2
00:00:07,510 --> 00:00:07,520
[Music]


3
00:00:07,520 --> 00:00:08,950
[Music]
this program is brought to you by

4
00:00:08,950 --> 00:00:08,960
this program is brought to you by


5
00:00:08,960 --> 00:00:11,870
this program is brought to you by
Stanford University please visit us at
`;

  expect(cleanTranscript(rollingAutoCaptions)).toBe(
    [
      "[00:00:01] [Music]",
      "[00:00:07] this program is brought to you by",
      "[00:00:08] Stanford University please visit us at",
    ].join("\n") + "\n",
  );
});

test("passes through one-line manual captions and joins multi-line cues", () => {
  const manualCaptions = `1
00:00:07,470 --> 00:00:10,369
This program is brought to you by Stanford University.

2
00:01:01,010 --> 00:01:03,894
I dropped out of Reed College
after the first 6 months,
`;

  expect(cleanTranscript(manualCaptions)).toBe(
    [
      "[00:00:07] This program is brought to you by Stanford University.",
      "[00:01:01] I dropped out of Reed College after the first 6 months,",
    ].join("\n") + "\n",
  );
});

test("handles CRLF line endings", () => {
  expect(
    cleanTranscript("1\r\n00:00:05,000 --> 00:00:06,000\r\nHello there\r\n"),
  ).toBe("[00:00:05] Hello there\n");
});

const workDirs: string[] = [];

afterEach(() => {
  for (const workDir of workDirs.splice(0)) {
    rmSync(workDir, { recursive: true, force: true });
  }
});

describe("transcript fetch workflow", () => {
  const srt = `1
00:00:05,000 --> 00:00:06,000
Hello there
`;

  test("discovers, downloads, cleans, and persists a transcript", async () => {
    const workDir = mkdtempSync(join(tmpdir(), "commonplace-transcript-"));
    workDirs.push(workDir);
    writeFileSync(join(workDir, "transcript.stale.srt"), "stale");
    writeFileSync(join(workDir, "transcript.txt"), "old transcript");

    const fetchTranscript = createTranscriptFetcher(
      async ({ flags, workDir: outputDir }) => {
        if (flags.print) {
          return JSON.stringify({
            id: "video-id",
            language: "it",
            subtitles: { it: [{ name: "Italian" }] },
          });
        }

        writeFileSync(join(outputDir, "transcript.it.srt"), srt);
        return "";
      },
    );

    const output = await fetchTranscript.run({
      url: "https://youtube.com/watch?v=video-id",
      workDir,
      requestedLanguage: "it",
    });

    expect(readFileSync(join(workDir, "transcript.txt"), "utf8")).toBe(
      "[00:00:05] Hello there\n",
    );
    expect(
      JSON.parse(readFileSync(join(workDir, "video-info.json"), "utf8")),
    ).toMatchObject({ id: "video-id", language: "it" });
    expect(readdirSync(workDir)).not.toContain("transcript.stale.srt");
    expect(output).toContain("language: it (Italian)");
  });

  test("cleans a failed download before trying the next track", async () => {
    const workDir = mkdtempSync(join(tmpdir(), "commonplace-transcript-"));
    workDirs.push(workDir);
    const attempts: string[] = [];

    const fetchTranscript = createTranscriptFetcher(
      async ({ flags, workDir: outputDir }) => {
        if (flags.print) {
          return JSON.stringify({
            language: "it",
            automatic_captions: {
              en: [{ name: "English" }],
              "it-orig": [{ name: "Italian (Original)" }],
            },
          });
        }

        const code = String(flags.subLangs).slice(1, -1);
        attempts.push(code);
        writeFileSync(join(outputDir, `transcript.${code}.srt`), srt);
        if (code === "en") throw new Error("English download failed");
        return "";
      },
    );

    const output = await fetchTranscript.run({
      url: "https://youtube.com/watch?v=video-id",
      workDir,
      requestedLanguage: "en",
    });

    expect(attempts).toEqual(["en", "it-orig"]);
    expect(readdirSync(workDir)).not.toContain("transcript.en.srt");
    expect(output).toContain("language: it-orig (Italian (Original))");
  });
});

describe("transcript language selection", () => {
  test("uses the original video language when none is requested", () => {
    const [track] = TranscriptCatalog.from({
      language: "it",
      automatic_captions: {
        "en-orig": [{ name: "English (Original)" }],
        it: [{ name: "Italian" }],
        "it-orig": [{ name: "Italian (Original)" }],
      },
    }).candidateTracks();

    expect(track).toMatchObject({
      code: "it-orig",
      source: "auto-generated captions",
    });
  });

  test("prefers uploaded subtitles in the requested language", () => {
    const [track] = TranscriptCatalog.from({
      language: "en",
      subtitles: { "pt-BR": [{ name: "Portuguese (Brazil)" }] },
      automatic_captions: {
        pt: [{ name: "Portuguese" }],
        "en-orig": [{ name: "English (Original)" }],
      },
    }).candidateTracks("pt");

    expect(track).toMatchObject({
      code: "pt-BR",
      source: "uploaded subtitles",
    });
  });

  test("falls back from an unavailable requested language to English", () => {
    const catalog = TranscriptCatalog.from({
      language: "it",
      automatic_captions: {
        en: [{ name: "English" }],
        "it-orig": [{ name: "Italian (Original)" }],
      },
    });
    const [track] = catalog.candidateTracks("de");

    expect(track.code).toBe("en");
  });

  test("keeps the original language as a download fallback", () => {
    const tracks = TranscriptCatalog.from({
      language: "it",
      automatic_captions: {
        en: [{ name: "English" }],
        "it-orig": [{ name: "Italian (Original)" }],
      },
    }).candidateTracks("en");

    expect(tracks.map(({ code }) => code)).toEqual(["en", "it-orig"]);
  });

  test("uses the original language when the request and English are unavailable", () => {
    const catalog = TranscriptCatalog.from({
      language: "it",
      automatic_captions: {
        "it-orig": [{ name: "Italian (Original)" }],
      },
    });
    const [track] = catalog.candidateTracks("de");

    expect(track.code).toBe("it-orig");
  });

  test("uses English when the original language cannot be identified", () => {
    const catalog = TranscriptCatalog.from({
      subtitles: { en: [{ name: "English" }] },
    });
    const [track] = catalog.candidateTracks();

    expect(track.code).toBe("en");
  });
});
