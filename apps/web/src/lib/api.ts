import axios from "axios";
import type {
  AuthResponse,
  Employee,
  AttendanceLog,
  LeaveRequest,
  PayrollRun,
  PaginatedResponse,
  ApiResponse,
  Department,
  LeaveType,
  Shift,
  Holiday,
  Salary,
} from "../types";

// Use proxy in dev, or env URL in production
const API_URL = import.meta.env.DEV ? "" : import.meta.env.VITE_API_URL || "";

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Try to refresh token
      try {
        const response = await axios.post(
          `${API_URL}/api/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const newToken = response.data.data.accessToken;
        localStorage.setItem("accessToken", newToken);

        // Retry original request
        error.config.headers.Authorization = `Bearer ${newToken}`;
        return axios.request(error.config);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (email: string, password: string) =>
    api.post<ApiResponse<AuthResponse>>("/auth/login", { email, password }),

  logout: () => api.post<ApiResponse>("/auth/logout"),

  refresh: () => api.post<ApiResponse>("/auth/refresh"),
};

export const employeeApi = {
  getAll: (params?: any) =>
    api.get<ApiResponse & PaginatedResponse<Employee>>("/employees", {
      params,
    }),

  getById: (id: string) => api.get<ApiResponse<Employee>>(`/employees/${id}`),

  create: (data: Partial<Employee>) =>
    api.post<ApiResponse<Employee>>("/employees", data),

  update: (id: string, data: Partial<Employee>) =>
    api.put<ApiResponse<Employee>>(`/employees/${id}`, data),

  delete: (id: string) => api.delete<ApiResponse>(`/employees/${id}`),

  // Salary management
  getSalaries: (employeeId: string) =>
    api.get<ApiResponse<Salary[]>>(`/employees/${employeeId}/salaries`),

  createSalary: (employeeId: string, data: Partial<Salary>) =>
    api.post<ApiResponse<Salary>>(`/employees/${employeeId}/salaries`, data),

  updateSalary: (salaryId: string, data: Partial<Salary>) =>
    api.put<ApiResponse<Salary>>(`/employees/salaries/${salaryId}`, data),

  deleteSalary: (salaryId: string) =>
    api.delete<ApiResponse>(`/employees/salaries/${salaryId}`),
};

export const attendanceApi = {
  clockIn: () => api.post<ApiResponse<AttendanceLog>>("/attendance/clock-in"),

  clockOut: () => api.post<ApiResponse<AttendanceLog>>("/attendance/clock-out"),

  getLogs: (params?: any) =>
    api.get<ApiResponse & PaginatedResponse<AttendanceLog>>(
      "/attendance/logs",
      { params }
    ),

  update: (id: string, data: Partial<AttendanceLog>) =>
    api.put<ApiResponse<AttendanceLog>>(`/attendance/logs/${id}`, data),
};

export const leaveApi = {
  getRequests: (params?: any) =>
    api.get<ApiResponse & PaginatedResponse<LeaveRequest>>("/leaves/requests", {
      params,
    }),

  getById: (id: string) =>
    api.get<ApiResponse<LeaveRequest>>(`/leaves/requests/${id}`),

  create: (data: Partial<LeaveRequest>) =>
    api.post<ApiResponse<LeaveRequest>>("/leaves/requests", data),

  approve: (id: string) =>
    api.put<ApiResponse<LeaveRequest>>(`/leaves/requests/${id}/approve`),

  reject: (id: string) =>
    api.put<ApiResponse<LeaveRequest>>(`/leaves/requests/${id}/reject`),

  cancel: (id: string) =>
    api.put<ApiResponse<LeaveRequest>>(`/leaves/requests/${id}/cancel`),
};

export const payrollApi = {
  getRuns: (params?: any) =>
    api.get<ApiResponse & PaginatedResponse<PayrollRun>>("/payroll/runs", {
      params,
    }),

  getById: (id: string) =>
    api.get<ApiResponse<PayrollRun>>(`/payroll/runs/${id}`),

  create: (data: Partial<PayrollRun>) =>
    api.post<ApiResponse<PayrollRun>>("/payroll/runs", data),

  prepare: (id: string) =>
    api.post<ApiResponse<PayrollRun>>(`/payroll/runs/${id}/prepare`),

  approve: (id: string) =>
    api.post<ApiResponse<PayrollRun>>(`/payroll/runs/${id}/approve`),

  pay: (id: string) =>
    api.post<ApiResponse<PayrollRun>>(`/payroll/runs/${id}/pay`),
};

export const settingsApi = {
  // Departments
  getDepartments: () =>
    api.get<ApiResponse<Department[]>>("/settings/departments"),

  createDepartment: (data: Partial<Department>) =>
    api.post<ApiResponse<Department>>("/settings/departments", data),

  updateDepartment: (id: string, data: Partial<Department>) =>
    api.put<ApiResponse<Department>>(`/settings/departments/${id}`, data),

  deleteDepartment: (id: string) =>
    api.delete<ApiResponse>(`/settings/departments/${id}`),

  // Leave Types
  getLeaveTypes: () =>
    api.get<ApiResponse<LeaveType[]>>("/settings/leave-types"),

  createLeaveType: (data: Partial<LeaveType>) =>
    api.post<ApiResponse<LeaveType>>("/settings/leave-types", data),

  updateLeaveType: (id: string, data: Partial<LeaveType>) =>
    api.put<ApiResponse<LeaveType>>(`/settings/leave-types/${id}`, data),

  deleteLeaveType: (id: string) =>
    api.delete<ApiResponse>(`/settings/leave-types/${id}`),

  // Shifts
  getShifts: () => api.get<ApiResponse<Shift[]>>("/settings/shifts"),

  createShift: (data: Partial<Shift>) =>
    api.post<ApiResponse<Shift>>("/settings/shifts", data),

  updateShift: (id: string, data: Partial<Shift>) =>
    api.put<ApiResponse<Shift>>(`/settings/shifts/${id}`, data),

  deleteShift: (id: string) =>
    api.delete<ApiResponse>(`/settings/shifts/${id}`),

  // Holidays
  getHolidays: (year?: number) =>
    api.get<ApiResponse<Holiday[]>>("/settings/holidays", { params: { year } }),

  createHoliday: (data: Partial<Holiday>) =>
    api.post<ApiResponse<Holiday>>("/settings/holidays", data),

  deleteHoliday: (id: string) =>
    api.delete<ApiResponse>(`/settings/holidays/${id}`),
};

export const projectApi = {
  // Projects
  getAll: (params?: any) =>
    api.get<ApiResponse & PaginatedResponse<any>>("/projects", { params }),

  getById: (id: string) => api.get<ApiResponse<any>>(`/projects/${id}`),

  getSummary: (id: string) =>
    api.get<ApiResponse<any>>(`/projects/${id}/summary`),

  create: (data: any) => api.post<ApiResponse<any>>("/projects", data),

  update: (id: string, data: any) =>
    api.put<ApiResponse<any>>(`/projects/${id}`, data),

  delete: (id: string) => api.delete<ApiResponse>(`/projects/${id}`),

  // Resources
  getResources: (projectId: string) =>
    api.get<ApiResponse<any[]>>(`/projects/${projectId}/resources`),

  addResource: (projectId: string, data: any) =>
    api.post<ApiResponse<any>>(`/projects/${projectId}/resources`, data),

  updateResource: (id: string, data: any) =>
    api.put<ApiResponse<any>>(`/projects/resources/${id}`, data),

  deleteResource: (id: string) =>
    api.delete<ApiResponse>(`/projects/resources/${id}`),

  // Expenses
  getExpenses: (projectId: string, params?: any) =>
    api.get<ApiResponse & PaginatedResponse<any>>(
      `/projects/${projectId}/expenses`,
      { params }
    ),

  addExpense: (projectId: string, data: any) =>
    api.post<ApiResponse<any>>(`/projects/${projectId}/expenses`, data),

  updateExpense: (id: string, data: any) =>
    api.put<ApiResponse<any>>(`/projects/expenses/${id}`, data),

  deleteExpense: (id: string) =>
    api.delete<ApiResponse>(`/projects/expenses/${id}`),

  // Invoices
  getInvoices: (projectId: string, params?: any) =>
    api.get<ApiResponse & PaginatedResponse<any>>(
      `/projects/${projectId}/invoices`,
      { params }
    ),

  addInvoice: (projectId: string, data: any) =>
    api.post<ApiResponse<any>>(`/projects/${projectId}/invoices`, data),

  updateInvoice: (id: string, data: any) =>
    api.put<ApiResponse<any>>(`/projects/invoices/${id}`, data),

  deleteInvoice: (id: string) =>
    api.delete<ApiResponse>(`/projects/invoices/${id}`),

  // Payments
  getPayments: (projectId: string, params?: any) =>
    api.get<ApiResponse & PaginatedResponse<any>>(
      `/projects/${projectId}/payments`,
      { params }
    ),

  addPayment: (projectId: string, data: any) =>
    api.post<ApiResponse<any>>(`/projects/${projectId}/payments`, data),

  updatePayment: (id: string, data: any) =>
    api.put<ApiResponse<any>>(`/projects/payments/${id}`, data),

  deletePayment: (id: string) =>
    api.delete<ApiResponse>(`/projects/payments/${id}`),
};

export default api;
