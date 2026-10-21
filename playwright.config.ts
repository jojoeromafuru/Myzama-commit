import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser",
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:3100",
    launchOptions: {
      executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
      args: ["--no-sandbox"],
    },
  },
  webServer: {
    command: "npm run start -- --hostname 127.0.0.1 --port 3100",
    port: 3100,
    reuseExistingServer: false,
    env: {
      CAMPAIGNHQ_DATA_DIR: mkdtempSync(join(tmpdir(), "campaignhq-e2e-")),
    },
  },
});
