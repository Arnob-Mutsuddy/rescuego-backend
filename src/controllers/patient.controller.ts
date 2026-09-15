
import { Request, Response, NextFunction } from "express";
import { PatientService } from "../services/patient.service.js";
import { HTTP_STATUS } from "../config/constants.js";
import { z } from "zod";

const patientService = new PatientService();

const updateProfileSchema = z.object({
  fullName: z.string().min(3).optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
  avatar: z.string().url().optional(),
  dateOfBirth: z.string().datetime().optional(),
  bloodGroup: z.string().optional(),
  medicalHistory: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
});

const createEmergencySchema = z.object({
  emergencyType: z.string().min(1, "Emergency type is required"),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  patientLat: z.number().min(-90).max(90),
  patientLng: z.number().min(-180).max(180),
  patientAddress: z.string().optional(),
  accuracy: z.number().optional(),
  description: z.string().optional(),
});

export class PatientController {
  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      const patient = await patientService.getProfile(userId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Profile fetched successfully",
        data: patient,
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
        dateOfBirth: validated.dateOfBirth
          ? new Date(validated.dateOfBirth)
          : undefined,
      };

      const updated = await patientService.updateProfile(userId, data);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Profile updated successfully",
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  async createEmergency(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      const validated = createEmergencySchema.parse(req.body);

      const patient = await patientService.getProfile(userId);

      const emergency = await patientService.createEmergencyRequest(
        patient.id,
        validated
      );

      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: "Emergency request created successfully",
        data: emergency,
      });
    } catch (error) {
      next(error);
    }
  }

  async getEmergencies(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      const patient = await patientService.getProfile(userId);

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as string | undefined;
      const sortBy = req.query.sortBy as string | undefined;
      const sortOrder = (req.query.sortOrder as "asc" | "desc") || "desc";

      const result = await patientService.getEmergencyRequests(patient.id, {
        page,
        limit,
        status,
        sortBy,
        sortOrder,
      });

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Emergency requests fetched successfully",
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  async getEmergency(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      const { id } = req.params;
      const patient = await patientService.getProfile(userId);

      const emergency = await patientService.getEmergencyRequest(patient.id, id as string);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Emergency request fetched successfully",
        data: emergency,
      });
    } catch (error) {
      next(error);
    }
  }

  async cancelEmergency(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      const { id } = req.params;
      const patient = await patientService.getProfile(userId);

      const updated = await patientService.cancelEmergencyRequest(patient.id, id as string);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Emergency request cancelled successfully",
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      const patient = await patientService.getProfile(userId);

      const stats = await patientService.getEmergencyStats(patient.id);

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