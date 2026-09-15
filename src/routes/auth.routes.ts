
import { Router } from "express";

import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();
//AuthController();

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