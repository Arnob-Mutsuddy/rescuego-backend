// src/config/database.ts

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../prisma/generated/prisma/index.js";
import config from "./env.js";

const adapter = new PrismaPg({
  connectionString: config.database_url,
});

const prisma = new PrismaClient({
  adapter,
  log:
    config.node_env === "development"
      ? ["query", "error", "warn"]
      : ["error"],
});

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

export default prisma;