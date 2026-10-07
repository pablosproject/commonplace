import { defineConfig } from "tsup";

export default defineConfig({
  entry: { cli: "src/cli.ts" },
  format: "esm",
  outExtension: () => ({ js: ".mjs" }),
  platform: "node",
  target: "node20",
  noExternal: ["video-util"],
  esbuildOptions: (options) => {
    options.conditions = ["development"];
  },
  banner: { js: "#!/usr/bin/env node" },
  clean: true,
});
