// src/server.ts
import "dotenv/config";
import config from "./config/env.js";
import app from "./app.js";
import prisma from "./config/database.js";

const startServer = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log("Database connected successfully");

    app.listen(config.port, () => {
      console.log(`\nRES CUEGO Backend Server running on ${config.app_url}`);
      console.log(`API Version: v1`);
      console.log(`Environment: ${config.node_env}\n`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();


process.on("SIGINT", async () => {
  console.log("\nShutting down gracefully...");
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n Shutting down gracefully...");
  await prisma.$disconnect();
  process.exit(0);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error(" Unhandled Rejection:", reason);
});

process.on("uncaughtException", (error) => {
  console.error(" Uncaught Exception:", error);
  process.exit(1);
});