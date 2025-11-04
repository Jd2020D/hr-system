import { Request, Response } from 'express';
import { z } from 'zod';
import { projectService } from '../services/project.service';
import { paginationSchema, dateRangeSchema } from '../utils/validation';
import { AuthenticatedRequest } from '../types';

const dateOrDateTimeSchema = z.string().refine(
  (val) => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const dateTimeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
    return dateRegex.test(val) || dateTimeRegex.test(val) || !isNaN(Date.parse(val));
  },
  { message: 'Invalid date format. Expected yyyy-MM-dd or ISO datetime string' }
);

const createProjectSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(['LEAD', 'PLANNING', 'RUNNING', 'ON_HOLD', 'COMPLETED', 'CANCELLED']).optional(),
  budget: z.number().min(0),
  currency: z.enum(['USD', 'JD', 'AED']).optional(),
  startDate: dateOrDateTimeSchema.nullable().optional(),
  endDate: dateOrDateTimeSchema.nullable().optional(),
  clientName: z.string().optional(),
  clientEmail: z.string().email().optional(),
  managerEmployeeId: z.string().uuid().optional(),
  notes: z.string().optional(),
});

const updateProjectSchema = createProjectSchema.partial();

const addResourceSchema = z.object({
  employeeId: z.string().uuid(),
  role: z.string().optional(),
  allocation: z.number().min(0).max(100).optional(),
  hourlyRate: z.number().min(0).optional(),
  startDate: dateOrDateTimeSchema,
  endDate: dateOrDateTimeSchema.nullable().optional(),
  notes: z.string().optional(),
});

const updateResourceSchema = addResourceSchema.partial();

const addExpenseSchema = z.object({
  category: z.string().min(1),
  description: z.string().min(1),
  amount: z.number().positive(),
  currency: z.enum(['USD', 'JD', 'AED']).optional(),
  expenseDate: dateOrDateTimeSchema,
  vendor: z.string().optional(),
  receiptUrl: z.string().url().optional(),
  notes: z.string().optional(),
});

const updateExpenseSchema = addExpenseSchema.partial();

const addInvoiceSchema = z.object({
  invoiceNumber: z.string().min(1),
  amount: z.number().positive(),
  currency: z.enum(['USD', 'JD', 'AED']).optional(),
  issueDate: dateOrDateTimeSchema,
  dueDate: dateOrDateTimeSchema,
  description: z.string().optional(),
  status: z.string().optional(),
  attachmentUrl: z.string().url().optional(),
  notes: z.string().optional(),
});

const updateInvoiceSchema = addInvoiceSchema.partial();

