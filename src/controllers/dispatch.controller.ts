// src/controllers/dispatch.controller.ts
import { Request, Response, NextFunction } from "express";
import { DispatchService } from "@/services/dispatch.service.js";
import { HTTP_STATUS } from "@/config/constants.js";
import { z } from "zod";

const dispatchService = new DispatchService();

// Validation schemas
const findNearestSchema = z.object({
  patientLat: z.number().min(-90).max(90),
  patientLng: z.number().min(-180).max(180),
  limit: z.number().min(1).max(10).optional(),
});

const assignEmergencySchema = z.object({
  emergencyRequestId: z.string(),
  driverId: z.string(),
  patientLat: z.number().min(-90).max(90),
  patientLng: z.number().min(-180).max(180),
  hospitalId: z.string(),
});

const acceptDispatchSchema = z.object({
  emergencyRequestId: z.string(),
});

const rejectDispatchSchema = z.object({
  emergencyRequestId: z.string(),
});

const updateTripStatusSchema = z.object({
  tripId: z.string(),
  status: z.enum(["EN_ROUTE", "ARRIVED", "PATIENT_PICKED_UP", "AT_HOSPITAL", "COMPLETED"]),
});

export class DispatchController {
  /**
   * to find nearest ambulances
   */
  async findNearestAmbulances(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = findNearestSchema.parse(req.body);

      const ambulances = await dispatchService.findNearestAmbulances(
        validated.patientLat,
        validated.patientLng,
        validated.limit || 5
      );

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Nearest ambulances found",
        data: ambulances,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Emergency request driver assign
   */
  async assignEmergency(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = assignEmergencySchema.parse(req.body);

      const assigned = await dispatchService.assignEmergency(
        validated.emergencyRequestId,
        validated.driverId,
        validated.patientLat,
        validated.patientLng,
        validated.hospitalId
      );

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Emergency assigned to driver",
        data: assigned,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Driver dispatch accept
   */
  async acceptDispatch(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      const validated = acceptDispatchSchema.parse(req.body);

      // Get driver ID
      const driver = await require("@prisma/client").PrismaClient().driver.findUnique({
        where: { userId },
      });

      if (!driver) {
        throw new Error("Driver not found");
      }

      const result = await dispatchService.acceptDispatch(
        validated.emergencyRequestId,
        driver.id
      );

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Dispatch accepted",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Driver dispatch reject
   */
  async rejectDispatch(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      const validated = rejectDispatchSchema.parse(req.body);

      // Get driver ID
      const prisma = require("@prisma/client").PrismaClient;
      const driver = await new prisma().driver.findUnique({
        where: { userId },
      });

      if (!driver) {
        throw new Error("Driver not found");
      }

      const result = await dispatchService.rejectDispatch(
        validated.emergencyRequestId,
        driver.id
      );

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Dispatch rejected",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
Trip status update
   */
  async updateTripStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      const validated = updateTripStatusSchema.parse(req.body);

      // Get driver ID
      const prisma = require("@prisma/client").PrismaClient;
      const driver = await new prisma().driver.findUnique({
        where: { userId },
      });

      if (!driver) {
        throw new Error("Driver not found");
      }

      const result = await dispatchService.updateTripStatus(
        validated.tripId,
        validated.status,
        driver.id
      );

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: `Trip status updated to ${validated.status}`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}