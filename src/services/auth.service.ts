
import prisma from "../config/database.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import { generateToken } from "../utils/jwt.js";
import { AppError } from "../middleware/errorHandler.js";
import { HTTP_STATUS } from "../config/constants.js";
import { RegisterInput, LoginInput } from "../utils/validation.js";

export class AuthService {
  async register(input: RegisterInput) {
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existingUser) {
      throw new AppError(
        "Email already registered",
        HTTP_STATUS.CONFLICT,
        [{ field: "email", message: "This email is already in use" }]
      );
    }

    const existingPhone = await prisma.user.findFirst({
      where: { phone: input.phone },
    });

    if (existingPhone) {
      throw new AppError(
        "Phone number already registered",
        HTTP_STATUS.CONFLICT,
        [{ field: "phone", 
          message: "This phone number is already in use" }]
      );
    }

    const hashedPassword = await hashPassword(input.password);

    const user = await prisma.user.create({
      data: {
        email: input.email,
        password: hashedPassword,
        phone: input.phone,
        fullName: input.fullName,
        role: input.role,
      },
    });

    if (input.role === "PATIENT") {
      await prisma.patient.create({
        data: { userId: user.id },
      });
    } else if (input.role === "DRIVER") {
      await prisma.driver.create({
        data: {
          userId: user.id,
          licenseNumber: `TEMP-${user.id.slice(0, 8)}`,
          licenseExpiry: new Date(),
        },
      });
    } else if (input.role === "ADMIN") {
      await prisma.admin.create({
        data: { userId: user.id },
      });
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    };
  }

  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!user) {
      throw new AppError(
        "Invalid credentials",
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    const isValidPassword = await comparePassword(input.password, user.password);

    if (!isValidPassword) {
      throw new AppError(
        "Invalid credentials",
        HTTP_STATUS.UNAUTHORIZED
      );
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    };
  }

  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        avatar: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new AppError("User not found", HTTP_STATUS.NOT_FOUND);
    }

    return user;
  }
}