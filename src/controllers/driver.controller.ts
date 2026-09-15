
import { Request, Response, NextFunction } from "express";
import { DriverService } from "../services/driver.service.js";
import { HTTP_STATUS } from "../config/constants.js";
import { z } from "zod";

const driverService = new DriverService();

const updateProfileSchema = z.object({
  fullName: z.string().min(3).optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
  avatar: z.string().url().optional(),
  licenseNumber: z.string().min(5).optional(),
  licenseExpiry: z.string().datetime().optional(),
  yearsOfExperience: z.number().min(0).optional(),
  certification: z.string().optional(),
});

const locationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().optional(),
});

const registerAmbulanceSchema = z.object({
  registrationNo: z.string().min(3),
  ambulanceType: z.string().min(1),
  capacity: z.number().min(1),
  manufacturingYear: z.number().optional(),
  equipment: z.array(z.string()).optional(),
});

export class DriverController {
  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      const driver = await driverService.getProfile(userId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Driver profile fetched successfully",
        data: driver,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      const validated = updateProfileSchema.parse(req.body);

      const data = {
        ...validated,
        licenseExpiry: validated.licenseExpiry
          ? new Date(validated.licenseExpiry)
          : undefined,
      };

      const updated = await driverService.updateProfile(userId, data);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Profile updated successfully",
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  async startDuty(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      const validated = locationSchema.parse(req.body);

      const driver = await driverService.startDuty(
        userId,
        validated.latitude,
        validated.longitude,
        validated.accuracy
      );

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Duty started successfully",
        data: driver,
      });
    } catch (error) {
      next(error);
    }
  }

  async stopDuty(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      const driver = await driverService.stopDuty(userId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Duty stopped successfully",
        data: driver,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateLocation(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      const validated = locationSchema.parse(req.body);

      const location = await driverService.updateLocation(
        userId,
        validated.latitude,
        validated.longitude,
        validated.accuracy
      );

      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: "Location updated successfully",
        data: location,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCurrentLocation(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      const location = await driverService.getCurrentLocation(userId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Current location fetched successfully",
        data: location,
      });
    } catch (error) {
      next(error);
    }
  }

  async getLocationHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;

      const result = await driverService.getLocationHistory(userId, {
        page,
        limit,
      });

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Location history fetched successfully",
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  async registerAmbulance(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      const validated = registerAmbulanceSchema.parse(req.body);

      const ambulance = await driverService.registerAmbulance(userId, validated);

      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: "Ambulance registered successfully",
        data: ambulance,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAmbulances(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      const ambulances = await driverService.getAmbulances(userId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Ambulances fetched successfully",
        data: ambulances,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAssignedEmergencies(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      const emergencies = await driverService.getAssignedEmergencies(userId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Assigned emergencies fetched successfully",
        data: emergencies,
      });
    } catch (error) {
      next(error);
    }
  }

  async getTripHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await driverService.getTripHistory(userId, {
        page,
        limit,
      });

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Trip history fetched successfully",
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  async getStatistics(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      const stats = await driverService.getStatistics(userId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Statistics fetched successfully",
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
}