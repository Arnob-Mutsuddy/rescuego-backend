// src/config/cors.ts
import { CorsOptions } from "cors";
import config from "./env.js";

const corsOptions: CorsOptions = {
  origin: config.cors_origin.split(","),
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 86400,
};

export default corsOptions;