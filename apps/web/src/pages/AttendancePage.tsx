import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { attendanceApi, employeeApi } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import type { AttendanceLog, Employee } from '../types';

const AttendancePage = () => {
  const { user, hasRole } = useAuthStore();
  const queryClient = useQueryClient();
  const isEmployee = hasRole('EMPLOYEE');
  const isManager = hasRole(['ADMIN', 'HR', 'MANAGER']);
  const [dateFilter, setDateFilter] = useState({
    from: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    to: format(new Date(), 'yyyy-MM-dd'),
  });
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');

  // Fetch employees for filtering (managers only)
  const { data: employeesData } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const response = await employeeApi.getAll();
      return response.data.data || [];
    },
    enabled: isManager,
  });

  const employees = employeesData || [];

  // Get today's attendance
  const today = new Date().toISOString().split('T')[0];
  const { data: todayData } = useQuery({
    queryKey: ['attendance', 'today'],
    queryFn: async () => {
      const response = await attendanceApi.getLogs({ from: today, to: today });
      return response.data.data || [];
    },
  });

  // Get attendance history with filters
  const { data: historyData, isLoading } = useQuery({
    queryKey: ['attendance', 'history', dateFilter.from, dateFilter.to, selectedEmployee],
    queryFn: async () => {
      const params: any = {
        from: dateFilter.from,
        to: dateFilter.to,
      };
      if (selectedEmployee && isManager) {
        params.employeeId = selectedEmployee;
      }
      const response = await attendanceApi.getLogs(params);
      return response.data.data || [];
    },
  });

  const todayLog = todayData?.find((log: AttendanceLog) => log.employeeId === user?.employeeId);
  const canClockIn = !todayLog?.clockIn;
  const canClockOut = todayLog?.clockIn && !todayLog?.clockOut;

  const clockInMutation = useMutation({
    mutationFn: () => attendanceApi.clockIn(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      toast.success('Clocked in successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to clock in: ${error.response?.data?.message || 'Unknown error'}`);
    },
  });

  const clockOutMutation = useMutation({
    mutationFn: () => attendanceApi.clockOut(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      toast.success('Clocked out successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to clock out: ${error.response?.data?.message || 'Unknown error'}`);
    },
  });

  const calculateHours = (clockIn: string | null, clockOut: string | null) => {
    if (!clockIn || !clockOut) return 0;
    const diff = new Date(clockOut).getTime() - new Date(clockIn).getTime();
    return (diff / (1000 * 60 * 60)).toFixed(1);
  };

  const getStatus = (log: AttendanceLog) => {
    if (!log.clockIn) return { text: 'Absent', class: 'badge-danger' };
    if (!log.clockOut) return { text: 'Open', class: 'badge-warning' };
    return { text: 'Complete', class: 'badge-success' };
  };

  // Calculate statistics
  const stats = historyData?.reduce((acc, log: AttendanceLog) => {
    const status = getStatus(log);
    if (status.text === 'Complete') acc.totalHours += parseFloat(calculateHours(log.clockIn, log.clockOut));
    if (status.text === 'Complete') acc.presentDays++;
    if (status.text === 'Absent') acc.absentDays++;
    if (status.text === 'Open') acc.openDays++;
    return acc;
  }, { totalHours: 0, presentDays: 0, absentDays: 0, openDays: 0 }) || { totalHours: 0, presentDays: 0, absentDays: 0, openDays: 0 };

  const filteredHistory = isEmployee
    ? historyData?.filter((log: AttendanceLog) => log.employeeId === user?.employeeId)
    : historyData;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Attendance</h1>
        {isEmployee && (
          <div className="space-x-3">
            <button 
              onClick={() => clockInMutation.mutate()} 
              disabled={!canClockIn || clockInMutation.isPending}
              className="btn-success disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {clockInMutation.isPending ? 'Clocking In...' : 'Clock In'}
            </button>
            <button 
              onClick={() => clockOutMutation.mutate()} 
              disabled={!canClockOut || clockOutMutation.isPending}
              className="btn-danger disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {clockOutMutation.isPending ? 'Clocking Out...' : 'Clock Out'}
            </button>
          </div>
        )}
      </div>

      {/* Today's Status Card for Employees */}
      {isEmployee && (
        <div className="card mb-6">
          <p className="text-lg font-semibold mb-2">Today's Status</p>
          {todayLog?.clockIn ? (
            <div className="space-y-1">
              <p className="text-gray-600 dark:text-gray-300">
                <span className="font-medium">Clock In:</span> {format(new Date(todayLog.clockIn), 'HH:mm:ss')}
              </p>
              {todayLog.clockOut ? (
                <p className="text-gray-600 dark:text-gray-300">
                  <span className="font-medium">Clock Out:</span> {format(new Date(todayLog.clockOut), 'HH:mm:ss')}
                </p>
              ) : (
                <p className="text-yellow-600 dark:text-yellow-400 font-medium">You are currently clocked in</p>
              )}
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-300">You have not clocked in today</p>
          )}
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2">Total Hours</h3>
          <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">{stats.totalHours.toFixed(1)}</p>
        </div>
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2">Present Days</h3>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.presentDays}</p>
        </div>
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2">Absent Days</h3>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.absentDays}</p>
        </div>
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2">Open Clocks</h3>
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.openDays}</p>
        </div>
      </div>

      {/* Filters for Managers */}
      {isManager && (
        <div className="card mb-6">
          <h3 className="text-lg font-semibold mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Employee</label>
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="input"
              >
                <option value="">All Employees</option>
                {employees.map((emp: Employee) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName} ({emp.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-300">From Date</label>
              <input
                type="date"
                value={dateFilter.from}
                onChange={(e) => setDateFilter({ ...dateFilter, from: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-300">To Date</label>
              <input
                type="date"
                value={dateFilter.to}
                onChange={(e) => setDateFilter({ ...dateFilter, to: e.target.value })}
                max={format(new Date(), 'yyyy-MM-dd')}
                className="input"
              />
            </div>
          </div>
          <div className="mt-4 flex space-x-2">
            <button
              onClick={() => setDateFilter({
                from: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
                to: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
              })}
              className="btn-secondary text-sm"
            >
              This Month
            </button>
            <button
              onClick={() => setDateFilter({
                from: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
                to: format(new Date(), 'yyyy-MM-dd'),
              })}
              className="btn-secondary text-sm"
            >
              Last 7 Days
            </button>
            <button
              onClick={() => setDateFilter({
                from: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
                to: format(new Date(), 'yyyy-MM-dd'),
              })}
              className="btn-secondary text-sm"
            >
              Last 30 Days
            </button>
          </div>
        </div>
      )}

      {/* Attendance History Table */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4">
          {isEmployee ? 'My Attendance History' : 'Attendance History'}
        </h2>
        {isLoading ? (
          <div className="text-center py-8 text-gray-600 dark:text-gray-300">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  {isManager && <th className="text-left py-3 px-4">Employee</th>}
                  <th className="text-left py-3 px-4">Date</th>
                  <th className="text-left py-3 px-4">Clock In</th>
                  <th className="text-left py-3 px-4">Clock Out</th>
                  <th className="text-left py-3 px-4">Hours</th>
                  <th className="text-left py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory && filteredHistory.length > 0 ? (
                  filteredHistory.map((log: AttendanceLog) => {
                    const status = getStatus(log);
                    return (
                      <tr key={log.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                        {isManager && (
                          <td className="py-3 px-4">
                            {employees.find((e: Employee) => e.id === log.employeeId) 
                              ? `${employees.find((e: Employee) => e.id === log.employeeId)?.firstName} ${employees.find((e: Employee) => e.id === log.employeeId)?.lastName}`
                              : 'Unknown'}
                          </td>
                        )}
                        <td className="py-3 px-4">{format(new Date(log.date), 'MMM dd, yyyy')}</td>
                        <td className="py-3 px-4">
                          {log.clockIn ? format(new Date(log.clockIn), 'HH:mm') : '-'}
                        </td>
                        <td className="py-3 px-4">
                          {log.clockOut ? format(new Date(log.clockOut), 'HH:mm') : '-'}
                        </td>
                        <td className="py-3 px-4">
                          {log.clockIn && log.clockOut ? calculateHours(log.clockIn, log.clockOut) : '-'}
                        </td>
                        <td className="py-3 px-4">
                          <span className={status.class}>{status.text}</span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={isManager ? 6 : 5} className="text-center py-8 text-gray-600 dark:text-gray-400">
                      No attendance records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendancePage;
