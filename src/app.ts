// src/app.ts
import express, { Express } from "express";
import cors from "cors";
import helmet from "helmet";

import corsOptions from "./config/cors.js";
import { logger } from "./middleware/logger.js";
import { errorHandler } from "./middleware/errorHandler.js";
import routes from "./routes/index.js";

const app: Express = express();

// SECURITY MIDDLEWARE
app.use(helmet());
app.use(cors(corsOptions));

// BODY PARSER
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// LOGGING
app.use(logger);

// HEALTH CHECK
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "RESCUEGO Backend API",
    version: "1.0.0",
    status: "Running",
  });
});

// ROUTES
app.use(routes);

// 404 HANDLER
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ERROR HANDLER
app.use(errorHandler);

export default app;