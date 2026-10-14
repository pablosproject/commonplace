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
