export interface User {
  id: string;
  email: string;
  role: 'ADMIN' | 'HR' | 'MANAGER' | 'EMPLOYEE';
  employeeId?: string | null;
  employee?: Employee;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface Employee {
  id: string;
  code: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  gender?: string | null;
  dob?: string | null;
  hireDate: string;
  status: 'ACTIVE' | 'INACTIVE';
  department?: Department;
  jobTitle: string;
  manager?: Employee | null;
  managerEmployeeId?: string | null;
  address?: string | null;
  nationalId?: string | null;
  emergencyContact?: any;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  managerEmployeeId?: string | null;
  manager?: Employee;
  _count?: {
    employees: number;
  };
}

export interface AttendanceLog {
  id: string;
  employeeId: string;
  employee?: Employee;
  date: string;
  clockIn?: string | null;
  clockOut?: string | null;
  breaksMinutes: number;
  source: 'WEB' | 'ADMIN';
  ipAddress?: string | null;
  deviceInfo?: string | null;
  note?: string | null;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employee?: Employee;
  leaveTypeId: string;
  leaveType?: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  reason?: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  approver?: Employee | null;
  attachmentUrl?: string | null;
}

export interface LeaveType {
  id: string;
  name: string;
  code: string;
  defaultDaysPerYear: number;
  requiresAttachment: boolean;
}

export interface LeaveBalance {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  leaveType?: LeaveType;
  year: number;
  allocatedDays: number;
  carriedOverDays: number;
  takenDays: number;
  remainingDays: number;
}

export interface PayrollRun {
  id: string;
  periodStart: string;
  periodEnd: string;
  status: 'DRAFT' | 'APPROVED' | 'PAID';
  notes?: string | null;
  items?: PayrollItem[];
}

export interface PayrollItem {
  id: string;
  employeeId: string;
  employee?: Employee;
  grossSalary: number;
  totalAllowance: number;
  totalDeduction: number;
  netPay: number;
  currency?: 'USD' | 'JD' | 'AED';
}

export interface Shift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  graceMinutesIn: number;
  graceMinutesOut: number;
  isDefault: boolean;
}

export interface Salary {
  id: string;
  employeeId: string;
  baseSalary: number;
  allowance: number;
  deduction: number;
  currency?: 'USD' | 'JD' | 'AED';
  effectiveFrom: string;
  effectiveTo?: string | null;
}

export interface Holiday {
  id: string;
  date: string;
  name: string;
  countryCode: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  meta?: any;
}

