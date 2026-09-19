
import { Router } from "express";
import { PaymentController } from "../controllers/payment.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";

const router = Router();
const paymentController = new PaymentController();


router.post(
  "/checkout",
  authenticate,
  authorize("PATIENT"),
  (req, res, next) => paymentController.createCheckoutSession(req, res, next)
);

router.get(
  "/history",
  authenticate,
  authorize("PATIENT"),
  (req, res, next) => paymentController.getPaymentHistory(req, res, next)
);

router.get(
  "/:id",
  authenticate,
  authorize("PATIENT"),
  (req, res, next) => paymentController.getPaymentStatus(req, res, next)
);

router.get(
  "/",
  authenticate,
  authorize("ADMIN"),
  (req, res, next) => paymentController.getAllPayments(req, res, next)
);

export default router;