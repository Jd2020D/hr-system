# Role-Based Access Control (RBAC) Guide

## Overview

The HR Management System implements a comprehensive Role-Based Access Control (RBAC) system with 4 distinct user roles:

1. **ADMIN** - Full system access
2. **HR** - Human Resources management
3. **MANAGER** - Team management
4. **EMPLOYEE** - Self-service

## User Roles and Permissions

### 👑 ADMIN

**Full Access** to all system features:
- ✅ View all employees, departments, and organizational data
- ✅ Manage all employees (create, edit, delete)
- ✅ Manage attendance for all employees
- ✅ Approve/reject all leave requests
- ✅ Generate and manage payroll runs
- ✅ View all reports and analytics
- ✅ System settings and configuration
- ✅ Clock in/out (for all locations/devices)

**Accessible Pages:**
- Dashboard
- Employees
- Attendance
- Leaves
- Payroll
- Settings

### 👔 HR

**Human Resources Management**:
- ✅ View all employees
- ✅ Manage employees (create, edit, delete)
- ✅ View all attendance logs
- ✅ Approve/reject leave requests
- ✅ Generate and manage payroll runs
- ✅ View all reports
- ✅ Clock in/out

**Accessible Pages:**
- Dashboard
- Employees
- Attendance
- Leaves
- Payroll
- Settings

**Not Accessible:**
- System configuration (only Admin)

### 👨‍💼 MANAGER

**Team Management**:
- ✅ View team members (direct reports)
- ✅ View team attendance
- ✅ Approve/reject team members' leave requests
- ✅ View team reports
- ✅ Clock in/out
- ❌ Cannot manage employees globally
- ❌ Cannot access payroll
- ❌ Cannot manage system settings

**Accessible Pages:**
- Dashboard
- Employees (read-only)
- Attendance
- Leaves

**Not Accessible:**
- Payroll
- Settings

### 👤 EMPLOYEE

**Self-Service Only**:
- ✅ View own attendance records
- ✅ Clock in/out
- ✅ Request leaves
- ✅ View leave balances and status
- ❌ Cannot view other employees
- ❌ Cannot approve leaves
- ❌ Cannot access payroll or settings

**Accessible Pages:**
- Dashboard (limited data)
- Attendance (own records only)
- Leaves (own requests only)

**Not Accessible:**
- Employees
- Payroll
- Settings

---

## Technical Implementation

### Backend (API)

**Authentication Middleware** (`apps/api/src/middleware/auth.ts`):
- `authenticate` - Verifies JWT token
- `authorize(...roles)` - Checks user role
- `authorizeResource` - Checks resource ownership

**Example Usage:**
```typescript
// Require authentication + specific roles
router.post('/', authenticate, authorize('ADMIN', 'HR'), employeeController.create);

// Resource-specific authorization
router.get('/:id', authenticate, authorizeResource, employeeController.findById);
```

**API Endpoints Protection:**

| Endpoint | Authenticated | Admin | HR | Manager | Employee |
|----------|---------------|-------|----|---------|----------| 
| GET /employees | ✅ | ✅ | ✅ | ✅ | ❌ |
| POST /employees | ✅ | ✅ | ✅ | ❌ | ❌ |
| GET /attendance/logs | ✅ | ✅ | ✅ | ✅ | ✅* |
| POST /attendance/clock-in | ✅ | ✅ | ✅ | ✅ | ✅ |
| GET /leaves/requests | ✅ | ✅ | ✅ | ✅ | ✅* |
| POST /leaves/approve/:id | ✅ | ✅ | ✅ | ✅ | ❌ |
| GET /payroll/runs | ✅ | ✅ | ✅ | ❌ | ❌ |
| POST /payroll/generate | ✅ | ✅ | ✅ | ❌ | ❌ |

*Limited to own data

### Frontend (React)

