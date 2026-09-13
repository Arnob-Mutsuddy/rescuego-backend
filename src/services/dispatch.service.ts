// src/services/dispatch.service.ts
import prisma from "@/config/database.js";
import { AppError } from "@/middleware/errorHandler.js";
import { HTTP_STATUS } from "@/config/constants.js";
import { calculateDistance, estimateTime } from "@/utils/distance.js";

export class DispatchService {
  /**
   * Emergency request nearest available ambulances find
   */
  async findNearestAmbulances(
    patientLat: number,
    patientLng: number,
    limit: number = 5
  ) {
    // available drivers find
    const availableDrivers = await prisma.driver.findMany({
      where: {
        isAvailable: true,
        isApproved: true,
        deletedAt: null,
      },
      include: {
        user: {
          select: {
            fullName: true,
            phone: true,
          },
        },
        ambulances: {
          where: {
            status: "ACTIVE",
            deletedAt: null,
          },
        },
        locations: {
          orderBy: { createdAt: "desc" },
          take: 1, // last location
        },
      },
    });

    if (availableDrivers.length === 0) {
      throw new AppError(
        "No available ambulances nearby",
        HTTP_STATUS.NOT_FOUND
      );
    }

    // Distance calculate and sort
    const driversWithDistance = availableDrivers
      .map((driver) => {
        const location = driver.locations[0];

        if (!location) {
          return null; // Location not found skip
        }

        const distance = calculateDistance(
          patientLat,
          patientLng,
          location.latitude,
          location.longitude
        );

        const estimatedTime = estimateTime(distance);

        return {
          driverId: driver.id,
          userId: driver.userId,
          driverName: driver.user.fullName,
          driverPhone: driver.user.phone,
          ambulances: driver.ambulances,
          currentLocation: {
            latitude: location.latitude,
            longitude: location.longitude,
            accuracy: location.accuracy,
          },
          distance, // km
          estimatedTime, // minutes
        };
      })
      .filter((d) => d !== null)
      .sort((a, b) => a.distance - b.distance) // Nearest first
      .slice(0, limit);

    return driversWithDistance;
  }

  /**
   * Emergency request driver assign
   */
  async assignEmergency(
    emergencyRequestId: string,
    driverId: string,
    patientLat: number,
    patientLng: number,
    hospitalId: string
  ) {
    // Check emergency request exists and is PENDING
    const emergency = await prisma.emergencyRequest.findUnique({
      where: { id: emergencyRequestId },
    });

    if (!emergency) {
      throw new AppError("Emergency request not found", HTTP_STATUS.NOT_FOUND);
    }

    if (emergency.status !== "PENDING") {
      throw new AppError(
        "Emergency request already assigned",
        HTTP_STATUS.BAD_REQUEST
      );
    }

    // Check driver exists and is available
    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
      include: {
        ambulances: {
          where: { status: "ACTIVE", deletedAt: null },
        },
        locations: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!driver) {
      throw new AppError("Driver not found", HTTP_STATUS.NOT_FOUND);
    }

    if (!driver.isAvailable || !driver.isApproved) {
      throw new AppError("Driver is not available", HTTP_STATUS.BAD_REQUEST);
    }

    if (driver.ambulances.length === 0) {
      throw new AppError(
        "Driver has no active ambulance",
        HTTP_STATUS.BAD_REQUEST
      );
    }

    // Calculate distance
    const driverLocation = driver.locations[0];
    if (!driverLocation) {
      throw new AppError("Driver location not available", HTTP_STATUS.BAD_REQUEST);
    }

    const distance = calculateDistance(
      patientLat,
      patientLng,
      driverLocation.latitude,
      driverLocation.longitude
    );

    const estimatedTime = estimateTime(distance);

    // Get hospital
    const hospital = await prisma.hospital.findUnique({
      where: { id: hospitalId },
    });

    if (!hospital) {
      throw new AppError("Hospital not found", HTTP_STATUS.NOT_FOUND);
    }

    // Update emergency request status
    const updated = await prisma.emergencyRequest.update({
      where: { id: emergencyRequestId },
      data: {
        driverId,
        status: "ASSIGNED",
        hospitalId,
        estimatedDistance: distance,
        estimatedTime,
        estimatedCost: Math.ceil((distance * 50) + 100), // baseFare + perKm
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
      },
    });

    return updated;
  }

