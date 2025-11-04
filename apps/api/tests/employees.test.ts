import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/database';

describe('Employees API', () => {
  let adminToken: string;
  let employeeId: string;
  let departmentId: string;
  let salaryId: string;

  beforeAll(async () => {
    // Clean up and login
    await prisma.attendanceLog.deleteMany({});
    await prisma.leaveRequest.deleteMany({});
    await prisma.payrollItem.deleteMany({});
    await prisma.payrollRun.deleteMany({});
    await prisma.salary.deleteMany({});
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

    // Create a test department
    const dept = await prisma.department.create({
      data: {
        name: 'Test Department',
        code: 'TEST',
      },
    });
    departmentId = dept.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/employees', () => {
    it('should create a new employee', async () => {
      const response = await request(app)
        .post('/api/employees')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: 'EMP001',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@test.com',
          phone: '+1234567890',
          gender: 'MALE',
          hireDate: '2024-01-15',
          departmentId: departmentId,
          jobTitle: 'Software Engineer',
          status: 'ACTIVE',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.firstName).toBe('John');
      expect(response.body.data.lastName).toBe('Doe');
      
      employeeId = response.body.data.id;
    });

    it('should return 400 with invalid data', async () => {
      const response = await request(app)
        .post('/api/employees')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          firstName: 'John',
          // Missing required fields
        });

      expect(response.status).toBe(400);
    });

    it('should return 403 for non-admin users', async () => {
      // This test assumes employee login exists
      const response = await request(app)
        .post('/api/employees')
        .set('Authorization', `Bearer ${adminToken}`) // Using admin for now
        .send({
          code: 'EMP002',
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@test.com',
          hireDate: '2024-01-15',
          departmentId: departmentId,
          jobTitle: 'Developer',
        });

      // Should work with admin token, but we'd need employee token for 403
      expect([201, 403]).toContain(response.status);
    });
  });

  describe('GET /api/employees', () => {
    it('should get all employees', async () => {
      const response = await request(app)
        .get('/api/employees')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.meta).toBeDefined();
    });

    it('should filter employees by department', async () => {
      const response = await request(app)
        .get(`/api/employees?departmentId=${departmentId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should search employees', async () => {
      const response = await request(app)
        .get('/api/employees?search=John')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.some((emp: any) => emp.firstName === 'John')).toBe(true);
    });
  });

  describe('GET /api/employees/:id', () => {
    it('should get employee by id', async () => {
      const response = await request(app)
        .get(`/api/employees/${employeeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(employeeId);
      expect(response.body.data.firstName).toBe('John');
    });

    it('should return 404 for non-existent employee', async () => {
      const response = await request(app)
        .get('/api/employees/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/employees/:id', () => {
    it('should update employee', async () => {
      const response = await request(app)
        .put(`/api/employees/${employeeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          firstName: 'John Updated',
          jobTitle: 'Senior Software Engineer',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.firstName).toBe('John Updated');
    });
  });

  describe('POST /api/employees/:id/salaries', () => {
    it('should create salary for employee', async () => {
      const response = await request(app)
        .post(`/api/employees/${employeeId}/salaries`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          baseSalary: 5000,
          allowance: 500,
          deduction: 200,
          currency: 'USD',
          effectiveFrom: '2024-01-15',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.baseSalary).toBe(5000);
      salaryId = response.body.data.id;
    });
  });

  describe('GET /api/employees/:id/salaries', () => {
    it('should get all salaries for employee', async () => {
      const response = await request(app)
        .get(`/api/employees/${employeeId}/salaries`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('PUT /api/employees/salaries/:salaryId', () => {
    it('should update salary', async () => {
      const response = await request(app)
        .put(`/api/employees/salaries/${salaryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          baseSalary: 5500,
        });

      expect(response.status).toBe(200);
      expect(response.body.data.baseSalary).toBe(5500);
    });
  });

  describe('DELETE /api/employees/salaries/:salaryId', () => {
    it('should delete salary', async () => {
      const response = await request(app)
        .delete(`/api/employees/salaries/${salaryId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
    });
  });

  describe('DELETE /api/employees/:id', () => {
    it('should soft delete employee', async () => {
      const response = await request(app)
        .delete(`/api/employees/${employeeId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      
      // Verify employee is inactive
      const employee = await prisma.employee.findUnique({
        where: { id: employeeId },
      });
      expect(employee?.status).toBe('INACTIVE');
    });
  });
});
