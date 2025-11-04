import { Router } from 'express';
import { attendanceController } from '../controllers/attendance.controller';
import { authenticate, authorize } from '../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

// Clock in/out routes (require employee role)
router.post('/clock-in', authenticate, authorize('EMPLOYEE', 'ADMIN', 'HR', 'MANAGER'), attendanceController.clockIn);
router.post('/clock-out', authenticate, authorize('EMPLOYEE', 'ADMIN', 'HR', 'MANAGER'), attendanceController.clockOut);

// View logs - authenticated users
router.get('/logs', authenticate, attendanceController.findAll);

// Edit logs - only admin/HR
router.put('/logs/:id', authenticate, authorize('ADMIN', 'HR'), attendanceController.update);

export default router;

