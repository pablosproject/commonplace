import { spawn } from "node:child_process";
import { runYoutubeRecapCommand } from "./command.js";

function openUrl(url: string) {
  const command = process.platform === "darwin" ? "open" : "xdg-open";
  const child = spawn(command, [url], { detached: true, stdio: "ignore" });
  child.on("error", () => undefined);
  child.unref();
}

async function main() {
  const result = await runYoutubeRecapCommand(
    process.argv.slice(2),
    process.env,
    process.cwd(),
  );

  if (result.stdout) console.log(result.stdout);
  if (result.stderr) console.error(result.stderr);
  if (result.openUrl) openUrl(result.openUrl);
  process.exitCode = result.exitCode;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
