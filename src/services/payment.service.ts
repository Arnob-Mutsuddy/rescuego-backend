
import stripe from "../config/stripe.js";
import prisma from "../config/database.js";
import { AppError } from "../middleware/errorHandler.js";
import { HTTP_STATUS } from "../config/constants.js";
import config from "../config/env.js";

export class PaymentService {

  async createCheckoutSession(patientId: string, emergencyRequestId: string) {
    // Emergency request check
    const emergencyRequest = await prisma.emergencyRequest.findFirst({
      where: {
        id: emergencyRequestId,
        patientId,
      },
      include: {
        payment: true,
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
        "Payment can only be made for completed trips",
        HTTP_STATUS.BAD_REQUEST
      );
    }

    if (emergencyRequest.payment) {
      throw new AppError(
        "Payment already exists for this request",
        HTTP_STATUS.CONFLICT
      );
    }

    const amount = emergencyRequest.estimatedCost || 500; 


    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Emergency Ambulance Service - ${emergencyRequest.emergencyType}`,
              description: `Trip on ${emergencyRequest.createdAt.toDateString()}`,
            },
            unit_amount: Math.round(amount * 100), // Stripe uses cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${config.app_url}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${config.app_url}/payment/cancel`,
      metadata: {
        emergencyRequestId,
        patientId,
      },
    });

    const payment = await prisma.payment.create({
      data: {
        patientId,
        emergencyRequestId,
        amount,
        currency: "USD",
        status: "PENDING",
        stripeSessionId: session.id,
        description: `Emergency ambulance service - ${emergencyRequest.emergencyType}`,
      },
    });

    return {
      payment,
      checkoutUrl: session.url,
      sessionId: session.id,
    };
  }


  async handleWebhook(signature: string, payload: Buffer) {
    let event: any;

    try {
      event = stripe.webhooks.constructEvent(
        payload,
        signature,
        config.stripe_webhook_secret
      );
    } catch (err: any) {
      throw new AppError(
        `Webhook signature verification failed: ${err.message}`,
        HTTP_STATUS.BAD_REQUEST
      );
    }

    // Handle checkout.session.completed
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      await this.confirmPayment(session.id, session.payment_intent);
    }

    // Handle checkout.session.expired
    if (event.type === "checkout.session.expired") {
      const session = event.data.object;
      await this.failPayment(session.id);
    }

    return { received: true };
  }

  
  async confirmPayment(sessionId: string, paymentIntentId: string) {
    const payment = await prisma.payment.findFirst({
      where: { stripeSessionId: sessionId },
    });

    if (!payment) {
      console.error(`Payment not found for session: ${sessionId}`);
      return;
    }

    const updated = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "SUCCESS",
        stripePaymentIntentId: paymentIntentId,
      },
    });

    return updated;
  }


  async failPayment(sessionId: string) {
    const payment = await prisma.payment.findFirst({
      where: { stripeSessionId: sessionId },
    });

    if (!payment) {
      return;
    }

    const updated = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "FAILED",
      },
    });

    return updated;
  }

  
  async getPaymentStatus(patientId: string, paymentId: string) {
    const payment = await prisma.payment.findFirst({
      where: {
        id: paymentId,
        patientId,
      },
      include: {
        emergencyRequest: {
          select: {
            emergencyType: true,
            severity: true,
            status: true,
          },
        },
      },
    });

    if (!payment) {
      throw new AppError("Payment not found", HTTP_STATUS.NOT_FOUND);
    }

    return payment;
  }


  async getPaymentHistory(
    patientId: string,
    options: { page?: number; limit?: number } = {}
  ) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(options.limit || 10, 50);
    const skip = (page - 1) * limit;

    const payments = await prisma.payment.findMany({
      where: { patientId },
      include: {
        emergencyRequest: {
          select: {
            emergencyType: true,
            severity: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    const total = await prisma.payment.count({ where: { patientId } });

    return {
      data: payments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getAllPayments(
    options: {
      page?: number;
      limit?: number;
      status?: string;
    } = {}
  ) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(options.limit || 10, 50);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (options.status) {
      where.status = options.status;
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        patient: {
          include: {
            user: {
              select: { fullName: true, phone: true },
            },
          },
        },
        emergencyRequest: {
          select: {
            emergencyType: true,
            severity: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    const total = await prisma.payment.count({ where });

    return {
      data: payments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }
}