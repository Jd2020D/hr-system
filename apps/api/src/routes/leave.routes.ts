import { Router } from 'express';
import { leaveController } from '../controllers/leave.controller';
import { authenticate, authorize } from '../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);

// View requests
router.get('/requests', leaveController.findAll);
router.get('/requests/:id', leaveController.findById);

// Create request - employees only
router.post('/requests', authorize('EMPLOYEE', 'ADMIN', 'HR', 'MANAGER'), leaveController.create);

// Approve/reject - managers and above
router.put('/requests/:id/approve', authorize('MANAGER', 'HR', 'ADMIN'), leaveController.approve);
router.put('/requests/:id/reject', authorize('MANAGER', 'HR', 'ADMIN'), leaveController.reject);

// Cancel - employee or above
router.put('/requests/:id/cancel', authorize('EMPLOYEE', 'ADMIN', 'HR', 'MANAGER'), leaveController.cancel);

export default router;

