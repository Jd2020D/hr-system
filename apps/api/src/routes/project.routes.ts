import { Router } from 'express';
import { projectController } from '../controllers/project.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Projects CRUD (Admin, HR, Manager can manage)
router.get('/', projectController.findAll);
router.get('/:id', projectController.findById);
router.get('/:id/summary', projectController.getSummary);
router.post('/', authorize('ADMIN', 'HR', 'MANAGER'), projectController.create);
router.put('/:id', authorize('ADMIN', 'HR', 'MANAGER'), projectController.update);
router.delete('/:id', authorize('ADMIN', 'HR'), projectController.delete);

// Resources
router.get('/:projectId/resources', projectController.getResources);
router.post('/:projectId/resources', authorize('ADMIN', 'HR', 'MANAGER'), projectController.addResource);
router.put('/resources/:id', authorize('ADMIN', 'HR', 'MANAGER'), projectController.updateResource);
router.delete('/resources/:id', authorize('ADMIN', 'HR', 'MANAGER'), projectController.deleteResource);

// Expenses
router.get('/:projectId/expenses', projectController.getExpenses);
router.post('/:projectId/expenses', authorize('ADMIN', 'HR', 'MANAGER'), projectController.addExpense);
router.put('/expenses/:id', authorize('ADMIN', 'HR', 'MANAGER'), projectController.updateExpense);
router.delete('/expenses/:id', authorize('ADMIN', 'HR'), projectController.deleteExpense);

// Invoices
router.get('/:projectId/invoices', projectController.getInvoices);
router.post('/:projectId/invoices', authorize('ADMIN', 'HR', 'MANAGER'), projectController.addInvoice);
router.put('/invoices/:id', authorize('ADMIN', 'HR', 'MANAGER'), projectController.updateInvoice);
router.delete('/invoices/:id', authorize('ADMIN', 'HR'), projectController.deleteInvoice);

// Payments
router.get('/:projectId/payments', projectController.getPayments);
router.post('/:projectId/payments', authorize('ADMIN', 'HR', 'MANAGER'), projectController.addPayment);
router.put('/payments/:id', authorize('ADMIN', 'HR', 'MANAGER'), projectController.updatePayment);
router.delete('/payments/:id', authorize('ADMIN', 'HR'), projectController.deletePayment);

export default router;
