import { Router } from 'express';
import { employeeController } from '../controllers/employee.controller';
import { authenticate, authorize } from '../middleware/auth';
import { Role } from '@prisma/client';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Everyone can view employees
router.get('/', employeeController.findAll);

// Self-service endpoints for employees to manage their own profile (must come before /:id route)
router.get('/me/profile', employeeController.getMyProfile);
router.put('/me/profile', employeeController.updateMyProfile);

// Get employee by ID
router.get('/:id', employeeController.findById);

// Only HR and Admin can manage employees
router.post('/', authorize('ADMIN', 'HR'), employeeController.create);
router.put('/:id', authorize('ADMIN', 'HR'), employeeController.update);
router.delete('/:id', authorize('ADMIN', 'HR'), employeeController.delete);

// Salary management routes (HR and Admin only)
router.get('/:id/salaries', authorize('ADMIN', 'HR'), employeeController.getSalaries);
router.post('/:id/salaries', authorize('ADMIN', 'HR'), employeeController.createSalary);
router.put('/salaries/:salaryId', authorize('ADMIN', 'HR'), employeeController.updateSalary);
router.delete('/salaries/:salaryId', authorize('ADMIN', 'HR'), employeeController.deleteSalary);

export default router;

