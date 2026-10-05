import { isDeepStrictEqual } from "node:util";
import { readFileSync, writeFileSync } from "node:fs";
import { z } from "zod";
import { recapSchema } from "../apps/api/src/schemas/recaps";

const outputPath = new URL(
  "../skills/youtube-recap/schemas/video-recap.schema.json",
  import.meta.url,
);

const schema = {
  ...z.toJSONSchema(recapSchema, { target: "draft-2020-12" }),
  title: "YouTube Video Recap Data",
  description:
    "Generated from apps/api/src/schemas/recaps.ts by `npm run schema:generate`. Do not edit by hand.",
};

if (process.argv.includes("--check")) {
  const committed = JSON.parse(readFileSync(outputPath, "utf8"));
  if (!isDeepStrictEqual(committed, schema)) {
    console.error(
      "skills/youtube-recap/schemas/video-recap.schema.json is out of date with the Zod recap schema. Run: npm run schema:generate",
    );
    process.exit(1);
  }
  console.log("recap JSON schema is up to date");
} else {
  writeFileSync(outputPath, `${JSON.stringify(schema, null, 2)}\n`);
  console.log(`wrote ${outputPath.pathname}`);
}
