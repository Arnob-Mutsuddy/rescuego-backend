import prisma from "../config/database.js";
import { AppError } from "../middleware/errorHandler.js";
import { HTTP_STATUS } from "../config/constants.js";

export class AdminService {
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






}