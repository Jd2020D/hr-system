import bcrypt from 'bcryptjs';
import { prisma } from '../config/database';
import { generateTokens } from '../utils/auth';
import { AppError } from '../utils/error';
import { Role } from '@prisma/client';

export const authService = {
  async register(data: { email: string; password: string; role: Role; employeeId?: string }) {
    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      throw new AppError(409, 'User already exists');
    }

    if (data.employeeId) {
      const existingEmployeeUser = await prisma.user.findUnique({
        where: { employeeId: data.employeeId },
      });
      if (existingEmployeeUser) {
        throw new AppError(409, 'Employee already has a user account');
      }
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        role: data.role,
        employeeId: data.employeeId,
      },
      select: {
        id: true,
        email: true,
        role: true,
        employeeId: true,
        isActive: true,
        createdAt: true,
      },
    });

    return user;
  },

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { employee: true },
    });

    if (!user) {
      throw new AppError(401, 'Invalid credentials');
    }

    if (!user.isActive) {
      throw new AppError(403, 'Account is inactive');
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      throw new AppError(401, 'Invalid credentials');
    }

    const tokens = generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
      employeeId: user.employeeId || undefined,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId,
        employee: user.employee,
      },
      ...tokens,
    };
  },

  async refreshToken(refreshToken: string) {
    const { verifyRefreshToken } = await import('../utils/auth');
    const decoded = verifyRefreshToken(refreshToken);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user || !user.isActive) {
      throw new AppError(401, 'Invalid token');
    }

    return generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
      employeeId: user.employeeId || undefined,
    });
  },
};

