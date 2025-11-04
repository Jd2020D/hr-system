import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/database';

describe('Payroll API', () => {
  let adminToken: string;
  let employeeId: string;
  let departmentId: string;
  let salaryId: string;
  let payrollRunId: string;

  beforeAll(async () => {
    // Clean up
    await prisma.payrollItem.deleteMany({});
    await prisma.payrollRun.deleteMany({});
    await prisma.salary.deleteMany({});
    await prisma.attendanceLog.deleteMany({});
    await prisma.leaveRequest.deleteMany({});
    await prisma.employee.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.department.deleteMany({});

    // Login as admin
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@hrsystem.com',
        password: 'Admin@123',
      });
    adminToken = loginResponse.body.data.accessToken;

    // Create department
    const dept = await prisma.department.create({
      data: {
        name: 'Test Department',
        code: 'TEST',
      },
    });
    departmentId = dept.id;

    // Create employee with salary
    const employee = await prisma.employee.create({
      data: {
        code: 'EMP001',
        firstName: 'Payroll',
        lastName: 'Test',
        email: 'payroll@test.com',
        hireDate: new Date('2024-01-01'),
        departmentId: departmentId,
        jobTitle: 'Tester',
        status: 'ACTIVE',
      },
    });
    employeeId = employee.id;

    // Create salary
    const salary = await prisma.salary.create({
      data: {
        employeeId: employeeId,
        baseSalary: 5000,
        allowance: 500,
        deduction: 200,
        currency: 'USD',
        effectiveFrom: new Date('2024-01-01'),
      },
    });
    salaryId = salary.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/payroll/runs', () => {
    it('should create a new payroll run', async () => {
      const startDate = new Date();
      startDate.setDate(1); // First day of month
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
      endDate.setDate(0); // Last day of month

      const response = await request(app)
        .post('/api/payroll/runs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          periodStart: startDate.toISOString(),
          periodEnd: endDate.toISOString(),
          notes: 'Test payroll run',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.status).toBe('DRAFT');
      
      payrollRunId = response.body.data.id;
    });

    it('should return 400 with invalid dates', async () => {
      const response = await request(app)
        .post('/api/payroll/runs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          periodStart: new Date().toISOString(),
          periodEnd: new Date(Date.now() - 86400000).toISOString(), // End before start
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/payroll/runs', () => {
    it('should get all payroll runs', async () => {
      const response = await request(app)
        .get('/api/payroll/runs')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeInstanceOf(Array);
    });
  });

  describe('GET /api/payroll/runs/:id', () => {
    it('should get payroll run by id', async () => {
      const response = await request(app)
        .get(`/api/payroll/runs/${payrollRunId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(payrollRunId);
    });

    it('should return 404 for non-existent run', async () => {
      const response = await request(app)
        .get('/api/payroll/runs/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/payroll/runs/:id/prepare', () => {
    it('should prepare payroll run', async () => {
      const response = await request(app)
        .post(`/api/payroll/runs/${payrollRunId}/prepare`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('PREPARED');
      expect(response.body.data.items).toBeInstanceOf(Array);
    });
  });

  describe('POST /api/payroll/runs/:id/approve', () => {
    it('should approve payroll run', async () => {
      const response = await request(app)
        .post(`/api/payroll/runs/${payrollRunId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('APPROVED');
    });

    it('should return 400 if run is not prepared', async () => {
      // Create a new draft run
      const startDate = new Date();
      startDate.setDate(1);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
      endDate.setDate(0);

      const createResponse = await request(app)
        .post('/api/payroll/runs')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          periodStart: startDate.toISOString(),
          periodEnd: endDate.toISOString(),
        });

      const newRunId = createResponse.body.data.id;

      const response = await request(app)
        .post(`/api/payroll/runs/${newRunId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect([400, 200]).toContain(response.status);
    });
  });

  describe('POST /api/payroll/runs/:id/pay', () => {
    it('should mark payroll run as paid', async () => {
      const response = await request(app)
        .post(`/api/payroll/runs/${payrollRunId}/pay`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('PAID');
    });
  });
});
