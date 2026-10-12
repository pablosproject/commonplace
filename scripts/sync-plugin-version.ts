import { readFileSync, writeFileSync } from "node:fs";
import { format } from "prettier";

type SkillMetadata = {
  version: string;
};

const skillMetadata = JSON.parse(
  readFileSync("skills/commonplace-youtube-recap/skill.json", "utf8"),
) as SkillMetadata;

const skillVersion = skillMetadata.version;

if (!/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(skillVersion)) {
  throw new Error(
    `Expected skills/commonplace-youtube-recap/skill.json to contain a semver version, got ${JSON.stringify(skillVersion)}`,
  );
}

const files = [
  {
    path: ".claude-plugin/plugin.json",
    update: (value: Record<string, unknown>) => {
      value.version = skillVersion;
    },
  },
  {
    path: "plugin.json",
    update: (value: Record<string, unknown>) => {
      value.version = skillVersion;
    },
  },
  {
    path: ".github/plugin/marketplace.json",
    update: (value: Record<string, unknown>) => {
      const metadata = value.metadata as Record<string, unknown>;
      metadata.version = skillVersion;

      const plugins = value.plugins as Array<Record<string, unknown>>;
      for (const plugin of plugins) {
        plugin.version = skillVersion;
      }
    },
  },
];

for (const file of files) {
  const value = JSON.parse(readFileSync(file.path, "utf8")) as Record<
    string,
    unknown
  >;

  file.update(value);
  const json = await format(JSON.stringify(value), {
    parser: "json",
  });
  writeFileSync(file.path, json);
}
