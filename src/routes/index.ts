// src/routes/index.ts
import { Router } from "express";

const router = Router();


const apiV1 = "/api/v1";


router.get(`${apiV1}/health`, (req, res) => {
  res.json({
    success: true,
    message: "RESCUEGO API is running",
    timestamp: new Date().toISOString(),
  });
});



export default router;