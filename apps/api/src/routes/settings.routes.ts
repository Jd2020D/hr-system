import { Router } from 'express';
import { settingsController } from '../controllers/settings.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All settings routes require authentication and ADMIN/HR role
router.use(authenticate);
router.use(authorize('ADMIN', 'HR'));

// Departments
router.get('/departments', settingsController.getDepartments);
router.post('/departments', settingsController.createDepartment);
router.put('/departments/:id', settingsController.updateDepartment);
router.delete('/departments/:id', settingsController.deleteDepartment);

// Leave Types
router.get('/leave-types', settingsController.getLeaveTypes);
router.post('/leave-types', settingsController.createLeaveType);
router.put('/leave-types/:id', settingsController.updateLeaveType);
router.delete('/leave-types/:id', settingsController.deleteLeaveType);

// Shifts
router.get('/shifts', settingsController.getShifts);
router.post('/shifts', settingsController.createShift);
router.put('/shifts/:id', settingsController.updateShift);
router.delete('/shifts/:id', settingsController.deleteShift);

// Holidays
router.get('/holidays', settingsController.getHolidays);
router.post('/holidays', settingsController.createHoliday);
router.delete('/holidays/:id', settingsController.deleteHoliday);

// SMTP Configuration
router.get('/smtp', settingsController.getSMTPConfig);
router.put('/smtp', settingsController.updateSMTPConfig);
router.post('/smtp/test', settingsController.testSMTPConfig);

export default router;

