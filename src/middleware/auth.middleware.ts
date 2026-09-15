
import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt.js";
import { AppError } from "./errorHandler.js";
import { HTTP_STATUS } from "../config/constants.js";
import { UserRole } from "../../prisma/generated/prisma/index.js";


declare global {
  namespace Express {
    interface Request {
      userId?: string;
      email?: string;
      role?: UserRole;
    }
  }
}

//(verify JWT)
export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError(
        "No token provided",
        HTTP_STATUS.UNAUTHORIZED,
        [{ message: "Authorization header missing or invalid format" }]
      );
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    if (!decoded) {
      throw new AppError(
        "Invalid or expired token",
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    req.userId = decoded.userId;
    req.email = decoded.email;
    req.role = decoded.role;

    next();
  } catch (error) {
    next(error);
  }
};

// (check roles)
export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const userRole = req.role;

      if (!userRole || !allowedRoles.includes(userRole)) {
        throw new AppError(
          "You do not have permission to access this resource",
          HTTP_STATUS.FORBIDDEN,
          [{ message: `Required roles: ${allowedRoles.join(", ")}` }]
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Optional auth
export const optionalAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);

      if (decoded) {
        req.userId = decoded.userId;
        req.email = decoded.email;
        req.role = decoded.role;
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};