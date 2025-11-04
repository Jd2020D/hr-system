import { Request, Response } from 'express';
import { attendanceService } from '../services/attendance.service';
import { paginationSchema, dateRangeSchema } from '../utils/validation';
import { AuthenticatedRequest } from '../types';

export const attendanceController = {
  async clockIn(req: AuthenticatedRequest, res: Response) {
    const employeeId = req.user!.employeeId!;
    const ipAddress = req.ip || req.socket.remoteAddress || undefined;
    const deviceInfo = req.get('User-Agent');

    const log = await attendanceService.clockIn(employeeId, 'WEB', ipAddress, deviceInfo);

    res.json({
      success: true,
      message: 'Clocked in successfully',
      data: log,
    });
  },

  async clockOut(req: AuthenticatedRequest, res: Response) {
    const employeeId = req.user!.employeeId!;
    const ipAddress = req.ip || req.socket.remoteAddress || undefined;
    const deviceInfo = req.get('User-Agent');

    const log = await attendanceService.clockOut(employeeId, 'WEB', ipAddress, deviceInfo);

    res.json({
      success: true,
      message: 'Clocked out successfully',
      data: log,
    });
  },

  async findAll(req: AuthenticatedRequest, res: Response) {
    const filters = { ...paginationSchema.parse(req.query), ...dateRangeSchema.parse(req.query) };
    const result = await attendanceService.findAll(filters as any);

    res.json({
      success: true,
      ...result,
    });
  },

  async update(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const data = req.body;

    const log = await attendanceService.update(id, data);

    res.json({
      success: true,
      message: 'Attendance log updated successfully',
      data: log,
    });
  },
};

