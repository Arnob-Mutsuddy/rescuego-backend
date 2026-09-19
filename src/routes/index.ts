// src/routes/index.ts
import { Router } from "express";
import authRoutes from "./auth.routes.js";
import patientRoutes from "@/routes/patient.routes.js";
import driverRoutes from "@/routes/driver.routes.js";
import dispatchRoutes from "./dispatch.routes.js";
import paymentRoutes from "./payment.routes.js";
import adminRoutes from "./admin.routes.js";

const router = Router();

const apiV1 = "/api/v1";

// HEALTH CHECK

router.get(`${apiV1}/health`, (req, res) => {
  res.json({
    success: true,
    message: "RESCUEGO API is running",
    timestamp: new Date().toISOString(),
  });
});

// AUTH ROUTES

router.use(`${apiV1}/auth`, authRoutes);

// PATIENT ROUTES

router.use(`${apiV1}/patient`, patientRoutes);

// DRIVER ROUTES

router.use(`${apiV1}/driver`, driverRoutes);

router.use(`${apiV1}/dispatch`, dispatchRoutes);

router.use(`${apiV1}/payments`, paymentRoutes);
router.use(`${apiV1}/admin`, adminRoutes);

export default router;