**Role Checking** (`apps/web/src/store/authStore.ts`):
```typescript
const { hasRole } = useAuthStore();

// Single role check
hasRole('ADMIN')

// Multiple roles check
hasRole(['ADMIN', 'HR'])

// Conditional rendering
{hasRole(['ADMIN', 'HR']) && <AdminButton />}
```

**Navigation** (`apps/web/src/components/Layout.tsx`):
Navigation items are dynamically filtered based on user role.

**Page-Level Protection**:
Pages check role on load and hide/show features accordingly.

---

## Database Schema

**User Model** (`prisma/schema.prisma`):
```prisma
enum Role {
  ADMIN
  HR
  MANAGER
  EMPLOYEE
}

model User {
  id         String   @id @default(uuid())
  email      String   @unique
  role       Role     @default(EMPLOYEE)
  employeeId String?  @unique
  isActive   Boolean  @default(true)
  // ...
}
```

---

## Testing RBAC

### Test Users

Created in seed data (`apps/api/prisma/seed.ts`):

1. **Admin**
   - Email: `admin@hrsystem.com`
   - Password: `Admin@123`
   - Role: ADMIN
   - Employee: No

2. **HR Manager**
   - Email: `hr@hrsystem.com`
   - Password: `Admin@123`
   - Role: HR
   - Employee: Fatima Al-Zahra

3. **IT Manager**
   - Email: `ahmed.mansoori@hrsystem.com`
   - Password: `Admin@123`
   - Role: MANAGER
   - Employee: Ahmed Al-Mansoori

4. **Regular Employees**
   - Email: `{firstname}.{lastname}@hrsystem.com`
   - Password: `Admin@123`
   - Role: EMPLOYEE
   - Various employees

### Testing Checklist

- [ ] Login as ADMIN - see all menu items
- [ ] Login as HR - see Employees, Payroll, etc.
- [ ] Login as MANAGER - see limited menu
- [ ] Login as EMPLOYEE - see only self-service features
- [ ] Try accessing `/employees` as EMPLOYEE - should be blocked
- [ ] Try accessing `/payroll` as MANAGER - should be blocked
- [ ] EMPLOYEE cannot see "Delete" buttons on employee list
- [ ] Only ADMIN/HR see "Add Employee" button
- [ ] Only ADMIN/HR can approve payroll runs

---

## Security Best Practices

1. ✅ JWT-based authentication with refresh tokens
2. ✅ Password hashing with bcrypt (10 rounds)
3. ✅ Role validation on backend API
4. ✅ Frontend role checks for UX only
5. ✅ Never trust client-side role checks
6. ✅ API returns 403 Forbidden for unauthorized access
7. ✅ Audit logging for sensitive operations
8. ✅ Rate limiting on auth endpoints
9. ✅ CORS configured appropriately
10. ✅ Helmet.js for security headers

---

## Adding New Roles

To add a new role:

1. **Database**: Add to `Role` enum in `schema.prisma`
2. **Backend**: Update type definitions in `apps/api/src/types/index.ts`
3. **Backend**: Add authorization rules in route files
4. **Frontend**: Update `User` interface in `apps/web/src/types/index.ts`
5. **Frontend**: Add to navigation filtering logic
6. **Seed**: Add test user in `seed.ts`

Run migrations:
```bash
docker-compose exec api npx prisma migrate dev --name add_new_role
```

---

## Troubleshooting

**Issue: User can't access feature they should**
- Check user role in database
- Verify JWT token payload
- Check API route authorization
- Review browser console for 403 errors

**Issue: 401 Unauthorized on all requests**
- Token expired - refresh page and login again
- Check JWT_SECRET in `.env`
- Verify token in localStorage

**Issue: 403 Forbidden on specific route**
- User role doesn't match required role
- Check route authorization middleware
- Verify user has correct permissions

---

## Additional Resources

- [System Architecture](./SYSTEM_ARCHITECTURE.md) - Overall system design
- [API Reference](./API_REFERENCE.md) - API endpoints documentation
- [Setup Guide](./SETUP_GUIDE.md) - Installation instructions

