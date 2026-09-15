
import { Request, Response, NextFunction } from "express";
import { PaymentService } from "../services/payment.service.js";
import { HTTP_STATUS } from "../config/constants.js";
import prisma from "../config/database.js";
import { z } from "zod";

const paymentService = new PaymentService();

const createCheckoutSchema = z.object({
  emergencyRequestId: z.string(),
});

export class PaymentController {

  async createCheckoutSession(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      const validated = createCheckoutSchema.parse(req.body);

      const patient = await prisma.patient.findUnique({
        where: { userId },
      });

      if (!patient) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: "Patient profile not found",
        });
      }

      const result = await paymentService.createCheckoutSession(
        patient.id,
        validated.emergencyRequestId
      );

      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: "Checkout session created",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }


  async handleWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      const signature = req.headers["stripe-signature"] as string;

      const result = await paymentService.handleWebhook(
        signature,
        req.body 
      );

      res.status(HTTP_STATUS.OK).json(result);
    } catch (error) {
      next(error);
    }
  }

  
  async getPaymentStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      const { id } = req.params;

      const patient = await prisma.patient.findUnique({
        where: { userId },
      });

      if (!patient) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: "Patient profile not found",
        });
      }

      const payment = await paymentService.getPaymentStatus(patient.id, id as string);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Payment status fetched",
        data: payment,
      });
    } catch (error) {
      next(error);
    }
  }


  async getPaymentHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const patient = await prisma.patient.findUnique({
        where: { userId },
      });

      if (!patient) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: "Patient profile not found",
        });
      }

      const result = await paymentService.getPaymentHistory(patient.id, {
        page,
        limit,
      });

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "Payment history fetched",
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }


  async getAllPayments(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as string | undefined;

      const result = await paymentService.getAllPayments({
        page,
        limit,
        status,
      });

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: "All payments fetched",
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }
}