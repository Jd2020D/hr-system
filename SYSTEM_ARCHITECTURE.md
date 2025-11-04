# HR Management System - Architecture Documentation

## System Overview

The HR Management System is a production-ready web application built with the MERN stack (MongoDB replaced with MySQL via Prisma ORM). The system follows a microservices-inspired monorepo structure with separate frontend and backend applications.

## Tech Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.x
- **Language**: TypeScript 5.x
- **Database**: MySQL 8.0
- **ORM**: Prisma 5.x
- **Validation**: Zod 3.x
- **Authentication**: JWT (Access + Refresh tokens)
- **Testing**: Jest + Supertest

### Frontend
- **Framework**: React 18.x
- **Build Tool**: Vite 5.x
- **Language**: TypeScript 5.x
- **Styling**: TailwindCSS 3.x
- **Forms**: React Hook Form + Zod
- **State Management**: TanStack Query + Zustand
- **Charts**: Recharts
- **Calendar**: FullCalendar
- **Routing**: React Router 6.x

### DevOps
- **Containers**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **Code Quality**: ESLint + Prettier + Husky

## Database Schema (ERD)

### Entities

#### Core Entities
```
users
├── id (PK)
├── email (unique)
├── password_hash
├── role (enum: ADMIN, HR, MANAGER, EMPLOYEE)
├── employee_id (FK -> employees.id, nullable)
├── is_active
└── timestamps

employees
├── id (PK)
├── code (unique)
├── personal_info (first_name, last_name, email, phone, gender, dob)
├── hire_date, status
├── department_id (FK -> departments.id)
├── job_title
├── manager_employee_id (FK -> employees.id, self-reference)
├── address, national_id
├── emergency_contact (JSON)
└── timestamps

departments
├── id (PK)
├── name, code (unique)
├── manager_employee_id (FK -> employees.id, nullable)
└── timestamps
```

#### Attendance System
```
shifts
├── id (PK)
├── name, start_time, end_time
├── grace_minutes_in, grace_minutes_out
└── is_default

attendance_logs
├── id (PK)
├── employee_id (FK -> employees.id)
├── date (unique with employee_id)
├── clock_in, clock_out (nullable)
├── breaks_minutes
├── source (WEB | ADMIN)
├── ip_address, device_info
├── note
└── timestamps
```

#### Leave Management
```
leave_types
├── id (PK)
├── name, code (unique)
├── default_days_per_year
└── requires_attachment

leave_balances
├── id (PK)
├── employee_id (FK -> employees.id)
├── leave_type_id (FK -> leave_types.id)
├── year
├── allocated_days, carried_over_days
├── taken_days, remaining_days
└── unique(employee_id, leave_type_id, year)

leave_requests
├── id (PK)
├── employee_id (FK -> employees.id)
├── leave_type_id (FK -> leave_types.id)
├── start_date, end_date, days
├── reason
├── status (enum: PENDING, APPROVED, REJECTED, CANCELLED)
├── approver_employee_id (FK -> employees.id)
├── attachment_url
└── timestamps

holidays
├── id (PK)
├── date, name
├── country_code
└── unique(date, country_code)
```

#### Payroll System
```
salaries
├── id (PK)
├── employee_id (FK -> employees.id)
├── base_salary, allowance, deduction (DECIMAL)
├── effective_from, effective_to (nullable)
└── created_at

payroll_runs
├── id (PK)
├── period_start, period_end
├── status (enum: DRAFT, APPROVED, PAID)
├── notes
└── timestamps

payroll_items
├── id (PK)
├── payroll_run_id (FK -> payroll_runs.id)
├── employee_id (FK -> employees.id)
├── gross_salary, total_allowance, total_deduction
└── net_pay
```

#### Audit Logs
```
audit_logs
├── id (PK)
├── user_id (FK -> users.id, nullable)
├── action, entity, entity_id
├── payload_json (JSON)
└── created_at
```

### Relationships

```
users 1:1 employees (optional)
employees N:1 departments
employees N:1 employees (manager-subordinate)
employees 1:N salaries
employees 1:N attendance_logs
employees 1:N leave_balances
employees 1:N leave_requests
employees 1:N payroll_items
```

