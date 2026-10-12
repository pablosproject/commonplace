import { readFileSync, writeFileSync } from "node:fs";

const releaseTypes = ["patch", "minor", "major"] as const;
type ReleaseType = (typeof releaseTypes)[number];

type SkillMetadata = {
  version: string;
};

const releaseType = process.argv[2] as ReleaseType | undefined;

if (!releaseType || !releaseTypes.includes(releaseType)) {
  throw new Error(
    `Usage: tsx scripts/bump-skill-version.ts ${releaseTypes.join("|")}`,
  );
}

const metadataPath = "skills/commonplace-youtube-recap/skill.json";
const metadata = JSON.parse(
  readFileSync(metadataPath, "utf8"),
) as SkillMetadata;

const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(metadata.version);

if (!match) {
  throw new Error(
    `Expected ${metadataPath} to contain a stable semver version, got ${JSON.stringify(metadata.version)}`,
  );
}

const [, majorText, minorText, patchText] = match;
let major = Number(majorText);
let minor = Number(minorText);
let patch = Number(patchText);

if (releaseType === "major") {
  major += 1;
  minor = 0;
  patch = 0;
}

if (releaseType === "minor") {
  minor += 1;
  patch = 0;
}

if (releaseType === "patch") {
  patch += 1;
}

metadata.version = `${major}.${minor}.${patch}`;
writeFileSync(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`);

console.log(`Bumped commonplace-youtube-recap to ${metadata.version}`);
