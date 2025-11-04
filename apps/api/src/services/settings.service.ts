import { prisma } from '../config/database';
import { AppError } from '../utils/error';
import { Prisma } from '@prisma/client';

export const settingsService = {
  // ===== DEPARTMENTS =====
  async getDepartments() {
    return prisma.department.findMany({
      include: {
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: { employees: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async createDepartment(data: Prisma.DepartmentCreateInput) {
    // Check if code exists
    const existingCode = await prisma.department.findUnique({
      where: { code: data.code as string },
    });
    if (existingCode) {
      throw new AppError(409, 'Department code already exists');
    }

    return prisma.department.create({
      data,
      include: {
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  },

  async updateDepartment(id: string, data: Prisma.DepartmentUpdateInput) {
    // Check if exists
    const existing = await prisma.department.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError(404, 'Department not found');
    }

    // Check code uniqueness if updating
    if (data.code) {
      const codeExists = await prisma.department.findFirst({
        where: { code: data.code as string, id: { not: id } },
      });
      if (codeExists) {
        throw new AppError(409, 'Department code already exists');
      }
    }

    return prisma.department.update({
      where: { id },
      data,
      include: {
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  },

  async deleteDepartment(id: string) {
    // Check if exists and has employees
    const dept = await prisma.department.findUnique({
      where: { id },
      include: { _count: { select: { employees: true } } },
    });

    if (!dept) {
      throw new AppError(404, 'Department not found');
    }

    if (dept._count.employees > 0) {
      throw new AppError(400, 'Cannot delete department with employees. Please reassign employees first.');
    }

    return prisma.department.delete({ where: { id } });
  },

  // ===== LEAVE TYPES =====
  async getLeaveTypes() {
    return prisma.leaveType.findMany({
      orderBy: { createdAt: 'desc' },
    });
  },

  async createLeaveType(data: Prisma.LeaveTypeCreateInput) {
    // Check if code exists
    const existingCode = await prisma.leaveType.findUnique({
      where: { code: data.code as string },
    });
    if (existingCode) {
      throw new AppError(409, 'Leave type code already exists');
    }

    return prisma.leaveType.create({ data });
  },

  async updateLeaveType(id: string, data: Prisma.LeaveTypeUpdateInput) {
    // Check if exists
    const existing = await prisma.leaveType.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError(404, 'Leave type not found');
    }

    // Check code uniqueness if updating
    if (data.code) {
      const codeExists = await prisma.leaveType.findFirst({
        where: { code: data.code as string, id: { not: id } },
      });
      if (codeExists) {
        throw new AppError(409, 'Leave type code already exists');
      }
    }

    return prisma.leaveType.update({ where: { id }, data });
  },

  async deleteLeaveType(id: string) {
    // Check if exists and is used
    const leaveType = await prisma.leaveType.findUnique({
      where: { id },
      include: { _count: { select: { leaveRequests: true } } },
    });

    if (!leaveType) {
      throw new AppError(404, 'Leave type not found');
    }

    if (leaveType._count.leaveRequests > 0) {
      throw new AppError(400, 'Cannot delete leave type with existing requests');
    }

    return prisma.leaveType.delete({ where: { id } });
  },

  // ===== SHIFTS =====
  async getShifts() {
    return prisma.shift.findMany({
      orderBy: { createdAt: 'desc' },
    });
  },

  async createShift(data: Prisma.ShiftCreateInput) {
    // If setting as default, unset other defaults
    if (data.isDefault === true) {
      await prisma.shift.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    return prisma.shift.create({ data });
  },

  async updateShift(id: string, data: Prisma.ShiftUpdateInput) {
    // Check if exists
    const existing = await prisma.shift.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError(404, 'Shift not found');
    }

    // If setting as default, unset other defaults
    if (data.isDefault === true) {
      await prisma.shift.updateMany({
        where: { isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    return prisma.shift.update({ where: { id }, data });
  },

  async deleteShift(id: string) {
    // Check if exists
    const shift = await prisma.shift.findUnique({ where: { id } });
    if (!shift) {
      throw new AppError(404, 'Shift not found');
    }

    return prisma.shift.delete({ where: { id } });
  },

  // ===== HOLIDAYS =====
  async getHolidays(year?: number) {
    const where: Prisma.HolidayWhereInput = {};
    if (year) {
      const startOfYear = new Date(year, 0, 1);
      const endOfYear = new Date(year, 11, 31);
      where.date = { gte: startOfYear, lte: endOfYear };
    }

    return prisma.holiday.findMany({
      where,
      orderBy: { date: 'asc' },
    });
  },

  async createHoliday(data: Prisma.HolidayCreateInput) {
    // Check if exists
    const existing = await prisma.holiday.findUnique({
      where: {
        date_countryCode: {
          date: data.date as Date,
          countryCode: data.countryCode as string,
        },
      },
    });

    if (existing) {
      throw new AppError(409, 'Holiday already exists for this date and country');
    }

    return prisma.holiday.create({ data });
  },

  async deleteHoliday(id: string) {
    const holiday = await prisma.holiday.findUnique({ where: { id } });
    if (!holiday) {
      throw new AppError(404, 'Holiday not found');
    }

    return prisma.holiday.delete({ where: { id } });
  },
};

