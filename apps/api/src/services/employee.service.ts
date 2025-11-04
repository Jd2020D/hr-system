import { prisma } from '../config/database';
import { AppError } from '../utils/error';
import { Prisma, Employee, EmployeeStatus } from '@prisma/client';
import { EmployeeFilter, PaginatedResult } from '../types';

export const employeeService = {
  async findAll(filters: EmployeeFilter): Promise<PaginatedResult<Employee>> {
    const { page = 1, limit = 20, departmentId, status, search } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.EmployeeWhereInput = {};

    if (departmentId) {
      where.departmentId = departmentId;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      // MySQL doesn't support 'mode: insensitive', use contains (case-sensitive search)
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { email: { contains: search } },
        { code: { contains: search } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        skip,
        take: limit,
        include: {
          department: true,
          manager: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.employee.count({ where }),
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

  async findById(id: string): Promise<Employee> {
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        department: true,
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        subordinates: {
          select: {
            id: true,
            code: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!employee) {
      throw new AppError(404, 'Employee not found');
    }

    return employee;
  },

  async create(data: Prisma.EmployeeCreateInput): Promise<Employee> {
    // Check if employee code exists
    const existingCode = await prisma.employee.findUnique({
      where: { code: data.code as string },
    });
    if (existingCode) {
      throw new AppError(409, 'Employee code already exists');
    }

    // Check if email exists
    const existingEmail = await prisma.employee.findUnique({
      where: { email: data.email as string },
    });
    if (existingEmail) {
      throw new AppError(409, 'Employee email already exists');
    }

    return prisma.employee.create({
      data,
      include: {
        department: true,
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  },

  async update(id: string, data: Prisma.EmployeeUpdateInput): Promise<Employee> {
    await this.findById(id); // Check if exists

    return prisma.employee.update({
      where: { id },
      data,
      include: {
        department: true,
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  },

  async delete(id: string): Promise<void> {
    await this.findById(id);

    // Soft delete by setting status to INACTIVE
    await prisma.employee.update({
      where: { id },
      data: { status: EmployeeStatus.INACTIVE },
    });
  },

  // Salary management methods
  async getSalaries(employeeId: string) {
    await this.findById(employeeId); // Verify employee exists

    return prisma.salary.findMany({
      where: { employeeId },
      orderBy: { effectiveFrom: 'desc' },
    });
  },

  async createSalary(employeeId: string, data: {
    baseSalary: number;
    allowance?: number;
    deduction?: number;
    currency?: 'USD' | 'JD' | 'AED';
    effectiveFrom: Date;
    effectiveTo?: Date | null;
  }) {
    await this.findById(employeeId); // Verify employee exists

    // If there's an existing active salary, set its effectiveTo to the day before the new one
    if (data.effectiveFrom) {
      const previousDay = new Date(data.effectiveFrom);
      previousDay.setDate(previousDay.getDate() - 1);

      await prisma.salary.updateMany({
        where: {
          employeeId,
          OR: [
            { effectiveTo: null },
            { effectiveTo: { gte: data.effectiveFrom } },
          ],
        },
        data: { effectiveTo: previousDay },
      });
    }

    return prisma.salary.create({
      data: {
        employeeId,
        baseSalary: data.baseSalary,
        allowance: data.allowance || 0,
        deduction: data.deduction || 0,
        currency: data.currency || 'AED',
        effectiveFrom: data.effectiveFrom,
        effectiveTo: data.effectiveTo || null,
      },
    });
  },

  async updateSalary(salaryId: string, data: {
    baseSalary?: number;
    allowance?: number;
    deduction?: number;
    currency?: 'USD' | 'JD' | 'AED';
    effectiveFrom?: Date;
    effectiveTo?: Date | null;
  }) {
    const salary = await prisma.salary.findUnique({
      where: { id: salaryId },
    });

    if (!salary) {
      throw new AppError(404, 'Salary record not found');
    }

    return prisma.salary.update({
      where: { id: salaryId },
      data: {
        ...(data.baseSalary !== undefined && { baseSalary: data.baseSalary }),
        ...(data.allowance !== undefined && { allowance: data.allowance }),
        ...(data.deduction !== undefined && { deduction: data.deduction }),
        ...(data.currency !== undefined && { currency: data.currency }),
        ...(data.effectiveFrom && { effectiveFrom: data.effectiveFrom }),
        ...(data.effectiveTo !== undefined && { effectiveTo: data.effectiveTo }),
      },
    });
  },

  async deleteSalary(salaryId: string) {
    const salary = await prisma.salary.findUnique({
      where: { id: salaryId },
    });

    if (!salary) {
      throw new AppError(404, 'Salary record not found');
    }

    await prisma.salary.delete({
      where: { id: salaryId },
    });
  },
};

