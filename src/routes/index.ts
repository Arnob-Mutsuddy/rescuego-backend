
import { Router } from "express";
import authRoutes from "./auth.routes.js";
import patientRoutes from "./patient.routes.js";
import driverRoutes from "./driver.routes.js";
import dispatchRoutes from "./dispatch.routes.js";
import paymentRoutes from "./payment.routes.js";
import adminRoutes from "./admin.routes.js";
import reviewRoutes from "./review.routes.js";

const router = Router();

const apiV1 = "/api/v1";

router.get(`${apiV1}/health`, (req, res) => {
  res.json({
    success: true,
    message: "RESCUEGO API is running",
    timestamp: new Date().toISOString(),
  });
});



router.use(`${apiV1}/auth`, authRoutes);


router.use(`${apiV1}/patient`, patientRoutes);


router.use(`${apiV1}/driver`, driverRoutes);

router.use(`${apiV1}/dispatch`, dispatchRoutes);

router.use(`${apiV1}/payments`, paymentRoutes);
router.use(`${apiV1}/admin`, adminRoutes);

router.use(`${apiV1}/reviews`, reviewRoutes);

export default router;