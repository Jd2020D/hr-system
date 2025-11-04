import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/database';

describe('Leaves API', () => {
  let employeeToken: string;
  let adminToken: string;
  let employeeId: string;
  let departmentId: string;
  let leaveTypeId: string;
  let leaveRequestId: string;

  beforeAll(async () => {
    // Clean up
    await prisma.leaveRequest.deleteMany({});
    await prisma.leaveBalance.deleteMany({});
    await prisma.leaveType.deleteMany({});
    await prisma.attendanceLog.deleteMany({});
    await prisma.payrollItem.deleteMany({});
    await prisma.payrollRun.deleteMany({});
    await prisma.salary.deleteMany({});
    await prisma.employee.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.department.deleteMany({});

    // Create department
    const dept = await prisma.department.create({
      data: {
        name: 'Test Department',
        code: 'TEST',
      },
    });
    departmentId = dept.id;

    // Create leave type
    const leaveType = await prisma.leaveType.create({
      data: {
        name: 'Annual Leave',
        code: 'AL',
        defaultDaysPerYear: 21,
        requiresAttachment: false,
      },
    });
    leaveTypeId = leaveType.id;

    // Create employee
    const employee = await prisma.employee.create({
      data: {
        code: 'EMP001',
        firstName: 'Test',
        lastName: 'Employee',
        email: 'employee@test.com',
        hireDate: new Date('2024-01-15'),
        departmentId: departmentId,
        jobTitle: 'Tester',
        status: 'ACTIVE',
      },
    });
    employeeId = employee.id;

    // Create user for employee
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('Employee@123', 10);
    await prisma.user.create({
      data: {
        email: 'employee@test.com',
        passwordHash: hashedPassword,
        role: 'EMPLOYEE',
        employeeId: employeeId,
      },
    });

    // Create leave balance
    await prisma.leaveBalance.create({
      data: {
        employeeId: employeeId,
        leaveTypeId: leaveTypeId,
        year: new Date().getFullYear(),
        allocatedDays: 21,
        takenDays: 0,
        remainingDays: 21,
      },
    });

    // Login as employee
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'employee@test.com',
        password: 'Employee@123',
      });
    employeeToken = loginResponse.body.data.accessToken;

    // Login as admin
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@hrsystem.com',
        password: 'Admin@123',
      });
    adminToken = adminLogin.body.data.accessToken;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/leaves/requests', () => {
    it('should create leave request', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 7);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 2);

      const response = await request(app)
        .post('/api/leaves/requests')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          leaveTypeId: leaveTypeId,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          reason: 'Vacation',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.status).toBe('PENDING');
      
      leaveRequestId = response.body.data.id;
    });

    it('should return 400 with invalid dates', async () => {
      const response = await request(app)
        .post('/api/leaves/requests')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          leaveTypeId: leaveTypeId,
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() - 86400000).toISOString(), // Yesterday
          reason: 'Test',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/leaves/requests', () => {
    it('should get leave requests for employee', async () => {
      const response = await request(app)
        .get('/api/leaves/requests')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should filter by status', async () => {
      const response = await request(app)
        .get('/api/leaves/requests?status=PENDING')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeInstanceOf(Array);
    });
  });

  describe('POST /api/leaves/requests/:id/approve', () => {
    it('should approve leave request', async () => {
      const response = await request(app)
        .post(`/api/leaves/requests/${leaveRequestId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('APPROVED');
    });

    it('should return 404 for non-existent request', async () => {
      const response = await request(app)
        .post('/api/leaves/requests/non-existent-id/approve')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/leaves/requests/:id/reject', () => {
    it('should reject leave request', async () => {
      // Create a new request to reject
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 14);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);

      const createResponse = await request(app)
        .post('/api/leaves/requests')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          leaveTypeId: leaveTypeId,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          reason: 'Test rejection',
        });

      const newRequestId = createResponse.body.data.id;

      const response = await request(app)
        .post(`/api/leaves/requests/${newRequestId}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          rejectionReason: 'Not enough balance',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('REJECTED');
    });
  });

  describe('POST /api/leaves/requests/:id/cancel', () => {
    it('should cancel leave request', async () => {
      // Create a new request to cancel
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 21);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);

      const createResponse = await request(app)
        .post('/api/leaves/requests')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          leaveTypeId: leaveTypeId,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          reason: 'Test cancellation',
        });

      const newRequestId = createResponse.body.data.id;

      const response = await request(app)
        .post(`/api/leaves/requests/${newRequestId}/cancel`)
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('CANCELLED');
    });
  });

  describe('GET /api/leaves/balances', () => {
    it('should get leave balances for employee', async () => {
      const response = await request(app)
        .get('/api/leaves/balances')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeInstanceOf(Array);
    });
  });
});
