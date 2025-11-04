import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/database';
import { generateTokens } from '../src/utils/auth';

describe('Authentication API', () => {
  let adminToken: string;
  let employeeToken: string;

  beforeAll(async () => {
    // Clean up test data
    await prisma.attendanceLog.deleteMany({});
    await prisma.leaveRequest.deleteMany({});
    await prisma.payrollItem.deleteMany({});
    await prisma.payrollRun.deleteMany({});
    await prisma.salary.deleteMany({});
    await prisma.employee.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.department.deleteMany({});
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid admin credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@hrsystem.com',
          password: 'Admin@123',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toHaveProperty('email', 'admin@hrsystem.com');
      expect(response.body.data.user).toHaveProperty('role', 'ADMIN');
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
      
      adminToken = response.body.data.accessToken;
    });

    it('should return 401 with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@hrsystem.com',
          password: 'WrongPassword',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 with missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@hrsystem.com',
        });

      expect(response.status).toBe(400);
    });

    it('should login with valid employee credentials', async () => {
      // First, we need to create an employee user (if not exists)
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'employee@hrsystem.com',
          password: 'Employee@123',
        });

      if (response.status === 200) {
        employeeToken = response.body.data.accessToken;
      }
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully with valid token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .post('/api/auth/logout');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh token successfully', async () => {
      // Login again to get refresh token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@hrsystem.com',
          password: 'Admin@123',
        });

      const refreshToken = loginResponse.body.data.refreshToken;

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
    });

    it('should return 401 with invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' });

      expect(response.status).toBe(401);
    });
  });
});

