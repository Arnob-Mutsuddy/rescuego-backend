// src/config/env.ts
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const config = {
  // Server
  node_env: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "5000", 10),
  app_url: process.env.APP_URL || "http://localhost:5000",

  // Database
  database_url: process.env.DATABASE_URL!,

  // JWT
  jwt_secret: process.env.JWT_SECRET!,
  jwt_expire: process.env.JWT_EXPIRE || "7d",

  // Bcrypt
  bcrypt_salt_rounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || "10", 10),

  // Stripe
  stripe_secret_key: process.env.STRIPE_SECRET_KEY!,
  stripe_publishable_key: process.env.STRIPE_PUBLISHABLE_KEY!,
  stripe_webhook_secret: process.env.STRIPE_WEBHOOK_SECRET!,

  // bKash (Test/Sandbox)
  bkash_sandbox_app_key: process.env.BKASH_SANDBOX_APP_KEY!,
  bkash_sandbox_app_secret: process.env.BKASH_SANDBOX_APP_SECRET!,
  bkash_sandbox_username: process.env.BKASH_SANDBOX_USERNAME!,
  bkash_sandbox_password: process.env.BKASH_SANDBOX_PASSWORD!,

  // Email (Optional)
  email_host: process.env.EMAIL_HOST,
  email_port: parseInt(process.env.EMAIL_PORT || "587", 10),
  email_user: process.env.EMAIL_USER,
  email_pass: process.env.EMAIL_PASS,

  // CORS
  cors_origin: process.env.CORS_ORIGIN || "http://localhost:3000",
};

export default config;