
import { Router } from "express";
import { DispatchController } from "@/controllers/dispatch.controller.js";
import { authenticate, authorize } from "@/middleware/auth.middleware";


const router = Router();
const dispatchController = new DispatchController();

// ADMIN ROUTES

// Find nearest ambulances (Admin/Dispatcher initiates)
router.post(
  "/find-nearest",
  authenticate,
  authorize("ADMIN"),
  (req, res, next) => dispatchController.findNearestAmbulances(req, res, next)
);

// Assign emergency to driver
router.post(
  "/assign",
  authenticate,
  authorize("ADMIN"),
  (req, res, next) => dispatchController.assignEmergency(req, res, next)
);

// DRIVER ROUTES

// Accept dispatch
router.post(
  "/accept",
  authenticate,
  authorize("DRIVER"),
  (req, res, next) => dispatchController.acceptDispatch(req, res, next)
);

// Reject dispatch
router.post(
  "/reject",
  authenticate,
  authorize("DRIVER"),
  (req, res, next) => dispatchController.rejectDispatch(req, res, next)
);

// Update trip status
router.patch(
  "/trip-status",
  authenticate,
  authorize("DRIVER"),
  (req, res, next) => dispatchController.updateTripStatus(req, res, next)
);

export default router;