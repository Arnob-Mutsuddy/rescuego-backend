import { Router } from "express";
import { AdminController } from "../controllers/admin.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";

const router = Router();
const adminController = new AdminController();


router.use(authenticate, authorize("ADMIN"));

// router.get("/dashboard-stats", (req, res, next) =>
//   adminController.getDashboardStats(req, res, next)
// );

router.get("/users", (req, res, next) =>
  adminController.getAllUsers(req, res, next)
);  



export default router;