const addPaymentSchema = z.object({
  invoiceId: z.string().uuid().optional(),
  amount: z.number().positive(),
  currency: z.enum(['USD', 'JD', 'AED']).optional(),
  paymentDate: dateOrDateTimeSchema,
  paymentMethod: z.string().min(1),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

const updatePaymentSchema = addPaymentSchema.partial();

export const projectController = {
  // ===== PROJECTS =====
  async findAll(req: AuthenticatedRequest, res: Response) {
    const filters = paginationSchema.parse(req.query);
    const result = await projectService.findAll(filters as any);
    res.json({ success: true, ...result });
  },

  async findById(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const project = await projectService.findById(id);
    res.json({ success: true, data: project });
  },

  async create(req: AuthenticatedRequest, res: Response) {
    const data = createProjectSchema.parse(req.body);
    const processedData = {
      ...data,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
    };
    const project = await projectService.create(processedData as any);
    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: project,
    });
  },

  async update(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const data = updateProjectSchema.parse(req.body);
    const processedData = {
      ...data,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
    };
    const project = await projectService.update(id, processedData as any);
    res.json({
      success: true,
      message: 'Project updated successfully',
      data: project,
    });
  },

  async delete(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    await projectService.delete(id);
    res.json({ success: true, message: 'Project deleted successfully' });
  },

  async getSummary(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const summary = await projectService.getSummary(id);
    res.json({ success: true, data: summary });
  },

  // ===== RESOURCES =====
  async getResources(req: AuthenticatedRequest, res: Response) {
    const { projectId } = req.params;
    const resources = await projectService.getResources(projectId);
    res.json({ success: true, data: resources });
  },

  async addResource(req: AuthenticatedRequest, res: Response) {
    const { projectId } = req.params;
    const data = addResourceSchema.parse(req.body);
    const processedData = {
      ...data,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
      createdById: req.user?.employeeId,
    };
    const resource = await projectService.addResource(projectId, processedData as any);
    res.status(201).json({
      success: true,
      message: 'Resource added successfully',
      data: resource,
    });
  },

  async updateResource(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const data = updateResourceSchema.parse(req.body);
    const processedData = {
      ...data,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
    };
    const resource = await projectService.updateResource(id, processedData as any);
    res.json({
      success: true,
      message: 'Resource updated successfully',
      data: resource,
    });
  },

  async deleteResource(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    await projectService.deleteResource(id);
    res.json({ success: true, message: 'Resource removed successfully' });
  },

  // ===== EXPENSES =====
  async getExpenses(req: AuthenticatedRequest, res: Response) {
    const { projectId } = req.params;
    const filters = paginationSchema.merge(dateRangeSchema).parse(req.query);
    const result = await projectService.getExpenses(projectId, filters as any);
    res.json({ success: true, ...result });
  },

  async addExpense(req: AuthenticatedRequest, res: Response) {
    const { projectId } = req.params;
    const data = addExpenseSchema.parse(req.body);
    const processedData = {
      ...data,
      expenseDate: new Date(data.expenseDate),
      createdById: req.user?.employeeId,
    };
    const expense = await projectService.addExpense(projectId, processedData as any);
    res.status(201).json({
      success: true,
      message: 'Expense added successfully',
      data: expense,
    });
  },

  async updateExpense(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const data = updateExpenseSchema.parse(req.body);
    const processedData = {
      ...data,
      expenseDate: data.expenseDate ? new Date(data.expenseDate) : undefined,
    };
    const expense = await projectService.updateExpense(id, processedData as any);
    res.json({
      success: true,
      message: 'Expense updated successfully',
      data: expense,
    });
  },

  async deleteExpense(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    await projectService.deleteExpense(id);
    res.json({ success: true, message: 'Expense deleted successfully' });
  },

  // ===== INVOICES =====
  async getInvoices(req: AuthenticatedRequest, res: Response) {
    const { projectId } = req.params;
    const filters = paginationSchema.merge(dateRangeSchema).parse(req.query);
    const result = await projectService.getInvoices(projectId, filters as any);
    res.json({ success: true, ...result });
  },

  async addInvoice(req: AuthenticatedRequest, res: Response) {
    const { projectId } = req.params;
    const data = addInvoiceSchema.parse(req.body);
    const processedData = {
      ...data,
      issueDate: new Date(data.issueDate),
      dueDate: new Date(data.dueDate),
    };
    const invoice = await projectService.addInvoice(projectId, processedData as any);
    res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      data: invoice,
    });
  },

  async updateInvoice(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const data = updateInvoiceSchema.parse(req.body);
    const processedData = {
      ...data,
      issueDate: data.issueDate ? new Date(data.issueDate) : undefined,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
    };
    const invoice = await projectService.updateInvoice(id, processedData as any);
    res.json({
      success: true,
      message: 'Invoice updated successfully',
      data: invoice,
    });
  },

  async deleteInvoice(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    await projectService.deleteInvoice(id);
    res.json({ success: true, message: 'Invoice deleted successfully' });
  },

  // ===== PAYMENTS =====
  async getPayments(req: AuthenticatedRequest, res: Response) {
    const { projectId } = req.params;
    const filters = paginationSchema.merge(dateRangeSchema).parse(req.query);
    const result = await projectService.getPayments(projectId, filters as any);
    res.json({ success: true, ...result });
  },

  async addPayment(req: AuthenticatedRequest, res: Response) {
    const { projectId } = req.params;
    const data = addPaymentSchema.parse(req.body);
    const processedData = {
      ...data,
      paymentDate: new Date(data.paymentDate),
    };
    const payment = await projectService.addPayment(projectId, processedData as any);
    res.status(201).json({
      success: true,
      message: 'Payment recorded successfully',
      data: payment,
    });
  },

  async updatePayment(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const data = updatePaymentSchema.parse(req.body);
    const processedData = {
      ...data,
      paymentDate: data.paymentDate ? new Date(data.paymentDate) : undefined,
    };
    const payment = await projectService.updatePayment(id, processedData as any);
    res.json({
      success: true,
      message: 'Payment updated successfully',
      data: payment,
    });
  },

  async deletePayment(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    await projectService.deletePayment(id);
    res.json({ success: true, message: 'Payment deleted successfully' });
  },
};
