
import { Request, Response, NextFunction } from "express";
import { ReviewService } from "../services/review.service.js";
import { HTTP_STATUS } from "../config/constants.js";
import prisma from "../config/database.js";
import { z } from "zod";

const reviewService = new ReviewService();

const createReviewSchema = z.object({
  emergencyRequestId: z.string(),
  driverId: z.string(),
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
  cleanliness: z.number().min(1).max(5).optional(),
  professionalism: z.number().min(1).max(5).optional(),
  communication: z.number().min(1).max(5).optional(),
});

const updateReviewSchema = z.object({
  rating: z.number().min(1).max(5).optional(),
  comment: z.string().optional(),
  cleanliness: z.number().min(1).max(5).optional(),
  professionalism: z.number().min(1).max(5).optional(),
  communication: z.number().min(1).max(5).optional(),
});

export class ReviewController {
  async createReview(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      const validated = createReviewSchema.parse(req.body);

      const patient = await prisma.patient.findUnique({ where: { userId } });

      if (!patient) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: "Patient profile not found",
        });
      }

      const review = await reviewService.createReview(patient.id, validated);

      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: "Review submitted successfully",
        data: review,
      });
    } catch (error) {
      next(error);
    }
  }

  async getDriverReviews(req: Request, res: Response, next: NextFunction) {
    try {
      const { driverId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await reviewService.getDriverReviews(driverId as string, {
        page,
        limit,
      });

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Driver reviews fetched successfully",
        data: result.data,
        averageRating: result.averageRating,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  async getMyReviews(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const patient = await prisma.patient.findUnique({ where: { userId } });

      if (!patient) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: "Patient profile not found",
        });
      }

      const result = await reviewService.getPatientReviews(patient.id, {
        page,
        limit,
      });

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Reviews fetched successfully",
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateReview(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      const { id } = req.params;
      const validated = updateReviewSchema.parse(req.body);

      const patient = await prisma.patient.findUnique({ where: { userId } });

      if (!patient) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: "Patient profile not found",
        });
      }

      const updated = await reviewService.updateReview(id as string, patient.id, validated);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Review updated successfully",
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteReview(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      const { id } = req.params;

      const patient = await prisma.patient.findUnique({ where: { userId } });

      if (!patient) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: "Patient profile not found",
        });
      }

      const result = await reviewService.deleteReview(id as string, patient.id);

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