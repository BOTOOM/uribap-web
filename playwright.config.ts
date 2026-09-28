import { randomBytes } from "node:crypto";

import { defineConfig, devices } from "@playwright/test";

const standaloneServerCommand = [
  "mkdir -p .next/standalone/.next/static .next/standalone/public",
  "cp -R .next/static/. .next/standalone/.next/static/",
  "cp -R public/. .next/standalone/public/",
  "node .next/standalone/server.js",
].join(" && ");

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: "html",
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },
  webServer: {
    command: process.env.CI ? standaloneServerCommand : "pnpm dev",
    url: "http://127.0.0.1:3000/api/health",
    reuseExistingServer: !process.env.CI,
    env: {
      AUTH_SECRET: process.env.AUTH_SECRET ?? randomBytes(32).toString("base64url"),
      AUTH_TRUST_HOST: "true",
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
