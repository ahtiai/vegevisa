import { defineConfig } from "@playwright/test";
import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";
export default defineConfig({
  testDir: "tests/e2e",
  workers: 1,
  timeout: 60000,
  use: { baseURL: "http://localhost:3107", trace: "retain-on-failure" },
  webServer: {
    command: "npm run dev -- --port 3107",
    env: {
      ...parseEnv(readFileSync(".env.e2e.local", "utf8")),
      VERCEL: "",
      VERCEL_URL: "",
    },
    url: "http://localhost:3107",
    reuseExistingServer: false,
    timeout: 120000,
  },
});
