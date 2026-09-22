
import { Router } from "express";

import { authenticate } from "../middleware/auth.middleware.js";
import { DriverController } from "../controllers/driver.controller.js";

const router = Router();
const driverController = new DriverController();

router.use(authenticate);

router.get("/profile", (req, res, next) =>
  driverController.getProfile(req, res, next)
);

router.patch("/profile", (req, res, next) =>
  driverController.updateProfile(req, res, next)
);

router.post("/duty/start", (req, res, next) =>
  driverController.startDuty(req, res, next)
);

router.post("/duty/stop", (req, res, next) =>
  driverController.stopDuty(req, res, next)
);

router.post("/location/update", (req, res, next) =>
  driverController.updateLocation(req, res, next)
);

router.get("/location/current", (req, res, next) =>
  driverController.getCurrentLocation(req, res, next)
);

router.get("/location/history", (req, res, next) =>
  driverController.getLocationHistory(req, res, next)
);

router.post("/ambulance/register", (req, res, next) =>
  driverController.registerAmbulance(req, res, next)
);

router.get("/ambulance/list", (req, res, next) =>
  driverController.getAmbulances(req, res, next)
);

router.get("/emergency/assigned", (req, res, next) =>
  driverController.getAssignedEmergencies(req, res, next)
);

router.get("/trip/history", (req, res, next) =>
  driverController.getTripHistory(req, res, next)
);

router.get("/statistics", (req, res, next) =>
  driverController.getStatistics(req, res, next)
);

export default router;