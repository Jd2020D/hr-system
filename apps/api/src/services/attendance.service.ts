import { prisma } from '../config/database';
import { AppError } from '../utils/error';
import { Prisma, AttendanceLog, AttendanceSource } from '@prisma/client';
import { AttendanceFilter, PaginatedResult } from '../types';

export const attendanceService = {
  async clockIn(employeeId: string, source: AttendanceSource = 'WEB', ipAddress?: string, deviceInfo?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingLog = await prisma.attendanceLog.findUnique({
      where: {
        employeeId_date: {
          employeeId,
          date: today,
        },
      },
    });

    if (existingLog?.clockIn) {
      throw new AppError(409, 'Already clocked in today');
    }

    if (existingLog) {
      // Update existing log
      return prisma.attendanceLog.update({
        where: { id: existingLog.id },
        data: {
          clockIn: new Date(),
          source,
          ipAddress,
          deviceInfo,
        },
        include: { employee: true },
      });
    }

    // Create new log
    return prisma.attendanceLog.create({
      data: {
        employeeId,
        date: today,
        clockIn: new Date(),
        source,
        ipAddress,
        deviceInfo,
      },
      include: { employee: true },
    });
  },

  async clockOut(employeeId: string, source: AttendanceSource = 'WEB', ipAddress?: string, deviceInfo?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existingLog = await prisma.attendanceLog.findUnique({
      where: {
        employeeId_date: {
          employeeId,
          date: today,
        },
      },
    });

    if (!existingLog) {
      throw new AppError(400, 'No clock-in found for today');
    }

    if (existingLog.clockOut) {
      throw new AppError(409, 'Already clocked out today');
    }

    return prisma.attendanceLog.update({
      where: { id: existingLog.id },
      data: {
        clockOut: new Date(),
        source,
        ipAddress,
        deviceInfo,
      },
      include: { employee: true },
    });
  },

  async findAll(filters: AttendanceFilter): Promise<PaginatedResult<AttendanceLog>> {
    const { page = 1, limit = 20, employeeId, from, to } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.AttendanceLogWhereInput = {};

    if (employeeId) {
      where.employeeId = employeeId;
    }

    if (from || to) {
      where.date = {};
      if (from) where.date.gte = new Date(from);
      if (to) where.date.lte = new Date(to);
    }

    const [data, total] = await Promise.all([
      prisma.attendanceLog.findMany({
        where,
        skip,
        take: limit,
        include: { employee: true },
        orderBy: { date: 'desc' },
      }),
      prisma.attendanceLog.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async update(id: string, data: { clockIn?: Date; clockOut?: Date; breaksMinutes?: number; note?: string }) {
    const log = await prisma.attendanceLog.findUnique({ where: { id } });
    if (!log) {
      throw new AppError(404, 'Attendance log not found');
    }

    return prisma.attendanceLog.update({
      where: { id },
      data,
      include: { employee: true },
    });
  },
};

