import { prisma } from '../config/database';
import { AppError } from '../utils/error';
import { Prisma, LeaveRequest, LeaveRequestStatus } from '@prisma/client';
import { LeaveRequestFilter, PaginatedResult } from '../types';
import { differenceInDays, isWithinInterval } from 'date-fns';
import { format } from 'date-fns';
import { emailService } from './email.service';

export const leaveService = {
  async findAll(filters: LeaveRequestFilter): Promise<PaginatedResult<LeaveRequest>> {
    const { page = 1, limit = 20, status, employeeId, managerId, leaveTypeId } = filters;
    const skip = (page - 1) * limit;

    const where: Prisma.LeaveRequestWhereInput = {};

    if (status) where.status = status;
    if (employeeId) where.employeeId = employeeId;
    if (leaveTypeId) where.leaveTypeId = leaveTypeId;

    if (managerId) {
      where.employee = { managerEmployeeId: managerId };
    }

    const [data, total] = await Promise.all([
      prisma.leaveRequest.findMany({
        where,
        skip,
        take: limit,
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          leaveType: true,
          approver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.leaveRequest.count({ where }),
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

  async findById(id: string): Promise<LeaveRequest> {
    const request = await prisma.leaveRequest.findUnique({
      where: { id },
      include: {
        employee: true,
        leaveType: true,
        approver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!request) {
      throw new AppError(404, 'Leave request not found');
    }

    return request;
  },

  async create(data: {
    employeeId: string;
    leaveTypeId: string;
    startDate: Date;
    endDate: Date;
    reason?: string;
    attachmentUrl?: string;
  }): Promise<LeaveRequest> {
    // Validate dates
    const days = differenceInDays(data.endDate, data.startDate) + 1;
    if (days <= 0) {
      throw new AppError(400, 'Invalid date range');
    }

    // Check for conflicts with existing leaves
    const conflicts = await prisma.leaveRequest.findMany({
      where: {
        employeeId: data.employeeId,
        status: { in: ['PENDING', 'APPROVED'] },
        OR: [
          {
            AND: [
              { startDate: { lte: data.endDate } },
              { endDate: { gte: data.startDate } },
            ],
          },
        ],
      },
    });

    if (conflicts.length > 0) {
      throw new AppError(409, 'Leave request conflicts with existing approved or pending leaves');
    }

    // Check balance
    const year = data.startDate.getFullYear();
    const balance = await prisma.leaveBalance.findUnique({
      where: {
        employeeId_leaveTypeId_year: {
          employeeId: data.employeeId,
          leaveTypeId: data.leaveTypeId,
          year,
        },
      },
    });

    if (!balance || balance.remainingDays < days) {
      throw new AppError(400, 'Insufficient leave balance');
    }

    const request = await prisma.leaveRequest.create({
      data: { ...data, days },
      include: {
        employee: true,
        leaveType: true,
      },
    });

    // Send email notification to employee
    try {
      await emailService.sendLeaveRequestNotification(
        request.employee.email,
        `${request.employee.firstName} ${request.employee.lastName}`,
        request.leaveType.name,
        format(request.startDate, 'MMM dd, yyyy'),
        format(request.endDate, 'MMM dd, yyyy'),
        request.days
      );
    } catch (error) {
      console.error('Failed to send leave request notification:', error);
      // Don't fail the request if email fails
    }

    return request;
  },

  async approve(id: string, approverId: string): Promise<LeaveRequest> {
    const request = await this.findById(id);

    if (request.status !== 'PENDING') {
      throw new AppError(400, 'Leave request is not pending');
    }

    const updated = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approverEmployeeId: approverId,
      },
      include: {
        employee: true,
        leaveType: true,
        approver: true,
      },
    });

    // Update balance
    const year = request.startDate.getFullYear();
    await prisma.leaveBalance.update({
      where: {
        employeeId_leaveTypeId_year: {
          employeeId: request.employeeId,
          leaveTypeId: request.leaveTypeId,
          year,
        },
      },
      data: {
        takenDays: { increment: request.days },
        remainingDays: { decrement: request.days },
      },
    });

    // Send email notification to employee
    try {
      await emailService.sendLeaveStatusNotification(
        updated.employee.email,
        `${updated.employee.firstName} ${updated.employee.lastName}`,
        updated.leaveType.name,
        format(updated.startDate, 'MMM dd, yyyy'),
        format(updated.endDate, 'MMM dd, yyyy'),
        'APPROVED',
        updated.approver ? `${updated.approver.firstName} ${updated.approver.lastName}` : undefined
      );
    } catch (error) {
      console.error('Failed to send leave approval notification:', error);
      // Don't fail the approval if email fails
    }

    return updated;
  },

  async reject(id: string, approverId: string): Promise<LeaveRequest> {
    const request = await this.findById(id);

    if (request.status !== 'PENDING') {
      throw new AppError(400, 'Leave request is not pending');
    }

    const updated = await prisma.leaveRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        approverEmployeeId: approverId,
      },
      include: {
        employee: true,
        leaveType: true,
        approver: true,
      },
    });

    // Send email notification to employee
    try {
      await emailService.sendLeaveStatusNotification(
        updated.employee.email,
        `${updated.employee.firstName} ${updated.employee.lastName}`,
        updated.leaveType.name,
        format(updated.startDate, 'MMM dd, yyyy'),
        format(updated.endDate, 'MMM dd, yyyy'),
        'REJECTED',
        updated.approver ? `${updated.approver.firstName} ${updated.approver.lastName}` : undefined
      );
    } catch (error) {
      console.error('Failed to send leave rejection notification:', error);
      // Don't fail the rejection if email fails
    }

    return updated;
  },

  async cancel(id: string, employeeId: string): Promise<LeaveRequest> {
    const request = await this.findById(id);

    if (request.employeeId !== employeeId) {
      throw new AppError(403, 'You can only cancel your own leave requests');
    }

    if (!['PENDING', 'APPROVED'].includes(request.status)) {
      throw new AppError(400, 'Leave request cannot be cancelled');
    }

    const updated = await prisma.leaveRequest.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: {
        employee: true,
        leaveType: true,
      },
    });

    // If was approved, restore balance
    if (request.status === 'APPROVED') {
      const year = request.startDate.getFullYear();
      await prisma.leaveBalance.update({
        where: {
          employeeId_leaveTypeId_year: {
            employeeId: request.employeeId,
            leaveTypeId: request.leaveTypeId,
            year,
          },
        },
        data: {
          takenDays: { decrement: request.days },
          remainingDays: { increment: request.days },
        },
      });
    }

    return updated;
  },
};

