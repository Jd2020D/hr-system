import { Request } from 'express';
import { Role, EmployeeStatus, PayrollRunStatus, LeaveRequestStatus, AttendanceSource } from '@prisma/client';

export type { Role, EmployeeStatus, PayrollRunStatus, LeaveRequestStatus, AttendanceSource };

export interface JwtPayload {
  userId: string;
  email: string;
  role: Role;
  employeeId?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface DateRangeFilter {
  from?: string;
  to?: string;
}

export interface EmployeeFilter extends PaginationParams {
  departmentId?: string;
  status?: EmployeeStatus;
  search?: string;
}

export interface AttendanceFilter extends PaginationParams, DateRangeFilter {
  employeeId?: string;
  status?: 'present' | 'absent' | 'late' | 'early' | 'open';
}

export interface LeaveRequestFilter extends PaginationParams {
  status?: LeaveRequestStatus;
  employeeId?: string;
  managerId?: string;
  leaveTypeId?: string;
}

export interface PayrollFilter extends PaginationParams, DateRangeFilter {
  status?: PayrollRunStatus;
}

