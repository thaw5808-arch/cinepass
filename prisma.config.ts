import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// Prisma 7: the CLI (generate, db push, studio, ...) no longer reads the
// connection URL from schema.prisma — it's configured here instead.
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
  migrations: {
    seed: "npx tsx prisma/seed.ts",
  },
});
