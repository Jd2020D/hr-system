import request from 'supertest';
import app from '../src/app';
import { prisma } from '../src/config/database';

describe('Settings API', () => {
  let adminToken: string;
  let departmentId: string;
  let leaveTypeId: string;
  let shiftId: string;
  let holidayId: string;

  beforeAll(async () => {
    // Clean up
    await prisma.holiday.deleteMany({});
    await prisma.shift.deleteMany({});
    await prisma.leaveType.deleteMany({});
    await prisma.department.deleteMany({});

    // Login as admin
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@hrsystem.com',
        password: 'Admin@123',
      });
    adminToken = loginResponse.body.data.accessToken;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Departments', () => {
    describe('POST /api/settings/departments', () => {
      it('should create a department', async () => {
        const response = await request(app)
          .post('/api/settings/departments')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Engineering',
            code: 'ENG',
          });

        expect(response.status).toBe(201);
        expect(response.body.data.name).toBe('Engineering');
        departmentId = response.body.data.id;
      });
    });

    describe('GET /api/settings/departments', () => {
      it('should get all departments', async () => {
        const response = await request(app)
          .get('/api/settings/departments')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.data).toBeInstanceOf(Array);
      });
    });

    describe('PUT /api/settings/departments/:id', () => {
      it('should update department', async () => {
        const response = await request(app)
          .put(`/api/settings/departments/${departmentId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Engineering Updated',
          });

        expect(response.status).toBe(200);
        expect(response.body.data.name).toBe('Engineering Updated');
      });
    });

    describe('DELETE /api/settings/departments/:id', () => {
      it('should delete department', async () => {
        // Create a new department to delete
        const createResponse = await request(app)
          .post('/api/settings/departments')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Temp Department',
            code: 'TEMP',
          });

        const tempId = createResponse.body.data.id;

        const response = await request(app)
          .delete(`/api/settings/departments/${tempId}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
      });
    });
  });

  describe('Leave Types', () => {
    describe('POST /api/settings/leave-types', () => {
      it('should create a leave type', async () => {
        const response = await request(app)
          .post('/api/settings/leave-types')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Sick Leave',
            code: 'SL',
            defaultDaysPerYear: 10,
            requiresAttachment: true,
          });

        expect(response.status).toBe(201);
        expect(response.body.data.name).toBe('Sick Leave');
        leaveTypeId = response.body.data.id;
      });
    });

    describe('GET /api/settings/leave-types', () => {
      it('should get all leave types', async () => {
        const response = await request(app)
          .get('/api/settings/leave-types')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.data).toBeInstanceOf(Array);
      });
    });

    describe('PUT /api/settings/leave-types/:id', () => {
      it('should update leave type', async () => {
        const response = await request(app)
          .put(`/api/settings/leave-types/${leaveTypeId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            defaultDaysPerYear: 12,
          });

        expect(response.status).toBe(200);
        expect(response.body.data.defaultDaysPerYear).toBe(12);
      });
    });
  });

  describe('Shifts', () => {
    describe('POST /api/settings/shifts', () => {
      it('should create a shift', async () => {
        const response = await request(app)
          .post('/api/settings/shifts')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Morning Shift',
            startTime: '09:00',
            endTime: '17:00',
            graceMinutesIn: 15,
            graceMinutesOut: 15,
            isDefault: false,
          });

        expect(response.status).toBe(201);
        expect(response.body.data.name).toBe('Morning Shift');
        shiftId = response.body.data.id;
      });
    });

    describe('GET /api/settings/shifts', () => {
      it('should get all shifts', async () => {
        const response = await request(app)
          .get('/api/settings/shifts')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.data).toBeInstanceOf(Array);
      });
    });

    describe('PUT /api/settings/shifts/:id', () => {
      it('should update shift', async () => {
        const response = await request(app)
          .put(`/api/settings/shifts/${shiftId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Morning Shift Updated',
          });

        expect(response.status).toBe(200);
        expect(response.body.data.name).toBe('Morning Shift Updated');
      });
    });
  });

  describe('Holidays', () => {
    describe('POST /api/settings/holidays', () => {
      it('should create a holiday', async () => {
        const nextYear = new Date().getFullYear() + 1;
        const holidayDate = new Date(`${nextYear}-01-01`);

        const response = await request(app)
          .post('/api/settings/holidays')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            date: holidayDate.toISOString().split('T')[0],
            name: 'New Year',
            countryCode: 'AE',
          });

        expect(response.status).toBe(201);
        expect(response.body.data.name).toBe('New Year');
        holidayId = response.body.data.id;
      });
    });

    describe('GET /api/settings/holidays', () => {
      it('should get holidays for a year', async () => {
        const year = new Date().getFullYear();
        const response = await request(app)
          .get(`/api/settings/holidays?year=${year}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.data).toBeInstanceOf(Array);
      });
    });

    describe('DELETE /api/settings/holidays/:id', () => {
      it('should delete holiday', async () => {
        const response = await request(app)
          .delete(`/api/settings/holidays/${holidayId}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
      });
    });
  });
});
