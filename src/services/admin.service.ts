import prisma from "../config/database.js";
import { AppError } from "../middleware/errorHandler.js";
import { HTTP_STATUS } from "../config/constants.js";

export class AdminService {

    //dashbard stats
    async getDashboardStats() {
    const totalUsers = await prisma.user.count({ 
        where: {
            deletedAt: null 
            } 
    });
    const totalPatients = await prisma.patient.count({ 
        where: {
             deletedAt: null 
            } 
    });
    const totalDrivers = await prisma.driver.count({ 
        where: {    
             deletedAt: null 
            } 
    });
    const approvedDrivers = await prisma.driver.count({
      where: {
         deletedAt: null, 
         isApproved: true },
    });
    const availableDrivers = await prisma.driver.count({
      where: {  
        deletedAt: null, 
        isAvailable: true },
    });

    const totalEmergencies = await prisma.emergencyRequest.count();
    const pendingEmergencies = await prisma.emergencyRequest.count({
      where: { 
        status: "PENDING" 
    },
    });
    const activeEmergencies = await prisma.emergencyRequest.count({
      where: {
        status: {
          in: ["ASSIGNED", "ACCEPTED", "EN_ROUTE", "ARRIVED", "PATIENT_PICKED_UP", "AT_HOSPITAL"],
        },
      },
    });
    const completedEmergencies = await prisma.emergencyRequest.count({
      where: {   
        status: "COMPLETED" 
    },
    });

    const totalRevenue = await prisma.payment.aggregate({
      where: { 
        status: "SUCCESS" },
      _sum: { amount: true },
    });

    const totalHospitals = await prisma.hospital.count({ where: { deletedAt: null } });

    return {
      users: {
        total: totalUsers,
        patients: totalPatients,
        drivers: totalDrivers,
      },
      drivers: {
        total: totalDrivers,
        approved: approvedDrivers,
        available: availableDrivers,
      },
      emergencies: {
        total: totalEmergencies,
        pending: pendingEmergencies,
        active: activeEmergencies,
        completed: completedEmergencies,
      },
      revenue: {
        total: totalRevenue._sum.amount || 0,
      },
      hospitals: totalHospitals,
    };
  }

  //audıt log


    async createAuditLog(
        userId: string,
        action: string,
        resource: string,
        resourceId: string,
        changes?: any
    ) {
        await prisma.auditLog.create({
        data: {
            userId,
            action,
            resource,
            resourceId,
            changes,
        },
        });
    }

    async getAuditLogs(options: {page?: number; limit?: number; action?: string;} = {}) {
        const page = Math.max(1, options.page || 1);
        const limit = Math.min(options.limit || 20, 100);
        const skip = (page - 1) * limit;

        const where: any = {};
        if (options.action) {
        where.action = options.action;
        }

        const logs = await prisma.auditLog.findMany({
        where,
        include: {
            user: {
            select: { fullName: true, email: true, role: true },
            },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        });

        const total = await prisma.auditLog.count({ where });

        return {
        data: logs,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        };
    }



    async getAllUsers(options: {page?: number; limit?: number; role?: string; search?: string; } = {}) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(options.limit || 10, 50);
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };
    if (options.role) {
      where.role = options.role;
    }
    if (options.search) {
      where.OR = [
        { fullName: 
            { 
                contains: options.search, 
                mode: "insensitive" 
            } },
        { email: 
            { 
            contains: options.search, mode: "insensitive" 
            } 
        },
        { phone: 
            { 
                contains: options.search 
            } 
        },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    const total = await prisma.user.count({ where });

    return {
      data: users,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

    async toggleUserStatus(userId: string, adminUserId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new AppError("User not found", HTTP_STATUS.NOT_FOUND);
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { isActive: !user.isActive },
    });

    await this.createAuditLog(
      adminUserId,
      updated.isActive ? "ACTIVATE_USER" : "DEACTIVATE_USER",
      "User",
      userId
    );

    return updated;
  }

    async getAllDrivers(options: {page?: number; limit?: number; isApproved?: boolean;} = {}) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(options.limit || 10, 50);
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };
    if (options.isApproved !== undefined) {
      where.isApproved = options.isApproved;
    }

