
import prisma from "../config/database.js";
import { AppError } from "../middleware/errorHandler.js";
import { HTTP_STATUS } from "../config/constants.js";

export class PatientService {
  async getProfile(userId: string) {
    const patient = await prisma.patient.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
            avatar: true,
            createdAt: true,
          },
        },
      },
    });

    if (!patient) {
      throw new AppError("Patient profile not found", HTTP_STATUS.NOT_FOUND);
    }

    return patient;
  }

  async updateProfile(
    userId: string,
    data: {
      fullName?: string;
      phone?: string;
      avatar?: string;
      dateOfBirth?: Date;
      bloodGroup?: string;
      medicalHistory?: string;
      emergencyContactName?: string;
      emergencyContactPhone?: string;
    }
  ) {
    if (data.phone) {
      const existingPhone = await prisma.user.findFirst({
        where: {
          phone: data.phone,
          id: { not: userId },
        },
      });

      if (existingPhone) {
        throw new AppError(
          "Phone number already in use",
          HTTP_STATUS.CONFLICT
        );
      }
    }

    const updateUserData: any = {};
    if (data.fullName) updateUserData.fullName = data.fullName;
    if (data.phone) updateUserData.phone = data.phone;
    if (data.avatar) updateUserData.avatar = data.avatar;

    if (Object.keys(updateUserData).length > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: updateUserData,
      });
    }

    const updatePatientData: any = {};
    if (data.dateOfBirth) updatePatientData.dateOfBirth = data.dateOfBirth;

    if (data.bloodGroup) updatePatientData.bloodGroup = data.bloodGroup;

    if (data.medicalHistory) updatePatientData.medicalHistory = data.medicalHistory;
    if (data.emergencyContactName) updatePatientData.emergencyContactName = data.emergencyContactName;

    if (data.emergencyContactPhone) updatePatientData.emergencyContactPhone = data.emergencyContactPhone;

    const updatedPatient = await prisma.patient.update({
      where: { userId },
      data: updatePatientData,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
            avatar: true,
          },
        },
      },
    });

    return updatedPatient;
  }

  async createEmergencyRequest(
    patientId: string,
    data: {
      emergencyType: string;
      severity: string;
      patientLat: number;
      patientLng: number;
      patientAddress?: string;
      accuracy?: number;
      description?: string;
    }
  ) {
    if (data.patientLat < -90 || data.patientLat > 90) {
      throw new AppError(
        "Invalid latitude",
        HTTP_STATUS.BAD_REQUEST
      );
    }

    if (data.patientLng < -180 || data.patientLng > 180) {
      throw new AppError(
        "Invalid longitude",
        HTTP_STATUS.BAD_REQUEST
      );
    }

    const emergencyRequest = await prisma.emergencyRequest.create({
      data: {
        patientId,
        emergencyType: data.emergencyType,
        severity: data.severity,
        patientLat: data.patientLat,
        patientLng: data.patientLng,
        
        patientAddress: data.patientAddress,
        accuracy: data.accuracy,
        description: data.description,
        status: "PENDING",
      },
      include: {
        patient: {
          include: {
            user: {
              select: {
                fullName: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    return emergencyRequest;
  }

  async getEmergencyRequests(
    patientId: string,
    options: {
      page?: number;
      limit?: number;
      status?: string;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
    } = {}
  ) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(options.limit || 10, 50);
    const skip = (page - 1) * limit;
    const sortBy = options.sortBy || "createdAt";
    const sortOrder = options.sortOrder || "desc";

    const where: any = { patientId };
    if (options.status) {
      where.status = options.status;
    }

    const requests = await prisma.emergencyRequest.findMany({
      where,
      include: {
        driver: {
          select: {
            id: true,
            user: {
              select: { fullName: true, phone: true },
            },
          },
        },
        hospital: {
          select: { id: true, name: true, phone: true },
        },
        trip: {
          select: {
            id: true,
            distance: true,
            estimatedTime: true,
            actualTime: true,
          },
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    });

    const total = await prisma.emergencyRequest.count({ where });

    return {
      data: requests,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getEmergencyRequest(patientId: string, requestId: string) {
    const request = await prisma.emergencyRequest.findFirst({
      where: {
        id: requestId,
        patientId,
      },
      include: {
        patient: {
          include: {
            user: {
              select: { fullName: true, phone: true },
            },
          },
        },
        driver: {
          include: {
            user: {
              select: { fullName: true, phone: true },
            },
          },
        },
        hospital: true,
        trip: true,
        payment: true,
      },
    });

    if (!request) {
      throw new AppError(
        "Emergency request not found",
        HTTP_STATUS.NOT_FOUND
      );
    }

    return request;
  }

  async cancelEmergencyRequest(patientId: string, requestId: string) {
    const request = await prisma.emergencyRequest.findFirst({
      where: {
        id: requestId,
        patientId,
      },
    });

    if (!request) {
      throw new AppError(
        "Emergency request not found",
        HTTP_STATUS.NOT_FOUND
      );
    }

    if (!["PENDING", "ASSIGNED"].includes(request.status)) {
      throw new AppError(
        "Cannot cancel this request",
        HTTP_STATUS.BAD_REQUEST
      );
    }

    const updated = await prisma.emergencyRequest.update({
      where: { id: requestId },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
      },
      include: {
        driver: true,
      },
    });

    return updated;
  }

  async getEmergencyStats(patientId: string) {
    const stats = await prisma.emergencyRequest.groupBy({
      by: ["status"],
      where: { patientId },
      _count: true,
    });

    const formatted = stats.reduce(
      (acc, stat) => {
        acc[stat.status] = stat._count;
        return acc;
      },
      {} as Record<string, number>
    );

    return formatted;
  }
}