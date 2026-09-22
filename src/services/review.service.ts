
import prisma from "../config/database.js";
import { AppError } from "../middleware/errorHandler.js";
import { HTTP_STATUS } from "../config/constants.js";

export class ReviewService {

  async createReview(
    patientId: string,
    data: {
      emergencyRequestId: string;
      driverId: string;
      rating: number;
      comment?: string;
      cleanliness?: number;
      professionalism?: number;
      communication?: number;
    }
  ) {
    const emergencyRequest = await prisma.emergencyRequest.findFirst({
      where: {
        id: data.emergencyRequestId,
        patientId,
      },
    });

    if (!emergencyRequest) {
      throw new AppError(
        "Emergency request not found",
        HTTP_STATUS.NOT_FOUND
      );
    }

    if (emergencyRequest.status !== "COMPLETED") {
      throw new AppError(
        "You can only review completed trips",
        HTTP_STATUS.BAD_REQUEST
      );
    }

    if (emergencyRequest.driverId !== data.driverId) {
      throw new AppError(
        "This driver was not assigned to this trip",
        HTTP_STATUS.BAD_REQUEST
      );
    }

    const existingReview = await prisma.review.findFirst({
      where: {
        patientId,
        driverId: data.driverId,
      },
    });


    const review = await prisma.review.create({
      data: {
        patientId,
        driverId: data.driverId,
        rating: data.rating,
        comment: data.comment,
        cleanliness: data.cleanliness,
        professionalism: data.professionalism,
        communication: data.communication,
      },
      include: {
        patient: {
          include: {
            user: { select: { fullName: true } },
          },
        },
        driver: {
          include: {
            user: { select: { fullName: true } },
          },
        },
      },
    });

    return review;
  }

  async getDriverReviews(
    driverId: string,
    options: { page?: number; limit?: number } = {}
  ) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(options.limit || 10, 50);
    const skip = (page - 1) * limit;

    const reviews = await prisma.review.findMany({
      where: { driverId },
      include: {
        patient: {
          include: {
            user: { select: { fullName: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    const total = await prisma.review.count({ where: { driverId } });

    const avgRating = await prisma.review.aggregate({
      where: { driverId },
      _avg: { rating: true },
    });

    return {
      data: reviews,
      averageRating: avgRating._avg.rating || 0,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getPatientReviews(
    patientId: string,
    options: { page?: number; limit?: number } = {}
  ) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(options.limit || 10, 50);
    const skip = (page - 1) * limit;

    const reviews = await prisma.review.findMany({
      where: { patientId },
      include: {
        driver: {
          include: {
            user: { select: { fullName: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    const total = await prisma.review.count({ where: { patientId } });

    return {
      data: reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async updateReview(
    reviewId: string,
    patientId: string,
    data: {
      rating?: number;
      comment?: string;
      cleanliness?: number;
      professionalism?: number;
      communication?: number;
    }
  ) {
    const review = await prisma.review.findFirst({
      where: { id: reviewId, patientId },
    });

    if (!review) {
      throw new AppError("Review not found", HTTP_STATUS.NOT_FOUND);
    }

    const updated = await prisma.review.update({
      where: { id: reviewId },
      data,
    });

    return updated;
  }

  async deleteReview(reviewId: string, patientId: string) {
    const review = await prisma.review.findFirst({
      where: { id: reviewId, patientId },
    });

    if (!review) {
      throw new AppError("Review not found", HTTP_STATUS.NOT_FOUND);
    }

    await prisma.review.delete({ where: { id: reviewId } });

    return { message: "Review deleted successfully" };
  }
}