
import { Request, Response, NextFunction } from "express";

interface CustomError extends Error {
  status?: number;
  errors?: any[];
}

export const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const status = err.status || 500;
  const message = err.message || "Internal Server Error";
  const errors = err.errors || [];

  console.error(`[ERROR] ${status} - ${message}`);

  res.status(status).json({
    success: false,
    message,
    errors,
    timestamp: new Date().toISOString(),
  });
};

export class AppError extends Error {
  constructor(
    public message: string,
    public status: number,
    public errors?: any[]
  ) {
    super(message);
  }
}