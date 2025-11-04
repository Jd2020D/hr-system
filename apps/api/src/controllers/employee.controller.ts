import { Request, Response } from 'express';
import { z } from 'zod';
import { employeeService } from '../services/employee.service';
import { paginationSchema, dateRangeSchema } from '../utils/validation';
import { AuthenticatedRequest } from '../types';

// Helper to validate date or datetime string
const dateOrDateTimeSchema = z.string().refine(
  (val) => {
    // Accept date strings (yyyy-MM-dd) or datetime strings
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const dateTimeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
    return dateRegex.test(val) || dateTimeRegex.test(val) || !isNaN(Date.parse(val));
  },
  { message: 'Invalid date format. Expected yyyy-MM-dd or ISO datetime string' }
);

const createEmployeeSchema = z.object({
  code: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  gender: z.string().optional(),
  dob: dateOrDateTimeSchema.optional(),
  hireDate: dateOrDateTimeSchema,
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  departmentId: z.string().uuid(),
  jobTitle: z.string().min(1),
  managerEmployeeId: z.string().uuid().optional(),
  address: z.string().optional(),
  nationalId: z.string().optional(),
  emergencyContact: z.any().optional(),
});

const updateEmployeeSchema = createEmployeeSchema.partial();

const createSalarySchema = z.object({
  baseSalary: z.number().positive(),
  allowance: z.number().min(0).optional(),
  deduction: z.number().min(0).optional(),
  currency: z.enum(['USD', 'JD', 'AED']).optional(),
  effectiveFrom: dateOrDateTimeSchema,
  effectiveTo: dateOrDateTimeSchema.nullable().optional(),
});

const updateSalarySchema = z.object({
  baseSalary: z.number().positive().optional(),
  allowance: z.number().min(0).optional(),
  deduction: z.number().min(0).optional(),
  currency: z.enum(['USD', 'JD', 'AED']).optional(),
  effectiveFrom: dateOrDateTimeSchema.optional(),
  effectiveTo: dateOrDateTimeSchema.nullable().optional(),
});

export const employeeController = {
  async findAll(req: AuthenticatedRequest, res: Response) {
    const filters = paginationSchema.parse(req.query);
    const result = await employeeService.findAll(filters as any);

    res.json({
      success: true,
      ...result,
    });
  },

  async findById(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const employee = await employeeService.findById(id);

    res.json({
      success: true,
      data: employee,
    });
  },

  async create(req: AuthenticatedRequest, res: Response) {
    const data = createEmployeeSchema.parse(req.body);
    
    // Convert date strings to Date objects
    const processedData = {
      ...data,
      dob: data.dob ? new Date(data.dob) : undefined,
      hireDate: new Date(data.hireDate),
    };

    const employee = await employeeService.create(processedData as any);

    res.status(201).json({
      success: true,
      message: 'Employee created successfully',
      data: employee,
    });
  },

  async update(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const data = updateEmployeeSchema.parse(req.body);

    const processedData: any = { ...data };
    if (data.dob) processedData.dob = new Date(data.dob);
    if (data.hireDate) processedData.hireDate = new Date(data.hireDate);

    const employee = await employeeService.update(id, processedData);

    res.json({
      success: true,
      message: 'Employee updated successfully',
      data: employee,
    });
  },

  async delete(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    await employeeService.delete(id);

    res.json({
      success: true,
      message: 'Employee deleted successfully',
    });
  },

  // Salary management endpoints
  async getSalaries(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const salaries = await employeeService.getSalaries(id);

    res.json({
      success: true,
      data: salaries,
    });
  },

  async createSalary(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const data = createSalarySchema.parse(req.body);

    const salary = await employeeService.createSalary(id, {
      baseSalary: data.baseSalary,
      allowance: data.allowance || 0,
      deduction: data.deduction || 0,
      currency: data.currency || 'AED',
      effectiveFrom: new Date(data.effectiveFrom),
      effectiveTo: data.effectiveTo ? new Date(data.effectiveTo) : null,
    });

    res.status(201).json({
      success: true,
      message: 'Salary created successfully',
      data: salary,
    });
  },

  async updateSalary(req: AuthenticatedRequest, res: Response) {
    const { salaryId } = req.params;
    const data = updateSalarySchema.parse(req.body);

    const updateData: any = {};
    if (data.baseSalary !== undefined) updateData.baseSalary = data.baseSalary;
    if (data.allowance !== undefined) updateData.allowance = data.allowance;
    if (data.deduction !== undefined) updateData.deduction = data.deduction;
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.effectiveFrom) updateData.effectiveFrom = new Date(data.effectiveFrom);
    if (data.effectiveTo !== undefined) updateData.effectiveTo = data.effectiveTo ? new Date(data.effectiveTo) : null;

    const salary = await employeeService.updateSalary(salaryId, updateData);

    res.json({
      success: true,
      message: 'Salary updated successfully',
      data: salary,
    });
  },

  async deleteSalary(req: AuthenticatedRequest, res: Response) {
    const { salaryId } = req.params;
    await employeeService.deleteSalary(salaryId);

    res.json({
      success: true,
      message: 'Salary deleted successfully',
    });
  },
};

