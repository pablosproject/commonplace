import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import wyw from "@wyw-in-js/vite";

export default defineConfig({
  plugins: [wyw({ include: ["**/*.{ts,tsx}"] }), react()],
  test: {
    fsModuleCache: false,
  },
  server: {
    port: 5173,
  },
});
