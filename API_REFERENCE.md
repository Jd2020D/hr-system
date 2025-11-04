# API Reference

Complete API documentation for the HR Management System.

**Base URL**: `http://localhost:4000/api`

**Authentication**: Most endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <access_token>
```

## Authentication Endpoints

### POST /auth/login

Login and receive access + refresh tokens.

**Request:**
```json
{
  "email": "admin@hrsystem.com",
  "password": "Admin@123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "admin@hrsystem.com",
      "role": "ADMIN",
      "employeeId": "uuid"
    },
    "accessToken": "jwt_token"
  }
}
```

**Notes**: Refresh token is set as HTTP-only cookie.

### POST /auth/refresh

Refresh the access token using the refresh token cookie.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Token refreshed",
  "data": {
    "accessToken": "new_jwt_token"
  }
}
```

### POST /auth/logout

Logout and clear refresh token cookie.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### POST /auth/register

Register a new user (Admin only).

**Request:**
```json
{
  "email": "newuser@hrsystem.com",
  "password": "Secure@Pass123",
  "role": "EMPLOYEE",
  "employeeId": "uuid"
}
```

## Employee Endpoints

### GET /employees

List all employees with pagination and filters.

**Query Parameters:**
- `page` (number, default: 1): Page number
- `limit` (number, default: 20): Items per page
- `departmentId` (string): Filter by department
- `status` (enum): Filter by status (ACTIVE/INACTIVE)
- `search` (string): Search by name or email

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "code": "EMP001",
      "firstName": "Ahmed",
      "lastName": "Al-Mansoori",
      "email": "ahmed@hrsystem.com",
      "phone": "+971501234567",
      "hireDate": "2020-01-15T00:00:00.000Z",
      "status": "ACTIVE",
      "department": { "id": "uuid", "name": "IT", "code": "IT" },
      "jobTitle": "IT Manager"
    }
  ],
  "meta": {
    "total": 12,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

### GET /employees/:id

Get a single employee by ID.

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "code": "EMP001",
    "firstName": "Ahmed",
    "lastName": "Al-Mansoori",
    // ... full employee details
    "manager": {
      "id": "uuid",
      "firstName": "Manager",
      "lastName": "Name"
    }
  }
}
```

### POST /employees

Create a new employee (HR/Admin only).

**Request:**
```json
{
  "code": "EMP013",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@hrsystem.com",
  "phone": "+971501111111",
  "gender": "Male",
  "dob": "1990-05-15T00:00:00.000Z",
  "hireDate": "2024-01-15T00:00:00.000Z",
  "status": "ACTIVE",
  "departmentId": "uuid",
  "jobTitle": "Software Developer",
  "managerEmployeeId": "uuid",
  "address": "Dubai, UAE",
  "nationalId": "784-1990-1234567-1",
  "emergencyContact": {
    "name": "Jane Doe",
    "phone": "+971502222222",
    "relation": "Spouse"
  }
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Employee created successfully",
  "data": { /* employee object */ }
}
```

### PUT /employees/:id

Update an employee (HR/Admin only).

**Request:** Same as POST, but all fields optional.

### DELETE /employees/:id

Soft delete an employee (set status to INACTIVE) (HR/Admin only).

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Employee deleted successfully"
}
```

## Attendance Endpoints

### POST /attendance/clock-in

Clock in for today.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Clocked in successfully",
  "data": {
    "id": "uuid",
    "employeeId": "uuid",
    "date": "2024-01-15T00:00:00.000Z",
    "clockIn": "2024-01-15T09:05:00.000Z",
    "clockOut": null,
    "breaksMinutes": 0,
    "source": "WEB"
  }
}
```

**Errors:**
- 409: Already clocked in today

### POST /attendance/clock-out

Clock out for today.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Clocked out successfully",
  "data": {
    "id": "uuid",
    "clockIn": "2024-01-15T09:05:00.000Z",
    "clockOut": "2024-01-15T17:05:00.000Z"
  }
}
```

**Errors:**
- 400: No clock-in found for today
- 409: Already clocked out today

### GET /attendance/logs

Get attendance logs with pagination.

**Query Parameters:**
- `page`, `limit`: Pagination
- `employeeId` (string): Filter by employee
- `from` (datetime): Start date filter
- `to` (datetime): End date filter

**Response (200 OK):**
```json
{
  "success": true,
  "data": [ /* attendance logs */ ],
  "meta": { /* pagination meta */ }
}
```

### PUT /attendance/logs/:id

Update attendance log manually (Admin/HR only).

**Request:**
```json
{
  "clockIn": "2024-01-15T09:00:00.000Z",
  "clockOut": "2024-01-15T17:00:00.000Z",
  "breaksMinutes": 60,
  "note": "Adjusted for meeting"
}
```

## Leave Endpoints

