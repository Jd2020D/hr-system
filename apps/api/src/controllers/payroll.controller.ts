import { Request, Response } from 'express';
import { z } from 'zod';
import { payrollService } from '../services/payroll.service';
import { paginationSchema, dateRangeSchema } from '../utils/validation';
import { AuthenticatedRequest } from '../types';

const createPayrollRunSchema = z.object({
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
  notes: z.string().optional(),
});

export const payrollController = {
  async findAll(req: AuthenticatedRequest, res: Response) {
    const filters = { ...paginationSchema.parse(req.query), ...dateRangeSchema.parse(req.query) };
    const result = await payrollService.findAll(filters as any);

    res.json({
      success: true,
      ...result,
    });
  },

  async findById(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const run = await payrollService.findById(id);

    res.json({
      success: true,
      data: run,
    });
  },

  async create(req: AuthenticatedRequest, res: Response) {
    const data = createPayrollRunSchema.parse(req.body);

    const processedData = {
      ...data,
      periodStart: new Date(data.periodStart),
      periodEnd: new Date(data.periodEnd),
    };

    const run = await payrollService.create(processedData);

    res.status(201).json({
      success: true,
      message: 'Payroll run created successfully',
      data: run,
    });
  },

  async prepare(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const run = await payrollService.prepare(id);

    res.json({
      success: true,
      message: 'Payroll run prepared successfully',
      data: run,
    });
  },

  async approve(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const run = await payrollService.approve(id);

    res.json({
      success: true,
      message: 'Payroll run approved',
      data: run,
    });
  },

  async pay(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const run = await payrollService.pay(id);

    res.json({
      success: true,
      message: 'Payroll run marked as paid',
      data: run,
    });
  },
};

