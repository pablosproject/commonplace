import { readFileSync } from "node:fs";

type SkillMetadata = {
  version: string;
};

const skillMetadata = JSON.parse(
  readFileSync("skills/commonplace-youtube-recap/skill.json", "utf8"),
) as SkillMetadata;

const expectedVersion = skillMetadata.version;

const checks = [
  {
    label: ".claude-plugin/plugin.json version",
    actual: () =>
      (
        JSON.parse(readFileSync(".claude-plugin/plugin.json", "utf8")) as {
          version: string;
        }
      ).version,
  },
  {
    label: "plugin.json version",
    actual: () =>
      (JSON.parse(readFileSync("plugin.json", "utf8")) as { version: string })
        .version,
  },
  {
    label: ".github/plugin/marketplace.json metadata.version",
    actual: () =>
      (
        JSON.parse(readFileSync(".github/plugin/marketplace.json", "utf8")) as {
          metadata: { version: string };
        }
      ).metadata.version,
  },
  {
    label: ".github/plugin/marketplace.json plugins[0].version",
    actual: () =>
      (
        JSON.parse(readFileSync(".github/plugin/marketplace.json", "utf8")) as {
          plugins: Array<{ version: string }>;
        }
      ).plugins[0]?.version,
  },
];

const failures = checks
  .map((check) => ({ label: check.label, actual: check.actual() }))
  .filter((check) => check.actual !== expectedVersion);

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(
      `${failure.label} is ${JSON.stringify(failure.actual)}, expected ${expectedVersion}`,
    );
  }
  console.error("Run: npm run plugins:sync-version");
  process.exit(1);
}
