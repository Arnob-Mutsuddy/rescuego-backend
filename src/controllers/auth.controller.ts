// src/controllers/auth.controller.ts
import { Request, Response, NextFunction } from "express";
import { registerSchema, loginSchema } from "../utils/validation.js";
import { AuthService } from "../services/auth.service.js";
import { AppError } from "../middleware/errorHandler.js";
import { HTTP_STATUS } from "../config/constants.js";

const authService = new AuthService();

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = registerSchema.parse(req.body);
      const result = await authService.register(validatedData);

      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: "User registered successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = loginSchema.parse(req.body);
      const result = await authService.login(validatedData);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Login successful",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;

      if (!userId) {
        throw new AppError("Unauthorized", HTTP_STATUS.UNAUTHORIZED);
      }

      const user = await authService.getUserById(userId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "User fetched successfully",
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }
}