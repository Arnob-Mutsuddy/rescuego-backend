
import { Router } from "express";
import { ReviewController } from "../controllers/review.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";

const router = Router();
const reviewController = new ReviewController();

router.post(
  "/",
  authenticate,
  authorize("PATIENT"),
  (req, res, next) => reviewController.createReview(req, res, next)
);

router.get(
  "/my-reviews",
  authenticate,
  authorize("PATIENT"),
  (req, res, next) => reviewController.getMyReviews(req, res, next)
);

router.patch(
  "/:id",
  authenticate,
  authorize("PATIENT"),
  (req, res, next) => reviewController.updateReview(req, res, next)
);

router.delete(
  "/:id",
  authenticate,
  authorize("PATIENT"),
  (req, res, next) => reviewController.deleteReview(req, res, next)
);


router.get(
  "/driver/:driverId",
  authenticate,
  (req, res, next) => reviewController.getDriverReviews(req, res, next)
);

export default router;