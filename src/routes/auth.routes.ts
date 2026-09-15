
import { Router } from "express";

import { authenticate } from "../middleware/auth.middleware.js";
import { AuthController } from "@/controllers/auth.controller.js";

const router = Router();
const authController = new AuthController();

router.post("/register", (req, res, next) =>
  authController.register(req, res, next)
);

router.post("/login", (req, res, next) =>
  authController.login(req, res, next)
);

router.get("/me", authenticate, (req, res, next) =>
  authController.getMe(req, res, next)
);

export default router;