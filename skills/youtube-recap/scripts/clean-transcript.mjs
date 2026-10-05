// Turns an .srt file into a compact transcript: one "[HH:MM:SS] text" line per cue.
// YouTube auto-captions "roll": each cue repeats the previous cue's line before
// adding a new one. Lines already shown in the previous cue are dropped, so every
// sentence appears once, stamped with the moment it first appeared.
//
// CLI: node clean-transcript.mjs <file.srt>  (prints to stdout)

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const TIMING = /^(\d{2}:\d{2}:\d{2})[,.]\d{3} --> /;

function parseCues(srt) {
  const lines = srt
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim());
  const cues = [];

  lines.forEach((line, index) => {
    const timing = TIMING.exec(line);
    if (timing) {
      cues.push({ time: timing[1], lines: [] });
      return;
    }
    const isCueNumber =
      /^\d+$/.test(line) && TIMING.test(lines[index + 1] ?? "");
    if (line && !isCueNumber && cues.length > 0) cues.at(-1).lines.push(line);
  });

  return cues.filter((cue) => cue.lines.length > 0);
}

export function cleanTranscript(srt) {
  const output = [];
  let previousLines = [];

  for (const cue of parseCues(srt)) {
    const newLines = cue.lines.filter((line) => !previousLines.includes(line));
    previousLines = cue.lines;
    if (newLines.length > 0) output.push(`[${cue.time}] ${newLines.join(" ")}`);
  }

  return output.length ? `${output.join("\n")}\n` : "";
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [, , srtPath] = process.argv;
  if (!srtPath) {
    console.error("Usage: node clean-transcript.mjs <file.srt>");
    process.exit(1);
  }
  process.stdout.write(cleanTranscript(readFileSync(srtPath, "utf8")));
}
