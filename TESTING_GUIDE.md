# Testing Guide

This document provides comprehensive information about testing the HR Management System.

## Overview

The HR system includes automated tests for:
- **Backend API**: Full REST API endpoint testing
- **Frontend Web**: Component and integration testing
- **Integration Tests**: End-to-end functionality testing

## Test Structure

```
apps/
├── api/
│   ├── tests/
│   │   ├── setup.ts              # Test configuration
│   │   ├── auth.test.ts          # Authentication tests
│   │   ├── employees.test.ts     # Employee CRUD tests
│   │   ├── attendance.test.ts    # Attendance tests
│   │   ├── leaves.test.ts        # Leave management tests
│   │   ├── payroll.test.ts       # Payroll tests
│   │   └── settings.test.ts      # Settings tests
│   └── jest.config.js            # Jest configuration
│
└── web/
    ├── src/
    │   └── __tests__/            # Frontend tests
    └── vitest.config.ts          # Vitest configuration
```

## Quick Start

### Run All Tests

```bash
# From project root
./test-runner.sh

# Or using npm
npm test
```

### Run Specific Test Suites

```bash
# Backend only
npm run test:api

# Frontend only
npm run test:web

# Specific test file
cd apps/api
npm test -- employees.test.ts
```

## Backend API Tests

### Prerequisites

1. Test database must be available
2. Environment variables configured (`.env.test`)
3. Database migrations applied

### Test Database Setup

Create a test database:

```bash
# MySQL
mysql -u root -p
CREATE DATABASE hr_system_test;

# Or using Docker
docker-compose exec mysql mysql -uroot -prootpass -e "CREATE DATABASE IF NOT EXISTS hr_system_test;"
```

### Running Backend Tests

```bash
cd apps/api

# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm run test:watch

# Run specific test file
npm test -- auth.test.ts
```

### Test Categories

#### 1. Authentication Tests (`auth.test.ts`)
- ✅ User login with valid credentials
- ✅ Login with invalid credentials
- ✅ Token refresh
- ✅ Logout functionality
- ✅ Password validation

#### 2. Employee Tests (`employees.test.ts`)
- ✅ Create employee
- ✅ Get all employees
- ✅ Get employee by ID
- ✅ Update employee
- ✅ Delete employee (soft delete)
- ✅ Salary management (CRUD)
- ✅ Employee search and filtering

#### 3. Attendance Tests (`attendance.test.ts`)
- ✅ Clock in
- ✅ Clock out
- ✅ Get attendance logs
- ✅ Filter by date range
- ✅ Filter by employee (admin)

#### 4. Leave Tests (`leaves.test.ts`)
- ✅ Create leave request
- ✅ Approve leave request
- ✅ Reject leave request
- ✅ Cancel leave request
- ✅ Get leave balances
- ✅ Date validation

#### 5. Payroll Tests (`payroll.test.ts`)
- ✅ Create payroll run
- ✅ Prepare payroll run
- ✅ Approve payroll run
- ✅ Mark as paid
- ✅ Get payroll runs
- ✅ Payroll calculations

#### 6. Settings Tests (`settings.test.ts`)
- ✅ Departments CRUD
- ✅ Leave types CRUD
- ✅ Shifts CRUD
- ✅ Holidays CRUD

## Frontend Tests

### Running Frontend Tests

```bash
cd apps/web

# Run all tests
npm test

# Run with UI
npm run test:ui

# Run with coverage
npm run test:coverage

# Run in watch mode
npm test -- --watch
```

### Test Configuration

Frontend tests use:
- **Vitest**: Test runner
- **React Testing Library**: Component testing
- **@testing-library/user-event**: User interaction simulation

## Test Coverage

### View Coverage Reports

```bash
# Backend coverage
cd apps/api
npm test -- --coverage
open coverage/lcov-report/index.html

# Frontend coverage
cd apps/web
npm run test:coverage
```

### Coverage Goals

- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

## Writing New Tests

### Backend Test Example

```typescript
import request from 'supertest';
import app from '../src/app';

describe('Feature Name', () => {
  let authToken: string;

  beforeAll(async () => {
    // Setup: Login and get token
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@hrsystem.com', password: 'Admin@123' });
    authToken = response.body.data.accessToken;
  });

  it('should test something', async () => {
    const response = await request(app)
      .get('/api/endpoint')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
```

### Frontend Test Example

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

## Continuous Integration

Tests run automatically on:
- Pull requests to `main` or `develop`
- Pushes to `main` or `develop`

See `.github/workflows/ci.yml` for CI configuration.

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   ```bash
   # Ensure test database exists
   mysql -u root -p -e "CREATE DATABASE hr_system_test;"
   
   # Check DATABASE_URL in .env.test
   ```

2. **Port Already in Use**
   ```bash
   # Kill process on port 4001
   lsof -ti:4001 | xargs kill -9
   ```

3. **Test Timeout**
   - Increase timeout in `jest.config.js` or test file
   - Check database performance

4. **Missing Dependencies**
   ```bash
   npm install
   ```

## Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Clean up test data after tests
3. **Assertions**: Use specific, meaningful assertions
4. **Naming**: Use descriptive test names
5. **Organization**: Group related tests in describe blocks
6. **Mocking**: Mock external dependencies when needed
7. **Coverage**: Aim for high coverage of critical paths

## Test Data

Tests use seed data from `apps/api/prisma/seed.ts`. For isolated testing, tests create their own data in `beforeAll` hooks and clean up in `afterAll`.

## Performance Testing

For performance testing, consider:
- Load testing with tools like Apache Bench or k6
- Database query optimization
- API response time monitoring

## Security Testing

Security tests should cover:
- Authentication bypass attempts
- Authorization checks (RBAC)
- SQL injection prevention
- XSS prevention
- CSRF protection

## Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [React Testing Library](https://testing-library.com/react)
- [Vitest Documentation](https://vitest.dev/)