### Indexes

Key indexes for performance:
- Foreign keys: employee_id, department_id, manager_employee_id, etc.
- Date columns: date, period_start, period_end, effective_from, created_at
- Query patterns: employee status, attendance dates, leave status

## Authentication & Authorization

### JWT Flow

```
1. User submits credentials → POST /api/auth/login
2. Server validates → generates accessToken (15min) + refreshToken (7 days)
3. Access token stored in localStorage
4. Refresh token stored in HTTP-only cookie
5. Each API request includes Authorization: Bearer {accessToken}
6. On 401, client calls POST /api/auth/refresh
7. Server validates refresh token → issues new access token
8. Failed refresh → redirect to login
```

### RBAC (Role-Based Access Control)

| Role | Permissions |
|------|-------------|
| **ADMIN** | Full system access, manage users |
| **HR** | Manage employees, attendance, leaves, payroll, reports |
| **MANAGER** | View team attendance, approve/reject leave requests |
| **EMPLOYEE** | View own data, clock in/out, request leaves |

### Protected Routes

```
Admin only: /api/auth/register, user management
HR + Admin: employee CRUD, payroll management, attendance edits
Manager + HR + Admin: leave approvals
All authenticated: viewing own data, basic operations
```

## API Architecture

### RESTful Endpoints

```
/api/auth/*
├── POST /login
├── POST /register (admin only)
├── POST /refresh
└── POST /logout

/api/employees/*
├── GET /
├── GET /:id
├── POST /
├── PUT /:id
└── DELETE /:id

/api/attendance/*
├── POST /clock-in
├── POST /clock-out
├── GET /logs
└── PUT /logs/:id

/api/leaves/*
├── GET /requests
├── GET /requests/:id
├── POST /requests
├── PUT /requests/:id/approve
├── PUT /requests/:id/reject
└── PUT /requests/:id/cancel

/api/payroll/*
├── GET /runs
├── GET /runs/:id
├── POST /runs
├── POST /runs/:id/prepare
├── POST /runs/:id/approve
└── POST /runs/:id/pay
```

### Request/Response Format

```typescript
// Success Response
{
  success: true,
  message?: string,
  data?: T,
  meta?: PaginationMeta
}

// Error Response
{
  success: false,
  message: string,
  error?: any
}

// Pagination Meta
{
  total: number,
  page: number,
  limit: number,
  totalPages: number
}
```

## Sequence Diagrams

### Clock-In Process

```
Employee → Frontend: Click "Clock In"
Frontend → API: POST /api/attendance/clock-in (Bearer token)
API → Middleware: Verify JWT token
API → Service: Check for existing clock-in today
Service → DB: Find attendance_logs WHERE employee_id & date
DB → Service: Return existing log (or null)
if (!existing || !clockIn):
  Service → DB: Create/Update attendance_log with clock_in=now()
  DB → Service: Return saved log
Service → API: Return attendance log
API → Frontend: 200 OK { success: true, data: log }
Frontend: Display success message & update UI
```

### Leave Request Approval Flow

```
Employee → Frontend: Submit leave request form
Frontend → API: POST /api/leaves/requests (dates, type, reason)
API → Service: Validate dates, check conflicts, check balance
Service → DB: Insert leave_requests (status=PENDING)
Service → API: Return created request
API → Frontend: 201 Created

Manager → Frontend: View pending leaves
Frontend → API: GET /api/leaves/requests?status=PENDING
API → Service: Fetch PENDING requests
Service → API: Return paginated list
Frontend: Display approval buttons

Manager → Frontend: Click "Approve"
Frontend → API: PUT /api/leaves/requests/:id/approve
API → Service: Update request status=APPROVED
Service → DB: UPDATE leave_requests SET status, approver
Service → DB: UPDATE leave_balances SET taken_days++, remaining_days--
Service → API: Return approved request
API → Frontend: 200 OK
Frontend: Refresh leave balances display
```

### Payroll Run Generation

