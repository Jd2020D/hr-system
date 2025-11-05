import { useQuery } from '@tanstack/react-query';
import { employeeApi, attendanceApi, leaveApi, projectApi } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

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

  const { data: projectsData } = useQuery({
    queryKey: ['projects', 'dashboard'],
    queryFn: async () => {
      const response = await projectApi.getAll({ page: 1, limit: 100 });
      return response.data.data || [];
    },
    enabled: hasRole(['ADMIN', 'HR', 'MANAGER']),
  });

  const activeEmployees = employeesData?.filter((e: any) => e.status === 'ACTIVE').length || 0;
  const todayAttendance = attendanceData?.filter((a: any) => a.clockIn !== null).length || 0;
  const openClocks = attendanceData?.filter((a: any) => a.clockIn !== null && a.clockOut === null).length || 0;
  const pendingLeaves = leavesData?.length || 0;
  
  // Project statistics
  const activeProjects = projectsData?.filter((p: any) => p.status === 'RUNNING').length || 0;
  const totalProjects = projectsData?.length || 0;
  const onHoldProjects = projectsData?.filter((p: any) => p.status === 'ON_HOLD').length || 0;
  const completedProjects = projectsData?.filter((p: any) => p.status === 'COMPLETED').length || 0;
  
  // Recent projects
  const recentProjects = projectsData?.slice(0, 3) || [];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-2">Active Employees</h3>
          <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">{activeEmployees}</p>
        </div>
        
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-2">Today Present</h3>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">{todayAttendance}</p>
        </div>
        
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-2">Open Clocks</h3>
          <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{openClocks}</p>
        </div>
        
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-2">Pending Leaves</h3>
          <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{pendingLeaves}</p>
        </div>
      </div>

      {/* Project Statistics - Only for Admin, HR, Manager */}
      {hasRole(['ADMIN', 'HR', 'MANAGER']) && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-2">Total Projects</h3>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{totalProjects}</p>
          </div>
          
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-2">Active Projects</h3>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">{activeProjects}</p>
          </div>
          
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-2">On Hold</h3>
            <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{onHoldProjects}</p>
          </div>
          
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-2">Completed</h3>
            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{completedProjects}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Recent Activities</h2>
          <div className="space-y-4">
            {attendanceData && attendanceData.length > 0 && (
              <div className="border-l-4 border-primary-500 pl-4">
                <p className="font-semibold">Clock In</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {attendanceData[0]?.employee?.firstName} {attendanceData[0]?.employee?.lastName} - {format(new Date(attendanceData[0]?.clockIn), 'HH:mm')}
                </p>
              </div>
            )}
            {leavesData && leavesData.length > 0 && (
              <div className="border-l-4 border-green-500 pl-4">
                <p className="font-semibold">Leave Request</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {leavesData[0]?.employee?.firstName} {leavesData[0]?.employee?.lastName} - {leavesData[0]?.leaveType?.name}
                </p>
              </div>
            )}
            {hasRole(['ADMIN', 'HR', 'MANAGER']) && recentProjects.length > 0 && (
              <div className="border-l-4 border-blue-500 pl-4">
                <p className="font-semibold">Project Update</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {recentProjects[0]?.name} - {recentProjects[0]?.status}
                </p>
              </div>
            )}
            {!attendanceData?.length && !leavesData?.length && (!hasRole(['ADMIN', 'HR', 'MANAGER']) || !recentProjects.length) && (
              <p className="text-sm text-gray-500 dark:text-gray-400">No recent activities</p>
            )}
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            {isEmployee && <button onClick={() => navigate('/attendance')} className="btn-primary py-3">Clock In/Out</button>}
            {isEmployee && <button onClick={() => navigate('/leaves')} className="btn-secondary py-3">Request Leave</button>}
            {!isEmployee && <button onClick={() => navigate('/employees')} className="btn-secondary py-3">View Employees</button>}
            {hasRole(['ADMIN', 'HR', 'MANAGER']) && <button onClick={() => navigate('/projects')} className="btn-secondary py-3">📁 Projects</button>}
            {hasRole(['ADMIN', 'HR']) && <button onClick={() => navigate('/payroll')} className="btn-secondary py-3">Manage Payroll</button>}
            {hasRole(['ADMIN']) && <button onClick={() => navigate('/settings')} className="btn-secondary py-3">Settings</button>}
          </div>
        </div>
      </div>

      {/* Recent Projects Section - Only for Admin, HR, Manager */}
      {hasRole(['ADMIN', 'HR', 'MANAGER']) && recentProjects.length > 0 && (
        <div className="card mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Recent Projects</h2>
            <button onClick={() => navigate('/projects')} className="text-primary-600 dark:text-primary-400 hover:underline text-sm">
              View All →
            </button>
          </div>
          <div className="space-y-3">
            {recentProjects.map((project: any) => (
              <div
                key={project.id}
                onClick={() => navigate(`/projects`)}
                className="border-b dark:border-gray-700 pb-3 last:border-0 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-2 rounded transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold dark:text-gray-100">{project.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{project.code}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded text-xs ${
                      project.status === 'RUNNING' ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200' :
                      project.status === 'ON_HOLD' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200' :
                      project.status === 'COMPLETED' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                    }`}>
                      {project.status}
                    </span>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {project.currency} {Number(project.budget).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;