### GET /leaves/requests

List leave requests.

**Query Parameters:**
- `page`, `limit`: Pagination
- `status`: Filter by status
- `employeeId`: Filter by employee
- `managerId`: Filter by manager
- `leaveTypeId`: Filter by leave type

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "employeeId": "uuid",
      "employee": { "firstName": "Ahmed", "lastName": "..." },
      "leaveTypeId": "uuid",
      "leaveType": { "name": "Annual Leave", "code": "ANNUAL" },
      "startDate": "2024-02-01T00:00:00.000Z",
      "endDate": "2024-02-05T00:00:00.000Z",
      "days": 5,
      "reason": "Family vacation",
      "status": "PENDING",
      "approver": null
    }
  ],
  "meta": { /* pagination */ }
}
```

### POST /leaves/requests

Create a leave request.

**Request:**
```json
{
  "leaveTypeId": "uuid",
  "startDate": "2024-02-01T00:00:00.000Z",
  "endDate": "2024-02-05T00:00:00.000Z",
  "reason": "Family vacation",
  "attachmentUrl": "https://storage.url/.../file.pdf"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Leave request created successfully",
  "data": { /* leave request */ }
}
```

**Errors:**
- 400: Invalid date range, insufficient balance
- 409: Conflicts with existing leaves

### PUT /leaves/requests/:id/approve

Approve a leave request (Manager/HR/Admin only).

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Leave request approved",
  "data": { /* approved request */ }
}
```

### PUT /leaves/requests/:id/reject

Reject a leave request (Manager/HR/Admin only).

### PUT /leaves/requests/:id/cancel

Cancel a leave request.

## Payroll Endpoints

### GET /payroll/runs

List payroll runs.

**Query Parameters:**
- `page`, `limit`: Pagination
- `status`: Filter by status (DRAFT/APPROVED/PAID)
- `from`, `to`: Date range filters

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "periodStart": "2024-10-01T00:00:00.000Z",
      "periodEnd": "2024-10-31T00:00:00.000Z",
      "status": "DRAFT",
      "notes": "October payroll",
      "items": [
        {
          "id": "uuid",
          "employee": { "name": "Ahmed Al-Mansoori" },
          "grossSalary": 15000.00,
          "totalAllowance": 1500.00,
          "totalDeduction": 300.00,
          "netPay": 16200.00
        }
      ]
    }
  ],
  "meta": { /* pagination */ }
}
```

### POST /payroll/runs

Create a new payroll run (HR/Admin only).

**Request:**
```json
{
  "periodStart": "2024-10-01T00:00:00.000Z",
  "periodEnd": "2024-10-31T00:00:00.000Z",
  "notes": "October 2024 payroll"
}
```

### POST /payroll/runs/:id/prepare

Generate payroll items for all active employees (HR/Admin only).

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Payroll run prepared successfully",
  "data": {
    "id": "uuid",
    "status": "DRAFT",
    "items": [ /* all payroll items */ ]
  }
}
```

**Errors:**
- 400: Can only prepare draft runs

### POST /payroll/runs/:id/approve

Approve a payroll run (HR/Admin only).

**Errors:**
- 400: Can only approve draft runs, must have items

### POST /payroll/runs/:id/pay

Mark payroll as paid (HR/Admin only).

**Errors:**
- 400: Can only pay approved runs

## Error Responses

All errors follow this format:

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Invalid date range"
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "message": "Forbidden: Insufficient permissions"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Employee not found"
}
```

**409 Conflict:**
```json
{
  "success": false,
  "message": "Already clocked in today",
  "error": { /* additional details */ }
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Internal server error"
}
```

## Rate Limiting

Authentication endpoints are rate-limited:
- Login: 5 attempts per 15 minutes
- Refresh: 10 requests per 15 minutes

## Pagination

All list endpoints support pagination with these defaults:
- Page: 1
- Limit: 20 (max: 100)
- Total pages calculated automatically

## Filtering & Sorting

Common filter patterns:
- Date ranges: `from` and `to` query parameters
- Status enums: exact match
- Search: case-insensitive partial match on text fields

## Best Practices

1. Always include Authorization header for protected endpoints
2. Handle 401 responses by attempting token refresh
3. Use pagination for list endpoints to avoid large payloads
4. Validate input on client side before submitting
5. Cache frequently accessed data using TanStack Query
6. Implement optimistic updates for better UX

## Testing

Use the provided seed data:
- **Admin**: admin@hrsystem.com / Admin@123
- **HR**: hr@hrsystem.com / Admin@123
- **Manager**: ahmed.mansoori@hrsystem.com / Admin@123
- **Employee**: Any employee email from seed / Admin@123

## Swagger/OpenAPI

Interactive API documentation available at:
```
http://localhost:4000/api-docs
```
(Note: Swagger integration can be added in future)

