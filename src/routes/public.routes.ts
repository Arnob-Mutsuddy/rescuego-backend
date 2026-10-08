// src/routes/public.routes.ts
import { Router } from "express";
import prisma from "../config/database.js";
import { HTTP_STATUS } from "../config/constants.js";

const router = Router();

// Public: Hospital list 
router.get("/hospitals", async (req, res, next) => {
  try {
    const hospitals = await prisma.hospital.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        capacity: true,
        operatingHours: true,
        latitude: true,
        longitude: true,
      },
      orderBy: { name: "asc" },
    });

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Hospitals fetched successfully",
      data: hospitals,
    });
  } catch (error) {
    next(error);
  }
});

// Public: Platform stats 
router.get("/stats", async (req, res, next) => {
  try {
    const [totalDrivers, approvedDrivers, totalHospitals, completedTrips] =
      await Promise.all([
        prisma.driver.count({ where: { deletedAt: null } }),
        prisma.driver.count({
          where: { deletedAt: null, isApproved: true },
        }),
        prisma.hospital.count({ where: { deletedAt: null } }),
        prisma.emergencyRequest.count({ where: { status: "COMPLETED" } }),
      ]);

    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: "Platform stats fetched successfully",
      data: { totalDrivers, approvedDrivers, totalHospitals, completedTrips },
    });
  } catch (error) {
    next(error);
  }
});

export default router;