import { useQuery } from '@tanstack/react-query';
import { employeeApi, attendanceApi, leaveApi } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, hasRole } = useAuthStore();
  const isEmployee = hasRole('EMPLOYEE');

  const { data: employeesData } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const response = await employeeApi.getAll();
      return response.data.data || [];
    },
  });

  const { data: attendanceData } = useQuery({
    queryKey: ['attendance', 'today'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const response = await attendanceApi.getLogs({ from: today, to: today });
      return response.data.data || [];
    },
  });

  const { data: leavesData } = useQuery({
    queryKey: ['leaves', 'pending'],
    queryFn: async () => {
      const response = await leaveApi.getRequests({ status: 'PENDING' });
      return response.data.data || [];
    },
  });

  const activeEmployees = employeesData?.filter((e: any) => e.status === 'ACTIVE').length || 0;
  const todayAttendance = attendanceData?.filter((a: any) => a.clockIn !== null).length || 0;
  const openClocks = attendanceData?.filter((a: any) => a.clockIn !== null && a.clockOut === null).length || 0;
  const pendingLeaves = leavesData?.length || 0;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Active Employees</h3>
          <p className="text-3xl font-bold text-primary-600">{activeEmployees}</p>
        </div>
        
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Today Present</h3>
          <p className="text-3xl font-bold text-green-600">{todayAttendance}</p>
        </div>
        
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Open Clocks</h3>
          <p className="text-3xl font-bold text-yellow-600">{openClocks}</p>
        </div>
        
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Pending Leaves</h3>
          <p className="text-3xl font-bold text-orange-600">{pendingLeaves}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Recent Activities</h2>
          <div className="space-y-4">
            <div className="border-l-4 border-primary-500 pl-4">
              <p className="font-semibold">Clock In</p>
              <p className="text-sm text-gray-600">Mohammed Hassan - 9:05 AM</p>
            </div>
            <div className="border-l-4 border-green-500 pl-4">
              <p className="font-semibold">Leave Approved</p>
              <p className="text-sm text-gray-600">Sarah Ibrahim - Annual Leave</p>
            </div>
            <div className="border-l-4 border-blue-500 pl-4">
              <p className="font-semibold">Payroll Generated</p>
              <p className="text-sm text-gray-600">October 2024 - DRAFT</p>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            {isEmployee && <button onClick={() => navigate('/attendance')} className="btn-primary py-3">Clock In/Out</button>}
            {isEmployee && <button onClick={() => navigate('/leaves')} className="btn-secondary py-3">Request Leave</button>}
            {!isEmployee && <button onClick={() => navigate('/employees')} className="btn-secondary py-3">View Employees</button>}
            {hasRole(['ADMIN', 'HR']) && <button onClick={() => navigate('/payroll')} className="btn-secondary py-3">Manage Payroll</button>}
            {hasRole(['ADMIN']) && <button onClick={() => navigate('/settings')} className="btn-secondary py-3">Settings</button>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

