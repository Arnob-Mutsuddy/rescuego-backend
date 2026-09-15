// src/routes/patient.routes.ts
import { Router } from "express";

import { authenticate } from "../middleware/auth.middleware.js";
import { PatientController } from "@/controllers/patient.controller.js";

const router = Router();
const patientController = new PatientController();

router.use(authenticate);

router.get("/profile", (req, res, next) =>
  patientController.getProfile(req, res, next)
);

router.patch("/profile", (req, res, next) =>
  patientController.updateProfile(req, res, next)
);

router.post("/emergency/create", (req, res, next) =>
  patientController.createEmergency(req, res, next)
);

router.get("/emergency/list", (req, res, next) =>
  patientController.getEmergencies(req, res, next)
);

router.get("/emergency/:id", (req, res, next) =>
  patientController.getEmergency(req, res, next)
);

router.patch("/emergency/:id/cancel", (req, res, next) =>
  patientController.cancelEmergency(req, res, next)
);

router.get("/emergency/stats/summary", (req, res, next) =>
  patientController.getStats(req, res, next)
);

export default router;