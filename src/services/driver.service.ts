
import prisma from "../config/database.js";
import { AppError } from "../middleware/errorHandler.js";
import { HTTP_STATUS } from "../config/constants.js";

export class DriverService {
  async getProfile(userId: string) {
    const driver = await prisma.driver.findUnique({
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
        ambulances: {
          where: { deletedAt: null },
        },
      },
    });

    if (!driver) {
      throw new AppError("Driver profile not found", HTTP_STATUS.NOT_FOUND);
    }

    return driver;
  }

  async updateProfile(
    userId: string,
    data: {
      fullName?: string;
      phone?: string;
      avatar?: string;
      licenseNumber?: string;
      licenseExpiry?: Date;
      yearsOfExperience?: number;
      certification?: string;
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

    if (data.licenseNumber) {
      const driverRecord = await prisma.driver.findUnique({ where: { userId } });
      const existingLicense = await prisma.driver.findFirst({
        where: {
          licenseNumber: data.licenseNumber,
          id: { not: driverRecord?.id },
        },
      });

      if (existingLicense) {
        throw new AppError(
          "License number already registered",
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

    const updateDriverData: any = {};
    if (data.licenseNumber) updateDriverData.licenseNumber = data.licenseNumber;
    if (data.licenseExpiry) updateDriverData.licenseExpiry = data.licenseExpiry;
    if (data.yearsOfExperience) updateDriverData.yearsOfExperience = data.yearsOfExperience;
    if (data.certification) updateDriverData.certification = data.certification;

    const updatedDriver = await prisma.driver.update({
      where: { userId },
      data: updateDriverData,
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
        ambulances: {
          where: { deletedAt: null },
        },
      },
    });

    return updatedDriver;
  }

  async startDuty(userId: string, latitude: number, longitude: number, accuracy?: number) {
    if (latitude < -90 || latitude > 90) {
      throw new AppError("Invalid latitude", HTTP_STATUS.BAD_REQUEST);
    }
    if (longitude < -180 || longitude > 180) {
      throw new AppError("Invalid longitude", HTTP_STATUS.BAD_REQUEST);
    }

    const driver = await prisma.driver.findUnique({
      where: { userId },
    });

    if (!driver) {
      throw new AppError("Driver profile not found", HTTP_STATUS.NOT_FOUND);
    }

    if (!driver.isApproved) {
      throw new AppError(
        "Your profile is not approved yet",
        HTTP_STATUS.FORBIDDEN
      );
    }

    const ambulances = await prisma.ambulance.findMany({
      where: { driverId: driver.id, deletedAt: null },
    });

    if (ambulances.length === 0) {
      throw new AppError(
        "You must register an ambulance before starting duty",
        HTTP_STATUS.BAD_REQUEST
      );
    }

    const updated = await prisma.driver.update({
      where: { userId },
      data: {
        isAvailable: true,
        dutyStartTime: new Date(),
      },
      include: {
        ambulances: { where: { deletedAt: null } },
      },
    });

    await prisma.driverLocation.create({
      data: {
        driverId: driver.id,
        latitude,
        longitude,
        accuracy,
      },
    });

    return updated;
  }

  async stopDuty(userId: string) {
    const driver = await prisma.driver.findUnique({
      where: { userId },
    });

    if (!driver) {
      throw new AppError("Driver profile not found", HTTP_STATUS.NOT_FOUND);
    }

    const activeTrip = await prisma.trip.findFirst({
      where: {
        driverId: driver.id,
        completedAt: null,
        emergencyRequest: {
          status: {
            in: ["ACCEPTED", "EN_ROUTE", "ARRIVED", "PATIENT_PICKED_UP"],
          },
        },
      },
    });

    if (activeTrip) {
      throw new AppError(
        "Cannot stop duty while handling an emergency",
        HTTP_STATUS.BAD_REQUEST
      );
    }

    const updated = await prisma.driver.update({
      where: { userId },
      data: {
        isAvailable: false,
        dutyEndTime: new Date(),
      },
    });

    return updated;
  }

  async updateLocation(userId: string, latitude: number, longitude: number, accuracy?: number) {
    if (latitude < -90 || latitude > 90) {
      throw new AppError("Invalid latitude", HTTP_STATUS.BAD_REQUEST);
    }
    if (longitude < -180 || longitude > 180) {
      throw new AppError("Invalid longitude", HTTP_STATUS.BAD_REQUEST);
    }

    const driver = await prisma.driver.findUnique({
      where: { userId },
    });

    if (!driver) {
      throw new AppError("Driver profile not found", HTTP_STATUS.NOT_FOUND);
    }

    if (!driver.isAvailable) {
      throw new AppError(
        "You must start duty before updating location",
        HTTP_STATUS.BAD_REQUEST
      );
    }

    const location = await prisma.driverLocation.create({
      data: {
        driverId: driver.id,
        latitude,
        longitude,
        accuracy,
      },
    });

    return location;
  }

  async getCurrentLocation(userId: string) {
    const driver = await prisma.driver.findUnique({
      where: { userId },
    });

    if (!driver) {
      throw new AppError("Driver profile not found", HTTP_STATUS.NOT_FOUND);
    }

    const location = await prisma.driverLocation.findFirst({
      where: { driverId: driver.id },
      orderBy: { createdAt: "desc" },
    });

    if (!location) {
      throw new AppError("No location found", HTTP_STATUS.NOT_FOUND);
    }

    return location;
  }

  async getLocationHistory(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      startDate?: Date;
      endDate?: Date;
    } = {}
  ) {
    const driver = await prisma.driver.findUnique({
      where: { userId },
    });

    if (!driver) {
      throw new AppError("Driver profile not found", HTTP_STATUS.NOT_FOUND);
    }

    const page = Math.max(1, options.page || 1);
    const limit = Math.min(options.limit || 50, 100);
    const skip = (page - 1) * limit;

    const where: any = { driverId: driver.id };

    if (options.startDate || options.endDate) {
      where.createdAt = {};
      if (options.startDate) where.createdAt.gte = options.startDate;
      if (options.endDate) where.createdAt.lte = options.endDate;
    }

    const locations = await prisma.driverLocation.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    const total = await prisma.driverLocation.count({ where });

    return {
      data: locations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async registerAmbulance(
    userId: string,
    data: {
      registrationNo: string;
      ambulanceType: string;
      capacity: number;
      manufacturingYear?: number;
      equipment?: string[];
    }
  ) {
    const driver = await prisma.driver.findUnique({
      where: { userId },
    });

    if (!driver) {
      throw new AppError("Driver profile not found", HTTP_STATUS.NOT_FOUND);
    }

    const existing = await prisma.ambulance.findUnique({
      where: { registrationNo: data.registrationNo },
    });

    if (existing) {
      throw new AppError(
        "Registration number already registered",
        HTTP_STATUS.CONFLICT
      );
    }

    const ambulance = await prisma.ambulance.create({
      data: {
        driverId: driver.id,
        registrationNo: data.registrationNo,
        ambulanceType: data.ambulanceType,
        capacity: data.capacity,
        manufacturingYear: data.manufacturingYear,
        equipment: data.equipment || [],
      },
    });

    return ambulance;
  }

  async getAmbulances(userId: string) {
    const driver = await prisma.driver.findUnique({
      where: { userId },
    });

    if (!driver) {
      throw new AppError("Driver profile not found", HTTP_STATUS.NOT_FOUND);
    }

    const ambulances = await prisma.ambulance.findMany({
      where: {
        driverId: driver.id,
        deletedAt: null,
      },
    });

    return ambulances;
  }

  async getAssignedEmergencies(userId: string) {
    const driver = await prisma.driver.findUnique({
      where: { userId },
    });

    if (!driver) {
      throw new AppError("Driver profile not found", HTTP_STATUS.NOT_FOUND);
    }

    const emergencies = await prisma.emergencyRequest.findMany({
      where: {
        driverId: driver.id,
        status: {
          in: ["ASSIGNED", "ACCEPTED", "EN_ROUTE", "ARRIVED", "PATIENT_PICKED_UP", "AT_HOSPITAL"],
        },
        deletedAt: null,
      },
      include: {
        patient: {
          include: {
            user: {
              select: { fullName: true, phone: true },
            },
          },
        },
        hospital: true,
        trip: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return emergencies;
  }

  async getTripHistory(
    userId: string,
    options: {
      page?: number;
      limit?: number;
    } = {}
  ) {
    const driver = await prisma.driver.findUnique({
      where: { userId },
    });

    if (!driver) {
      throw new AppError("Driver profile not found", HTTP_STATUS.NOT_FOUND);
    }

    const page = Math.max(1, options.page || 1);
    const limit = Math.min(options.limit || 10, 50);
    const skip = (page - 1) * limit;

    const trips = await prisma.trip.findMany({
      where: {
        driverId: driver.id,
        completedAt: { not: null },
      },
      include: {
        emergencyRequest: {
          include: {
            patient: {
              include: {
                user: {
                  select: { fullName: true, phone: true },
                },
              },
            },
          },
        },
        hospital: true,
      },
      orderBy: { completedAt: "desc" },
      skip,
      take: limit,
    });

    const total = await prisma.trip.count({
      where: {
        driverId: driver.id,
        completedAt: { not: null },
      },
    });

    return {
      data: trips,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getStatistics(userId: string) {
    const driver = await prisma.driver.findUnique({
      where: { userId },
    });

    if (!driver) {
      throw new AppError("Driver profile not found", HTTP_STATUS.NOT_FOUND);
    }

    const totalTrips = await prisma.trip.count({
      where: { driverId: driver.id },
    });

    const completedTrips = await prisma.trip.count({
      where: {
        driverId: driver.id,
        completedAt: { not: null },
      },
    });

    const distanceData = await prisma.trip.aggregate({
      where: { driverId: driver.id },
      _sum: { distance: true },
    });

    const reviewData = await prisma.review.aggregate({
      where: { driverId: driver.id },
      _avg: { rating: true },
      _count: true,
    });

    return {
      totalTrips,
      completedTrips,
      totalDistance: distanceData._sum.distance || 0,
      averageRating: reviewData._avg.rating || 0,
      reviewCount: reviewData._count,
      isAvailable: driver.isAvailable,
      isApproved: driver.isApproved,
    };
  }
}