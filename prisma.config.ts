import { defineConfig, env } from "prisma/config";
import * as dotenv from "dotenv";

dotenv.config({ path: "./.env" }); // явно указали путь

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
