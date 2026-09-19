import { Request, Response, NextFunction } from "express";
import { AdminService } from "../services/admin.service.js";
import { HTTP_STATUS } from "../config/constants.js";
import { z } from "zod";

const adminService = new AdminService();

const createHospitalSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(5),
  email: z.string().email().optional(),
  address: z.string().min(3),
  website: z.string().url().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  capacity: z.number().min(1),
  operatingHours: z.string().optional(),
});

const updateHospitalSchema = createHospitalSchema.partial();

export class AdminController {
      async getAllUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const role = req.query.role as string | undefined;
      const search = req.query.search as string | undefined;

      const result = await adminService.getAllUsers({ page, limit, role, search });

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Users fetched successfully",
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }




}