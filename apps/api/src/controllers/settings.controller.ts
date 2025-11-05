import { Request, Response } from 'express';
import { z, ZodError } from 'zod';
import { settingsService } from '../services/settings.service';
import { emailService } from '../services/email.service';
import { AuthenticatedRequest } from '../types';

const departmentSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1).max(50),
  managerEmployeeId: z.string().uuid().optional(),
});

const leaveTypeSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1).max(50),
  defaultDaysPerYear: z.number().int().min(0),
  requiresAttachment: z.boolean().optional(),
});

const shiftSchema = z.object({
  name: z.string().min(1),
  startTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/),
  endTime: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/),
  graceMinutesIn: z.number().int().min(0).optional(),
  graceMinutesOut: z.number().int().min(0).optional(),
  isDefault: z.boolean().optional(),
});

const holidaySchema = z.object({
  date: z.string(),
  name: z.string().min(1),
  countryCode: z.string().min(2).max(10).default('AE'),
});

const smtpConfigSchema = z.object({
  host: z.string().min(1, 'SMTP host is required'),
  port: z.preprocess(
    (val) => {
      if (typeof val === 'string') {
        const num = parseInt(val, 10);
        return isNaN(num) ? val : num;
      }
      return val;
    },
    z.number().int().min(1).max(65535, 'Port must be between 1 and 65535')
  ),
  secure: z.boolean().optional(),
  user: z.string().email('Valid email address is required'),
  pass: z.string().min(1, 'SMTP password is required'),
  from: z.preprocess(
    (val) => {
      if (typeof val === 'string' && val.trim() === '') {
        return undefined;
      }
      return val;
    },
    z.string().email('Valid email address is required').optional()
  ),
});

export const settingsController = {
  // ===== DEPARTMENTS =====
  async getDepartments(req: AuthenticatedRequest, res: Response) {
    const departments = await settingsService.getDepartments();
    res.json({ success: true, data: departments });
  },

  async createDepartment(req: AuthenticatedRequest, res: Response) {
    const data = departmentSchema.parse(req.body);
    const department = await settingsService.createDepartment(data);
    res.status(201).json({
      success: true,
      message: 'Department created successfully',
      data: department,
    });
  },

  async updateDepartment(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const data = departmentSchema.partial().parse(req.body);
    const department = await settingsService.updateDepartment(id, data);
    res.json({
      success: true,
      message: 'Department updated successfully',
      data: department,
    });
  },

  async deleteDepartment(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    await settingsService.deleteDepartment(id);
    res.json({
      success: true,
      message: 'Department deleted successfully',
    });
  },

  // ===== LEAVE TYPES =====
  async getLeaveTypes(req: AuthenticatedRequest, res: Response) {
    const leaveTypes = await settingsService.getLeaveTypes();
    res.json({ success: true, data: leaveTypes });
  },

  async createLeaveType(req: AuthenticatedRequest, res: Response) {
    const data = leaveTypeSchema.parse(req.body);
    const leaveType = await settingsService.createLeaveType(data);
    res.status(201).json({
      success: true,
      message: 'Leave type created successfully',
      data: leaveType,
    });
  },

  async updateLeaveType(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const data = leaveTypeSchema.partial().parse(req.body);
    const leaveType = await settingsService.updateLeaveType(id, data);
    res.json({
      success: true,
      message: 'Leave type updated successfully',
      data: leaveType,
    });
  },

  async deleteLeaveType(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    await settingsService.deleteLeaveType(id);
    res.json({
      success: true,
      message: 'Leave type deleted successfully',
    });
  },

  // ===== SHIFTS =====
  async getShifts(req: AuthenticatedRequest, res: Response) {
    const shifts = await settingsService.getShifts();
    res.json({ success: true, data: shifts });
  },

  async createShift(req: AuthenticatedRequest, res: Response) {
    const data = shiftSchema.parse(req.body);
    const shift = await settingsService.createShift(data);
    res.status(201).json({
      success: true,
      message: 'Shift created successfully',
      data: shift,
    });
  },

  async updateShift(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const data = shiftSchema.partial().parse(req.body);
    const shift = await settingsService.updateShift(id, data);
    res.json({
      success: true,
      message: 'Shift updated successfully',
      data: shift,
    });
  },

  async deleteShift(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    await settingsService.deleteShift(id);
    res.json({
      success: true,
      message: 'Shift deleted successfully',
    });
  },

  // ===== HOLIDAYS =====
  async getHolidays(req: AuthenticatedRequest, res: Response) {
    const year = req.query.year ? parseInt(req.query.year as string) : undefined;
    const holidays = await settingsService.getHolidays(year);
    res.json({ success: true, data: holidays });
  },

  async createHoliday(req: AuthenticatedRequest, res: Response) {
    const data = holidaySchema.parse(req.body);
    const holiday = await settingsService.createHoliday({
      ...data,
      date: new Date(data.date),
    });
    res.status(201).json({
      success: true,
      message: 'Holiday created successfully',
      data: holiday,
    });
  },

  async deleteHoliday(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    await settingsService.deleteHoliday(id);
    res.json({
      success: true,
      message: 'Holiday deleted successfully',
    });
  },

  // ===== SMTP CONFIGURATION =====
  async getSMTPConfig(req: AuthenticatedRequest, res: Response) {
    const config = await settingsService.getSMTPConfig();
    res.json({ success: true, data: config });
  },

  async updateSMTPConfig(req: AuthenticatedRequest, res: Response) {
    try {
      const data = smtpConfigSchema.parse(req.body);
      const config = await settingsService.updateSMTPConfig(data);
      
      // Reinitialize email service with new config (don't fail if this fails)
      try {
        await emailService.initialize();
      } catch (emailError) {
        console.warn('Failed to initialize email service:', emailError);
        // Continue anyway - config is saved, just email won't work until fixed
      }
      
      res.json({
        success: true,
        message: 'SMTP configuration updated successfully',
        data: config,
      });
    } catch (error: any) {
      console.error('Error in updateSMTPConfig:', error);
      
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map(e => {
          const path = e.path.join('.');
          return `${path ? path + ': ' : ''}${e.message}`;
        }).join('; ');
        
        return res.status(400).json({
          success: false,
          message: `Validation error: ${errorMessages}`,
          errors: error.errors,
        });
      }
      
      // If it's an AppError, it will be handled by the error handler middleware
      // But we can provide more context here
      if (error.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      }
      
      throw error;
    }
  },

  async testSMTPConfig(req: AuthenticatedRequest, res: Response) {
    try {
      const { email } = req.body;
      if (!email || !z.string().email().safeParse(email).success) {
        return res.status(400).json({
          success: false,
          message: 'Valid email address is required',
        });
      }

      const result = await emailService.testEmail(email);
      
      // Return in standard API response format
      res.json({
        success: result.success,
        message: result.message,
        data: result,
      });
    } catch (error: any) {
      console.error('Error in testSMTPConfig:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to send test email',
      });
    }
  },
};

