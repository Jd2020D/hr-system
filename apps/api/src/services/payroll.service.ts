import { prisma } from '../config/database';
import { AppError } from '../utils/error';
import { Prisma, PayrollRun, PayrollRunStatus } from '@prisma/client';
import { PayrollFilter, PaginatedResult } from '../types';
import { isWithinInterval, isAfter } from 'date-fns';

export const payrollService = {
  async findAll(filters: PayrollFilter): Promise<PaginatedResult<PayrollRun>> {
    const { page = 1, limit = 20, status, from, to } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.PayrollRunWhereInput = {};

    if (status) where.status = status;

    if (from || to) {
      where.periodStart = {};
      if (from) where.periodStart.gte = new Date(from);
      if (to) where.periodStart.lte = new Date(to);
    }

    const [data, total] = await Promise.all([
      prisma.payrollRun.findMany({
        where,
        skip,
        take: limit,
        include: {
          items: {
            include: {
              employee: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: { periodStart: 'desc' },
      }),
      prisma.payrollRun.count({ where }),
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

  async findById(id: string): Promise<PayrollRun> {
    const run = await prisma.payrollRun.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                code: true,
              },
            },
          },
        },
      },
    });

    if (!run) {
      throw new AppError(404, 'Payroll run not found');
    }

    return run;
  },

  async create(data: { periodStart: Date; periodEnd: Date; notes?: string }): Promise<PayrollRun> {
    return prisma.payrollRun.create({
      data,
      include: {
        items: true,
      },
    });
  },

  async prepare(id: string): Promise<PayrollRun> {
    const run = await this.findById(id);

    if (run.status !== 'DRAFT') {
      throw new AppError(400, 'Can only prepare draft payroll runs');
    }

    // Get all active employees with their salaries
    const employees = await prisma.employee.findMany({
      where: { status: 'ACTIVE' },
      include: { 
        salaries: {
          orderBy: { effectiveFrom: 'desc' },
        },
      },
    });

    // Generate payroll items
    const payrollItems = employees.map(employee => {
      const salary = this.getEffectiveSalary(employee.salaries, run.periodStart, run.periodEnd);
      
      const grossSalary = Number(salary.baseSalary);
      const totalAllowance = Number(salary.allowance);
      const totalDeduction = Number(salary.deduction);
      const netPay = grossSalary + totalAllowance - totalDeduction;

      return {
        payrollRunId: id,
        employeeId: employee.id,
        grossSalary,
        totalAllowance,
        totalDeduction,
        netPay,
        currency: (salary.currency as 'USD' | 'JD' | 'AED') || 'AED',
      };
    });

    // Delete existing items and create new ones
    await prisma.payrollItem.deleteMany({ where: { payrollRunId: id } });
    await prisma.payrollItem.createMany({ data: payrollItems });

    return this.findById(id);
  },

  async approve(id: string): Promise<PayrollRun> {
    const run = await this.findById(id);

    if (run.status !== 'PREPARED') {
      throw new AppError(400, 'Can only approve prepared payroll runs');
    }

    // Check if run has items by querying them
    const items = await prisma.payrollItem.findMany({ where: { payrollRunId: id } });
    if (items.length === 0) {
      throw new AppError(400, 'Cannot approve payroll run without items. Please prepare first.');
    }

    return prisma.payrollRun.update({
      where: { id },
      data: { status: 'APPROVED' },
      include: {
        items: {
          include: {
            employee: true,
          },
        },
      },
    });
  },

  async pay(id: string): Promise<PayrollRun> {
    const run = await this.findById(id);

    if (run.status !== 'APPROVED') {
      throw new AppError(400, 'Can only pay approved payroll runs');
    }

    return prisma.payrollRun.update({
      where: { id },
      data: { status: 'PAID' },
      include: {
        items: {
          include: {
            employee: true,
          },
        },
      },
    });
  },

  // Helper to get effective salary for a period
  getEffectiveSalary(salaries: Array<{ effectiveFrom: Date; effectiveTo?: Date | null; baseSalary: any; allowance: any; deduction: any; currency?: string }>, periodStart: Date, periodEnd: Date) {
    // Find the latest salary that is effective during the period
    const effectiveSalaries = salaries.filter(salary => {
      const start = salary.effectiveFrom;
      const end = salary.effectiveTo || new Date();
      return isWithinInterval(periodStart, { start, end }) || 
             isWithinInterval(periodEnd, { start, end }) ||
             (isAfter(start, periodStart) && isAfter(periodEnd, start));
    });

    if (effectiveSalaries.length === 0) {
      throw new AppError(400, 'No effective salary found for the period');
    }

    // Get the most recent one
    return effectiveSalaries.sort((a, b) => b.effectiveFrom.getTime() - a.effectiveFrom.getTime())[0];
  },
};

