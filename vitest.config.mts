import "dotenv/config"; // loads .env locally; in CI the variables come from the workflow
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: ["tests/unit/**/*.test.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "integration",
          include: ["tests/integration/**/*.test.ts"],
          globalSetup: ["tests/integration/global-setup.ts"],
          setupFiles: ["tests/integration/setup.ts"],
          // Files share one database, so they must run one after another.
          fileParallelism: false,
          testTimeout: 30_000,
          hookTimeout: 60_000,
          // The app's DB client reads DATABASE_URL; point it at the test database.
          env: { DATABASE_URL: process.env.TEST_DATABASE_URL ?? "" },
        },
      },
    ],
  },
});
