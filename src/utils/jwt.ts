
import jwt, { type SignOptions } from "jsonwebtoken";
import config from "../config/env.js";
import { UserRole } from "../../prisma/generated/prisma/index.js";

interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export const generateToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, config.jwt_secret, {
    expiresIn: config.jwt_expire as SignOptions["expiresIn"],
  });
};

export const verifyToken = (token: string): JWTPayload | null => {
  try {
    const decoded = jwt.verify(
      token,
      config.jwt_secret
    ) as JWTPayload;

    return decoded;
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
};