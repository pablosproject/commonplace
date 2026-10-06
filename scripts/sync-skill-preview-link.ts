import { readFileSync, writeFileSync } from "node:fs";

const sourcePath = new URL(
  "../packages/video-util/src/encode.ts",
  import.meta.url,
);
const outputPath = new URL(
  "../skills/youtube-recap/scripts/preview-link.ts",
  import.meta.url,
);
const generated = `// Generated from packages/video-util/src/encode.ts. Do not edit by hand.\n\n${readFileSync(sourcePath, "utf8")}`;

if (process.argv.includes("--check")) {
  if (readFileSync(outputPath, "utf8") !== generated) {
    console.error(
      "skills/youtube-recap/scripts/preview-link.ts is out of date. Run: npm run skill:sync",
    );
    process.exit(1);
  }

  console.log("skill preview-link encoder is up to date");
} else {
  writeFileSync(outputPath, generated);
  console.log(`wrote ${outputPath.pathname}`);
}
