// src/app.ts
import express, { Express } from "express";
import cors from "cors";
import helmet from "helmet";

import corsOptions from "./config/cors.js";
import { logger } from "./middleware/logger.js";
import { errorHandler } from "./middleware/errorHandler.js";
import routes from "./routes/index.js";
import { PaymentController } from "./controllers/payment.controller.js";

const app: Express = express();
const paymentController = new PaymentController();

// SECURITY MIDDLEWARE
app.use(helmet());
app.use(cors(corsOptions));
app.post(
  "/api/v1/payments/webhook",
  express.raw({ type: "application/json" }),
  (req, res, next) => paymentController.handleWebhook(req, res, next)
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));


app.use(logger);


app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "RESCUEGO Backend API",
    version: "1.0.0",
    status: "Running",
  });
});

app.use(routes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

app.use(errorHandler);

export default app;