    const drivers = await prisma.driver.findMany({
      where,
      include: {
        user: {
          select: { fullName: true, email: true, phone: true },
        },
        ambulances: {
          where: { deletedAt: null },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    const total = await prisma.driver.count({ where });

    return {
      data: drivers,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async approveDriver(driverId: string, adminUserId: string) {
    const driver = await prisma.driver.findUnique({ where: { id: driverId } });

    if (!driver) {
      throw new AppError("Driver not found", HTTP_STATUS.NOT_FOUND);
    }

    const updated = await prisma.driver.update({
      where: { id: driverId },
      data: { isApproved: true },
      include: {
        user: { select: { fullName: true, email: true } },
      },
    });

    await this.createAuditLog(adminUserId, "APPROVE_DRIVER", "Driver", driverId);

    return updated;
  }



    async rejectDriver(driverId: string, adminUserId: string, reason?: string) {
    const driver = await prisma.driver.findUnique({ where: { id: driverId } });

    if (!driver) {
      throw new AppError("Driver not found", HTTP_STATUS.NOT_FOUND);
    }

    const updated = await prisma.driver.update({
      where: { id: driverId },
      data: { isApproved: false },
    });

    await this.createAuditLog(
      adminUserId,
      "REJECT_DRIVER",
      "Driver",
      driverId,
      { reason }
    );

    return updated;
  }


//hopital


   async createHospital(data: {
    name: string;
    phone: string;
    email?: string;
    address: string;
    website?: string;
    latitude: number;
    longitude: number;
    capacity: number;
    operatingHours?: string;
  }) {
    const hospital = await prisma.hospital.create({ data });
    return hospital;
  }

  async getAllHospitals(options: { page?: number; limit?: number } = {}) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(options.limit || 10, 50);
    const skip = (page - 1) * limit;

    const hospitals = await prisma.hospital.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    const total = await prisma.hospital.count({ where: { deletedAt: null } });

    return {
      data: hospitals,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async updateHospital(
    hospitalId: string,
    data: Partial< {
      name: string;
      phone: string;
      email: string;
      address: string;
      website: string;
      latitude: number;
      longitude: number;
      capacity: number;
      operatingHours: string;
    }  >
  ) {
    const hospital = await prisma.hospital.findUnique({
      where: { id: hospitalId },
    });

    if (!hospital) {
      throw new AppError("Hospital not found", HTTP_STATUS.NOT_FOUND);
    }

    const updated = await prisma.hospital.update({
      where: { id: hospitalId },
      data,
    });

    return updated;
  }

  async deleteHospital(hospitalId: string) {
    const hospital = await prisma.hospital.findUnique({
      where: { id: hospitalId },
    });

    if (!hospital) {
      throw new AppError("Hospital not found", HTTP_STATUS.NOT_FOUND);
    }

    await prisma.hospital.update({
      where: { id: hospitalId },
      data: { deletedAt: new Date() },
    });

    return { message: "Hospital deleted successfully" };
  }


    async getAllEmergencyRequests(options: {page?: number; limit?: number; status?: string; severity?: string;} = {}) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(options.limit || 10, 50);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (options.status) where.status = options.status;
    if (options.severity) where.severity = options.severity;

    const requests = await prisma.emergencyRequest.findMany({
      where,
      include: {
        patient: {
          include: { user: { select: { fullName: true, phone: true } } },
        },
        driver: {
          include: { user: { select: { fullName: true, phone: true } } },
        },
        hospital: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });

    const total = await prisma.emergencyRequest.count({ where });

    return {
      data: requests,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }
  

  






}