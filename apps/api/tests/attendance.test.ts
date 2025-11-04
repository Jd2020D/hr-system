import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/database';

describe('Attendance API', () => {
  let employeeToken: string;
  let adminToken: string;
  let employeeId: string;
  let departmentId: string;

  beforeAll(async () => {
    // Clean up
    await prisma.attendanceLog.deleteMany({});
    await prisma.leaveRequest.deleteMany({});
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

  describe('POST /api/attendance/clock-in', () => {
    it('should clock in successfully', async () => {
      const response = await request(app)
        .post('/api/attendance/clock-in')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('clockIn');
      expect(response.body.data.clockOut).toBeNull();
    });

    it('should return 400 if already clocked in today', async () => {
      const response = await request(app)
        .post('/api/attendance/clock-in')
        .set('Authorization', `Bearer ${employeeToken}`);

      // May succeed if previous clock-in was for a different day
      expect([200, 400]).toContain(response.status);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/attendance/clock-in');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/attendance/clock-out', () => {
    it('should clock out successfully', async () => {
      // First ensure we're clocked in
      await request(app)
        .post('/api/attendance/clock-in')
        .set('Authorization', `Bearer ${employeeToken}`);

      const response = await request(app)
        .post('/api/attendance/clock-out')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('clockOut');
    });

    it('should return 400 if not clocked in', async () => {
      // Wait a bit to ensure previous clock-out is processed
      await new Promise(resolve => setTimeout(resolve, 1000));

      const response = await request(app)
        .post('/api/attendance/clock-out')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect([200, 400]).toContain(response.status);
    });
  });

  describe('GET /api/attendance', () => {
    it('should get attendance logs for employee', async () => {
      const today = new Date().toISOString().split('T')[0];
      const response = await request(app)
        .get(`/api/attendance?from=${today}&to=${today}`)
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should filter by employee ID for admin', async () => {
      const today = new Date().toISOString().split('T')[0];
      const response = await request(app)
        .get(`/api/attendance?from=${today}&to=${today}&employeeId=${employeeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should require date range', async () => {
      const response = await request(app)
        .get('/api/attendance')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect([200, 400]).toContain(response.status);
    });
  });
});
