// src/routes/index.ts
import { Router } from "express";


const router = Router();

const apiV1 = "/api/v1";

// HEALTH CHECK

router.get(`${apiV1}/health`, (req, res) => {
  res.json({
    success: true,
    message: "RESCUEGO API is running",
    timestamp: new Date().toISOString(),
  });
});

// AUTH ROUTES



// PLACEHOLDER ROUTES

export default router;