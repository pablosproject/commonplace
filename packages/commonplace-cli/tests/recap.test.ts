import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, expect, test } from "vitest";
import { runYoutubeRecapCommand } from "../src/command.js";

let workDir: string;

beforeEach(() => {
  workDir = mkdtempSync(join(tmpdir(), "commonplace-cli-"));
  writeFileSync(join(workDir, "transcript.txt"), "[00:00:01] Hello\n");
  writeFileSync(
    join(workDir, "video-info.json"),
    JSON.stringify({
      id: "UF8uR6Z6KLc",
      webpage_url: "https://www.youtube.com/watch?v=UF8uR6Z6KLc",
      title: "Steve Jobs' 2005 Stanford Commencement Address",
    }),
  );
});

afterEach(() => {
  rmSync(workDir, { recursive: true, force: true });
});

test("rejects a recap that still has stub placeholders", async () => {
  await runYoutubeRecapCommand(["generate-json-stub"], {}, workDir);

  await expect(
    runYoutubeRecapCommand(["validate"], {}, workDir),
  ).rejects.toThrow(/TODO placeholders[\s\S]*\/abstract/);
  await expect(
    runYoutubeRecapCommand(["link"], { RECAP_NO_OPEN: "1" }, workDir),
  ).rejects.toThrow(/TODO placeholders/);
});
