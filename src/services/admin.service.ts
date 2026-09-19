import prisma from "../config/database.js";
import { AppError } from "../middleware/errorHandler.js";
import { HTTP_STATUS } from "../config/constants.js";

export class AdminService {
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
}