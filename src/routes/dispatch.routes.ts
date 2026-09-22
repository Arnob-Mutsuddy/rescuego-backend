
import { Router } from "express";
import { DispatchController } from "../controllers/dispatch.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";


const router = Router();
const dispatchController = new DispatchController();


router.post("/find-nearest", authenticate, authorize("ADMIN"), (req, res, next) => dispatchController.findNearestAmbulances(req, res, next));


router.post("/assign", authenticate,
  authorize("ADMIN"),
  (req, res, next) => dispatchController.assignEmergency(req, res, next)
);


router.post("/accept", authenticate, authorize("DRIVER"), (req, res, next) => dispatchController.acceptDispatch(req, res, next));


router.post("/reject", authenticate, authorize("DRIVER"), (req, res, next) => dispatchController.rejectDispatch(req, res, next));


router.patch("/trip-status", authenticate, authorize("DRIVER"), (req, res, next) => dispatchController.updateTripStatus(req, res, next));

export default router;