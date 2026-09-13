// src/types/index.ts
import { UserRole } from "../../prisma/generated/prisma";

export interface AuthRequest extends Express.Request {
  userId?: string;
  role?: UserRole;
  email?: string;
}

export interface APIResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any[];
}

export interface PaginationQuery {
  page?: string | number;
  limit?: string | number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}