```
HR → Frontend: Create new payroll run
Frontend → API: POST /api/payroll/runs (period_start, period_end)
API → Service: Create payroll_runs (status=DRAFT)
Service → API: Return created run

HR → Frontend: Click "Prepare Payroll"
Frontend → API: POST /api/payroll/runs/:id/prepare
API → Service: Get all active employees
Service → DB: Query employees WHERE status=ACTIVE WITH salaries
Service → Logic: For each employee, find effective salary in period
Service → Logic: Calculate gross, allowances, deductions, net
Service → DB: DELETE existing payroll_items, INSERT new items
Service → API: Return run with items
API → Frontend: Display preview table

HR → Frontend: Click "Approve"
Frontend → API: POST /api/payroll/runs/:id/approve
API → Service: Validate has items, UPDATE status=APPROVED

HR → Frontend: Click "Mark as Paid"
Frontend → API: POST /api/payroll/runs/:id/pay
API → Service: UPDATE status=PAID
```

## Frontend Architecture

### Component Structure

```
src/
├── components/          # Reusable UI components
│   ├── Layout.tsx      # Main layout with nav
│   ├── Modal.tsx       # Generic modal
│   └── ...
├── pages/              # Route pages
│   ├── LoginPage.tsx
│   ├── DashboardPage.tsx
│   ├── EmployeesPage.tsx
│   ├── AttendancePage.tsx
│   ├── LeavesPage.tsx
│   ├── PayrollPage.tsx
│   └── SettingsPage.tsx
├── hooks/              # Custom React hooks
├── lib/                # Utilities & API client
│   └── api.ts
├── store/              # Zustand stores
│   └── authStore.ts
├── types/              # TypeScript definitions
└── App.tsx             # Router setup
```

### State Management

- **Server State**: TanStack Query (employees, attendance, leaves, payroll)
- **Auth State**: Zustand (persisted to localStorage)
- **Local State**: React useState/useReducer

### Data Flow

```
User Action → React Component → TanStack Query Mutation/Query
  ↓
API Call via axios → Backend Express API
  ↓
Prisma ORM → MySQL Database
  ↓
Response → TanStack Query Cache Update
  ↓
Component Re-render with new data
```

## Security Considerations

1. **Password Hashing**: bcrypt with salt rounds
2. **JWT Tokens**: Short-lived access tokens, longer refresh tokens
3. **RBAC**: Middleware-enforced role checks on all routes
4. **Input Validation**: Zod schemas on all endpoints
5. **SQL Injection**: Prisma ORM prevents SQL injection
6. **CORS**: Configured for specific frontend origin
7. **Helmet**: Security headers middleware
8. **Rate Limiting**: express-rate-limit on auth endpoints
9. **Audit Logging**: All admin/HR actions logged

## Performance Optimizations

1. **Database**: Indexes on foreign keys and date columns
2. **Pagination**: All list endpoints support page/limit
3. **Query Optimization**: Prisma select specific fields
4. **Caching**: TanStack Query cache (5min stale time)
5. **Code Splitting**: Vite automatic code splitting
6. **Lazy Loading**: React.lazy for route components

## Deployment Architecture

```
┌─────────────────┐
│  Docker Compose │
├─────────────────┤
│                 │
│  ┌───────────┐  │
│  │   MySQL   │  │  :3306
│  └───────────┘  │
│                 │
│  ┌───────────┐  │
│  │ Express   │  │  :4000
│  │    API    │  │
│  └───────────┘  │
│                 │
│  ┌───────────┐  │
│  │   React   │  │  :5174
│  │    Web    │  │
│  └───────────┘  │
│                 │
│  ┌───────────┐  │
│  │  Adminer  │  │  :8080
│  └───────────┘  │
└─────────────────┘
```

## Future Enhancements

1. **Email Notifications**: SMTP integration for leave approvals
2. **File Upload**: S3/local storage for attachments
3. **Real-time Updates**: WebSocket for live attendance
4. **Export Reports**: PDF generation with chart.js
5. **Mobile App**: React Native wrapper
6. **Multi-tenant**: Support multiple organizations
7. **Advanced Analytics**: BI dashboard integration
8. **Biometric Integration**: Fingerprint/face recognition

## Documentation References

- [API Reference](./API_REFERENCE.md)
- [Reports Specification](./REPORTS_SPEC.md)
- [README](./README.md)

