import { Request, Response } from 'express';
import { z } from 'zod';
import { leaveService } from '../services/leave.service';
import { paginationSchema } from '../utils/validation';
import { AuthenticatedRequest } from '../types';

const createLeaveRequestSchema = z.object({
  leaveTypeId: z.string().uuid(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  reason: z.string().optional(),
  attachmentUrl: z.string().url().optional(),
});

export const leaveController = {
  async findAll(req: AuthenticatedRequest, res: Response) {
    const filters = paginationSchema.parse(req.query);
    const result = await leaveService.findAll(filters as any);

    res.json({
      success: true,
      ...result,
    });
  },

  async findById(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const request = await leaveService.findById(id);

    res.json({
      success: true,
      data: request,
    });
  },

  async create(req: AuthenticatedRequest, res: Response) {
    const employeeId = req.user!.employeeId!;
    const data = createLeaveRequestSchema.parse(req.body);

    const processedData = {
      ...data,
      employeeId,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
    };

    const request = await leaveService.create(processedData);

    res.status(201).json({
      success: true,
      message: 'Leave request created successfully',
      data: request,
    });
  },

  async approve(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const approverId = req.user!.employeeId!;

    const request = await leaveService.approve(id, approverId);

    res.json({
      success: true,
      message: 'Leave request approved',
      data: request,
    });
  },

  async reject(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const approverId = req.user!.employeeId!;

    const request = await leaveService.reject(id, approverId);

    res.json({
      success: true,
      message: 'Leave request rejected',
      data: request,
    });
  },

  async cancel(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const employeeId = req.user!.employeeId!;

    const request = await leaveService.cancel(id, employeeId);

    res.json({
      success: true,
      message: 'Leave request cancelled',
      data: request,
    });
  },
};

