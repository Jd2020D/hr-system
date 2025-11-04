import { Router } from 'express';
import { payrollController } from '../controllers/payroll.controller';
import { authenticate, authorize } from '../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

router.use(authenticate);
router.use(authorize('ADMIN', 'HR')); // Only HR and Admin can access payroll

router.get('/runs', payrollController.findAll);
router.get('/runs/:id', payrollController.findById);
router.post('/runs', payrollController.create);
router.post('/runs/:id/prepare', payrollController.prepare);
router.post('/runs/:id/approve', payrollController.approve);
router.post('/runs/:id/pay', payrollController.pay);

export default router;

