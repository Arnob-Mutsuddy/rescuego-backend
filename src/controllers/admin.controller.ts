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

    
    async getDashboardStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await adminService.getDashboardStats();

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Dashboard statistics fetched successfully",
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }


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
    async toggleUserStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const adminUserId = (req as any).userId;
      const { id } = req.params;

      const updated = await adminService.toggleUserStatus(id as string, adminUserId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: `User ${updated.isActive ? "activated" : "deactivated"} successfully`,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }
    async getAllDrivers(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const isApproved =
        req.query.isApproved !== undefined
          ? req.query.isApproved === "true"
          : undefined;

      const result = await adminService.getAllDrivers({ page, limit, isApproved });

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Drivers fetched successfully",
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  async approveDriver(req: Request, res: Response, next: NextFunction) {
    try {
      const adminUserId = (req as any).userId;
      const { id } = req.params;

      const updated = await adminService.approveDriver(id as string, adminUserId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Driver approved successfully",
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

    async rejectDriver(req: Request, res: Response, next: NextFunction) {
    try {
      const adminUserId = (req as any).userId;
      const { id } = req.params;
      const { reason } = req.body;

      const updated = await adminService.rejectDriver(id as string, adminUserId, reason);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Driver rejected",
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  //hospital
    async createHospital(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = createHospitalSchema.parse(req.body);
      const hospital = await adminService.createHospital(validated);

      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: "Hospital created successfully",
        data: hospital,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllHospitals(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await adminService.getAllHospitals({ page, limit });

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Hospitals fetched successfully",
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateHospital(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const validated = updateHospitalSchema.parse(req.body);

      const updated = await adminService.updateHospital(id as string, validated);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Hospital updated successfully",
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteHospital(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await adminService.deleteHospital(id as string);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: result.message,
        data: null,
      });
    } catch (error) {
      next(error);
    }
  }





}