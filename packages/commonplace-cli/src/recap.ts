import { existsSync, readFileSync } from "node:fs";
import { safeParseRecap, type Recap } from "@commonplace/video-util";

export function validateRecap(dataPath: string): Recap {
  if (!existsSync(dataPath)) {
    throw new Error(
      `No recap data at ${dataPath}. Run: commonplace generate-json-stub`,
    );
  }

  let value: unknown;
  try {
    value = JSON.parse(readFileSync(dataPath, "utf8"));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid JSON in ${dataPath}: ${message}`);
  }

  const parsed = safeParseRecap(value);

  if (!parsed.success) {
    const details = parsed.error.issues.map((issue) => {
      const path = issue.path.length ? `/${issue.path.join("/")}` : "/";
      return `- ${path} ${issue.message}`;
    });
    throw new Error(["Schema validation failed:", ...details].join("\n"));
  }

  return parsed.data;
}