  /**
   * Driver emergency request accept
   */
  async acceptDispatch(emergencyRequestId: string, driverId: string) {
    const emergency = await prisma.emergencyRequest.findUnique({
      where: { id: emergencyRequestId },
    });

    if (!emergency) {
      throw new AppError("Emergency request not found", HTTP_STATUS.NOT_FOUND);
    }

    if (emergency.driverId !== driverId) {
      throw new AppError(
        "This request is not assigned to you",
        HTTP_STATUS.FORBIDDEN
      );
    }

    if (emergency.status !== "ASSIGNED") {
      throw new AppError(
        "Request cannot be accepted in current status",
        HTTP_STATUS.BAD_REQUEST
      );
    }

    // Create trip
    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
      include: {
        ambulances: {
          where: { status: "ACTIVE", deletedAt: null },
        },
      },
    });

    if (!driver || driver.ambulances.length === 0) {
      throw new AppError("Ambulance not found", HTTP_STATUS.NOT_FOUND);
    }

    // Update emergency status and create trip
    const updated = await prisma.emergencyRequest.update({
      where: { id: emergencyRequestId },
      data: {
        status: "ACCEPTED",
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
      },
    });

    // Create trip record
    const ambulance = driver.ambulances[0];

    if (!ambulance) {
      throw new AppError("No ambulance assigned to this driver", HTTP_STATUS.NOT_FOUND);
    }

    const trip = await prisma.trip.create({
      data: {
        emergencyRequestId,
        driverId,
        ambulanceId: ambulance.id,
        hospitalId: emergency.hospitalId!,
        distance: emergency.estimatedDistance!,
        estimatedTime: emergency.estimatedTime!,
        acceptedAt: new Date(),
      },
    });

    return { emergencyRequest: updated, trip };
  }

  /**
   * Driver emergency request reject করে
   */
  async rejectDispatch(emergencyRequestId: string, driverId: string) {
    const emergency = await prisma.emergencyRequest.findUnique({
      where: { id: emergencyRequestId },
    });

    if (!emergency) {
      throw new AppError("Emergency request not found", HTTP_STATUS.NOT_FOUND);
    }

    if (emergency.driverId !== driverId) {
      throw new AppError(
        "This request is not assigned to you",
        HTTP_STATUS.FORBIDDEN
      );
    }

    if (emergency.status !== "ASSIGNED") {
      throw new AppError(
        "Request cannot be rejected in current status",
        HTTP_STATUS.BAD_REQUEST
      );
    }

    // Unassign from this driver
    const updated = await prisma.emergencyRequest.update({
      where: { id: emergencyRequestId },
      data: {
        driverId: null,
        status: "PENDING",
      },
    });

    return updated;
  }

  /**
   * Trip status update (EN_ROUTE, ARRIVED, PICKED_UP, AT_HOSPITAL)
   */
  async updateTripStatus(
    tripId: string,
    status: "EN_ROUTE" | "ARRIVED" | "PATIENT_PICKED_UP" | "AT_HOSPITAL" | "COMPLETED",
    driverId: string
  ) {
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        driver: true,
        emergencyRequest: true,
      },
    });

    if (!trip) {
      throw new AppError("Trip not found", HTTP_STATUS.NOT_FOUND);
    }

    if (trip.driverId !== driverId) {
      throw new AppError(
        "You are not assigned to this trip",
        HTTP_STATUS.FORBIDDEN
      );
    }

    // Status flow: ACCEPTED → EN_ROUTE → ARRIVED → PICKED_UP → AT_HOSPITAL → COMPLETED
    const validStatusFlow = {
      ACCEPTED: ["EN_ROUTE"],
      EN_ROUTE: ["ARRIVED"],
      ARRIVED: ["PATIENT_PICKED_UP"],
      PATIENT_PICKED_UP: ["AT_HOSPITAL"],
      AT_HOSPITAL: ["COMPLETED"],
    };

    const currentStatus = trip.emergencyRequest.status;
    const statusMap: any = {
      EN_ROUTE: "EN_ROUTE",
      ARRIVED: "ARRIVED",
      PATIENT_PICKED_UP: "PATIENT_PICKED_UP",
      AT_HOSPITAL: "AT_HOSPITAL",
      COMPLETED: "COMPLETED",
    };

    // Update trip timestamps
    const updateData: any = {};
    if (status === "EN_ROUTE") updateData.enRouteAt = new Date();
    if (status === "ARRIVED") updateData.arrivedAt = new Date();
    if (status === "PATIENT_PICKED_UP") updateData.pickedUpAt = new Date();
    if (status === "AT_HOSPITAL") updateData.arrivedHospitalAt = new Date();
    if (status === "COMPLETED") updateData.completedAt = new Date();

    const updatedTrip = await prisma.trip.update({
      where: { id: tripId },
      data: updateData,
      include: {
        emergencyRequest: true,
        driver: {
          include: {
            user: true,
          },
        },
        ambulance: true,
        hospital: true,
      },
    });

    // Update emergency request status
    const updatedEmergency = await prisma.emergencyRequest.update({
      where: { id: trip.emergencyRequestId },
      data: {
        status: statusMap[status],
        ...(status === "COMPLETED" && { completedAt: new Date() }),
      },
    });

    return { trip: updatedTrip, emergencyRequest: updatedEmergency };
  }
}