// src/controllers/dispatch.controller.ts
import { Request, Response, NextFunction } from "express";
import { DispatchService } from "../services/dispatch.service.js";
import { HTTP_STATUS } from "../config/constants.js";
import prisma from "../config/database.js";
import { z } from "zod";

const dispatchService = new DispatchService();

const findNearestSchema = z.object({
  patientLat: z.number().min(-90).max(90),
  patientLng: z.number().min(-180).max(180),
  limit: z.number().min(1).max(10).optional(),
});
const findNearestForEmergencySchema = z.object({
  emergencyRequestId: z.string(),
  limit: z.number().min(1).max(10).optional(),
});

// const assignEmergencySchema = z.object({
//   emergencyRequestId: z.string(),
//   driverId: z.string(),
//   patientLat: z.number().min(-90).max(90),
//   patientLng: z.number().min(-180).max(180),
//   hospitalId: z.string(),
// });
const assignEmergencySchema = z.object({
  emergencyRequestId: z.string(),
  driverId: z.string(),
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


  async findNearestForEmergency(req: Request, res: Response, next: NextFunction) {
  try {
    const validated = findNearestForEmergencySchema.parse(req.body);

    const result = await dispatchService.findNearestForEmergency(
      validated.emergencyRequestId,
      validated.limit || 5
    );

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Nearest ambulances found",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
  

  // async assignEmergency(req: Request, res: Response, next: NextFunction) {
  //   try {
  //     const validated = assignEmergencySchema.parse(req.body);

  //     const assigned = await dispatchService.assignEmergency(
  //       validated.emergencyRequestId,
  //       validated.driverId,
  //       validated.patientLat,
  //       validated.patientLng,
  //       validated.hospitalId
  //     );

  //     res.status(HTTP_STATUS.OK).json({
  //       success: true,
  //       message: "Emergency assigned to driver",
  //       data: assigned,
  //     });
  //   } catch (error) {
  //     next(error);
  //   }
  // }
  async assignEmergency(req: Request, res: Response, next: NextFunction) {
  try {
    const validated = assignEmergencySchema.parse(req.body);

    const assigned = await dispatchService.assignEmergency(
      validated.emergencyRequestId,
      validated.driverId,
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

  async acceptDispatch(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      const validated = acceptDispatchSchema.parse(req.body);

      const driver = await prisma.driver.findUnique({
        where: { userId },
      });

      if (!driver) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: "Driver not found",
        });
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

  async rejectDispatch(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      const validated = rejectDispatchSchema.parse(req.body);

      const driver = await prisma.driver.findUnique({
        where: { userId },
      });

      if (!driver) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: "Driver not found",
        });
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

  async updateTripStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      const validated = updateTripStatusSchema.parse(req.body);

      const driver = await prisma.driver.findUnique({
        where: { userId },
      });

      if (!driver) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: "Driver not found",
        });
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