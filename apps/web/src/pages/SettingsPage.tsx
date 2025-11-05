import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { settingsApi, employeeApi, projectApi } from '../lib/api';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import type { Department, LeaveType, Shift, Holiday } from '../types';

type Tab = 'departments' | 'leaveTypes' | 'shifts' | 'holidays' | 'projects' | 'smtp';

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState<Tab>('departments');
  const queryClient = useQueryClient();

  // Fetch all settings data
  const { data: departments } = useQuery({
    queryKey: ['settings', 'departments'],
    queryFn: async () => {
      const response = await settingsApi.getDepartments();
      return response.data.data || [];
    },
  });

  const { data: leaveTypes } = useQuery({
    queryKey: ['settings', 'leaveTypes'],
    queryFn: async () => {
      const response = await settingsApi.getLeaveTypes();
      return response.data.data || [];
    },
  });

  const { data: shifts } = useQuery({
    queryKey: ['settings', 'shifts'],
    queryFn: async () => {
      const response = await settingsApi.getShifts();
      return response.data.data || [];
    },
  });

  const { data: holidays } = useQuery({
    queryKey: ['settings', 'holidays'],
    queryFn: async () => {
      const response = await settingsApi.getHolidays(new Date().getFullYear());
      return response.data.data || [];
    },
  });

  // Fetch employees for department manager selection
  const { data: employeesData } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const response = await employeeApi.getAll();
      return response.data.data || [];
    },
  });

  const tabs = [
    { id: 'departments' as Tab, label: 'Departments', icon: '🏢' },
    { id: 'leaveTypes' as Tab, label: 'Leave Types', icon: '🏖️' },
    { id: 'shifts' as Tab, label: 'Shifts', icon: '⏰' },
    { id: 'holidays' as Tab, label: 'Holidays', icon: '🎉' },
    { id: 'projects' as Tab, label: 'Projects', icon: '📁' },
    { id: 'smtp' as Tab, label: 'SMTP/Email', icon: '📧' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'departments':
        return <DepartmentsTab departments={departments || []} employees={employeesData || []} />;
      case 'leaveTypes':
        return <LeaveTypesTab leaveTypes={leaveTypes || []} />;
      case 'shifts':
        return <ShiftsTab shifts={shifts || []} />;
      case 'holidays':
        return <HolidaysTab holidays={holidays || []} />;
      case 'projects':
        return <ProjectsTab />;
      case 'smtp':
        return <SMTPTab />;
      default:
        return null;
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Settings</h1>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {renderContent()}
    </div>
  );
};

// Departments Tab Component
const DepartmentsTab = ({ departments, employees }: { departments: Department[]; employees: any[] }) => {
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [formData, setFormData] = useState({ name: '', code: '', managerEmployeeId: '' });
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: any) => settingsApi.createDepartment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'departments'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setShowModal(false);
      setFormData({ name: '', code: '', managerEmployeeId: '' });
      toast.success('Department created successfully');
    },
    onError: (error: any) => toast.error(`Failed: ${error.response?.data?.message}`),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => settingsApi.updateDepartment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'departments'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setShowModal(false);
      setEditing(null);
      setFormData({ name: '', code: '', managerEmployeeId: '' });
      toast.success('Department updated successfully');
    },
    onError: (error: any) => toast.error(`Failed: ${error.response?.data?.message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => settingsApi.deleteDepartment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'departments'] });
      toast.success('Department deleted successfully');
    },
    onError: (error: any) => toast.error(`Failed: ${error.response?.data?.message}`),
  });

  const handleAdd = () => {
    setEditing(null);
    setFormData({ name: '', code: '', managerEmployeeId: '' });
    setShowModal(true);
  };

  const handleEdit = (dept: Department) => {
    setEditing(dept);
    setFormData({ name: dept.name, code: dept.code, managerEmployeeId: dept.managerEmployeeId || '' });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name: formData.name,
      code: formData.code,
      managerEmployeeId: formData.managerEmployeeId || undefined,
    };
    if (editing) {
      updateMutation.mutate({ id: editing.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        <button onClick={handleAdd} className="btn-primary">Add Department</button>
      </div>
      <div className="card">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4">Code</th>
              <th className="text-left py-3 px-4">Name</th>
              <th className="text-left py-3 px-4">Manager</th>
              <th className="text-left py-3 px-4">Employees</th>
              <th className="text-left py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {departments.map((dept) => (
              <tr key={dept.id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4">{dept.code}</td>
                <td className="py-3 px-4">{dept.name}</td>
                <td className="py-3 px-4">
                  {dept.manager ? `${dept.manager.firstName} ${dept.manager.lastName}` : '-'}
                </td>
                <td className="py-3 px-4">{dept._count?.employees || 0}</td>
                <td className="py-3 px-4">
                  <button onClick={() => handleEdit(dept)} className="text-primary-600 mr-3">Edit</button>
                  <button onClick={() => {
                    if (confirm(`Delete ${dept.name}?`)) deleteMutation.mutate(dept.id);
                  }} className="text-red-600">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">{editing ? 'Edit' : 'Add'} Department</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Code *</label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  disabled={!!editing}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Manager</label>
                <select
                  value={formData.managerEmployeeId}
                  onChange={(e) => setFormData({ ...formData, managerEmployeeId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="">None</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

// Leave Types Tab Component
const LeaveTypesTab = ({ leaveTypes }: { leaveTypes: LeaveType[] }) => {
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<LeaveType | null>(null);
  const [formData, setFormData] = useState({ name: '', code: '', defaultDaysPerYear: 0, requiresAttachment: false });
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: any) => settingsApi.createLeaveType(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'leaveTypes'] });
      setShowModal(false);
      setFormData({ name: '', code: '', defaultDaysPerYear: 0, requiresAttachment: false });
      toast.success('Leave type created successfully');
    },
    onError: (error: any) => toast.error(`Failed: ${error.response?.data?.message}`),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => settingsApi.updateLeaveType(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'leaveTypes'] });
      setShowModal(false);
      setEditing(null);
      setFormData({ name: '', code: '', defaultDaysPerYear: 0, requiresAttachment: false });
      toast.success('Leave type updated successfully');
    },
    onError: (error: any) => toast.error(`Failed: ${error.response?.data?.message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => settingsApi.deleteLeaveType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'leaveTypes'] });
      toast.success('Leave type deleted successfully');
    },
    onError: (error: any) => toast.error(`Failed: ${error.response?.data?.message}`),
  });

  const handleAdd = () => {
    setEditing(null);
    setFormData({ name: '', code: '', defaultDaysPerYear: 0, requiresAttachment: false });
    setShowModal(true);
  };

  const handleEdit = (lt: LeaveType) => {
    setEditing(lt);
    setFormData({ name: lt.name, code: lt.code, defaultDaysPerYear: lt.defaultDaysPerYear, requiresAttachment: lt.requiresAttachment });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        <button onClick={handleAdd} className="btn-primary">Add Leave Type</button>
      </div>
      <div className="card">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4">Code</th>
              <th className="text-left py-3 px-4">Name</th>
              <th className="text-left py-3 px-4">Days/Year</th>
              <th className="text-left py-3 px-4">Requires Attachment</th>
              <th className="text-left py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {leaveTypes.map((lt) => (
              <tr key={lt.id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4">{lt.code}</td>
                <td className="py-3 px-4">{lt.name}</td>
                <td className="py-3 px-4">{lt.defaultDaysPerYear}</td>
                <td className="py-3 px-4">{lt.requiresAttachment ? '✓' : '-'}</td>
                <td className="py-3 px-4">
                  <button onClick={() => handleEdit(lt)} className="text-primary-600 mr-3">Edit</button>
                  <button onClick={() => {
                    if (confirm(`Delete ${lt.name}?`)) deleteMutation.mutate(lt.id);
                  }} className="text-red-600">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">{editing ? 'Edit' : 'Add'} Leave Type</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Code *</label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  disabled={!!editing}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Days per Year *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.defaultDaysPerYear}
                  onChange={(e) => setFormData({ ...formData, defaultDaysPerYear: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.requiresAttachment}
                  onChange={(e) => setFormData({ ...formData, requiresAttachment: e.target.checked })}
                  className="mr-2"
                />
                <label className="text-sm font-medium">Requires Attachment</label>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

// Shifts Tab Component
const ShiftsTab = ({ shifts }: { shifts: Shift[] }) => {
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Shift | null>(null);
  const [formData, setFormData] = useState({ name: '', startTime: '09:00', endTime: '17:00', graceMinutesIn: 15, graceMinutesOut: 15, isDefault: false });
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: any) => settingsApi.createShift(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'shifts'] });
      setShowModal(false);
      setFormData({ name: '', startTime: '09:00', endTime: '17:00', graceMinutesIn: 15, graceMinutesOut: 15, isDefault: false });
      toast.success('Shift created successfully');
    },
    onError: (error: any) => toast.error(`Failed: ${error.response?.data?.message}`),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => settingsApi.updateShift(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'shifts'] });
      setShowModal(false);
      setEditing(null);
      setFormData({ name: '', startTime: '09:00', endTime: '17:00', graceMinutesIn: 15, graceMinutesOut: 15, isDefault: false });
      toast.success('Shift updated successfully');
    },
    onError: (error: any) => toast.error(`Failed: ${error.response?.data?.message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => settingsApi.deleteShift(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'shifts'] });
      toast.success('Shift deleted successfully');
    },
    onError: (error: any) => toast.error(`Failed: ${error.response?.data?.message}`),
  });

  const handleAdd = () => {
    setEditing(null);
    setFormData({ name: '', startTime: '09:00', endTime: '17:00', graceMinutesIn: 15, graceMinutesOut: 15, isDefault: false });
    setShowModal(true);
  };

  const handleEdit = (shift: Shift) => {
    setEditing(shift);
    setFormData({ name: shift.name, startTime: shift.startTime, endTime: shift.endTime, graceMinutesIn: shift.graceMinutesIn, graceMinutesOut: shift.graceMinutesOut, isDefault: shift.isDefault });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        <button onClick={handleAdd} className="btn-primary">Add Shift</button>
      </div>
      <div className="card">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4">Name</th>
              <th className="text-left py-3 px-4">Start Time</th>
              <th className="text-left py-3 px-4">End Time</th>
              <th className="text-left py-3 px-4">Grace Minutes</th>
              <th className="text-left py-3 px-4">Default</th>
              <th className="text-left py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {shifts.map((shift) => (
              <tr key={shift.id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4">{shift.name}</td>
                <td className="py-3 px-4">{shift.startTime}</td>
                <td className="py-3 px-4">{shift.endTime}</td>
                <td className="py-3 px-4">{shift.graceMinutesIn} / {shift.graceMinutesOut}</td>
                <td className="py-3 px-4">{shift.isDefault ? '✓' : '-'}</td>
                <td className="py-3 px-4">
                  <button onClick={() => handleEdit(shift)} className="text-primary-600 mr-3">Edit</button>
                  <button onClick={() => {
                    if (confirm(`Delete ${shift.name}?`)) deleteMutation.mutate(shift.id);
                  }} className="text-red-600">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">{editing ? 'Edit' : 'Add'} Shift</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Start Time *</label>
                  <input
                    type="time"
                    required
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">End Time *</label>
                  <input
                    type="time"
                    required
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Grace In (min)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.graceMinutesIn}
                    onChange={(e) => setFormData({ ...formData, graceMinutesIn: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Grace Out (min)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.graceMinutesOut}
                    onChange={(e) => setFormData({ ...formData, graceMinutesOut: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="mr-2"
                />
                <label className="text-sm font-medium">Set as Default</label>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

// Holidays Tab Component
const HolidaysTab = ({ holidays }: { holidays: Holiday[] }) => {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ date: '', name: '', countryCode: 'AE' });
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear());
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: any) => settingsApi.createHoliday(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'holidays'] });
      setShowModal(false);
      setFormData({ date: '', name: '', countryCode: 'AE' });
      toast.success('Holiday created successfully');
    },
    onError: (error: any) => toast.error(`Failed: ${error.response?.data?.message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => settingsApi.deleteHoliday(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'holidays'] });
      toast.success('Holiday deleted successfully');
    },
    onError: (error: any) => toast.error(`Failed: ${error.response?.data?.message}`),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const filteredHolidays = holidays.filter(h => {
    const holidayYear = new Date(h.date).getFullYear();
    return holidayYear === yearFilter;
  });

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <select
          value={yearFilter}
          onChange={(e) => setYearFilter(parseInt(e.target.value))}
          className="px-3 py-2 border rounded-md"
        >
          {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 1 + i).map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
        <button onClick={() => setShowModal(true)} className="btn-primary">Add Holiday</button>
      </div>
      <div className="card">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4">Date</th>
              <th className="text-left py-3 px-4">Name</th>
              <th className="text-left py-3 px-4">Country</th>
              <th className="text-left py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredHolidays.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-8 text-gray-600">No holidays for {yearFilter}</td>
              </tr>
            ) : (
              filteredHolidays.map((holiday) => (
                <tr key={holiday.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">{format(new Date(holiday.date), 'MMM dd, yyyy')}</td>
                  <td className="py-3 px-4">{holiday.name}</td>
                  <td className="py-3 px-4">{holiday.countryCode}</td>
                  <td className="py-3 px-4">
                    <button onClick={() => {
                      if (confirm(`Delete ${holiday.name}?`)) deleteMutation.mutate(holiday.id);
                    }} className="text-red-600">Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Add Holiday</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Date *</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Country Code</label>
                <input
                  type="text"
                  value={formData.countryCode}
                  onChange={(e) => setFormData({ ...formData, countryCode: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border rounded-md"
                  maxLength={10}
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Add Holiday</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

// Projects Tab Component
const ProjectsTab = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: projectsData, isLoading } = useQuery({
    queryKey: ['settings', 'projects'],
    queryFn: async () => {
      const response = await projectApi.getAll({ page: 1, limit: 50 });
      return response.data.data || [];
    },
  });

  const projects = projectsData || [];

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      LEAD: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
      PLANNING: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200',
      RUNNING: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200',
      ON_HOLD: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200',
      COMPLETED: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200',
      CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Manage project settings and view project overview. Click on a project to view details.
        </p>
        <button onClick={() => navigate('/projects')} className="btn-primary">
          Manage Projects →
        </button>
      </div>
      
      <div className="card">
        <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">Project Overview</h3>
        {isLoading ? (
          <div className="text-center py-8 text-gray-600 dark:text-gray-400">Loading projects...</div>
        ) : projects.length === 0 ? (
          <div className="text-center py-8 text-gray-600 dark:text-gray-400">
            <p className="mb-4">No projects found</p>
            <button onClick={() => navigate('/projects')} className="btn-primary">
              Create First Project
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b dark:border-gray-700">
                  <th className="text-left py-3 px-4 dark:text-gray-300">Code</th>
                  <th className="text-left py-3 px-4 dark:text-gray-300">Name</th>
                  <th className="text-left py-3 px-4 dark:text-gray-300">Status</th>
                  <th className="text-left py-3 px-4 dark:text-gray-300">Budget</th>
                  <th className="text-left py-3 px-4 dark:text-gray-300">Manager</th>
                  <th className="text-left py-3 px-4 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project: any) => (
                  <tr key={project.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="py-3 px-4 dark:text-gray-200">{project.code}</td>
                    <td className="py-3 px-4 dark:text-gray-200">{project.name}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs ${getStatusColor(project.status)}`}>
                        {project.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 dark:text-gray-200">
                      {project.currency} {Number(project.budget).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 dark:text-gray-200">
                      {project.manager ? `${project.manager.firstName} ${project.manager.lastName}` : 'N/A'}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => navigate('/projects')}
                        className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 text-sm"
                      >
                        View →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Project Statistics */}
      {projects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2">Total Projects</h3>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{projects.length}</p>
          </div>
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2">Active</h3>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {projects.filter((p: any) => p.status === 'RUNNING').length}
            </p>
          </div>
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2">On Hold</h3>
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {projects.filter((p: any) => p.status === 'ON_HOLD').length}
            </p>
          </div>
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2">Completed</h3>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {projects.filter((p: any) => p.status === 'COMPLETED').length}
            </p>
          </div>
        </div>
      )}
    </>
  );
};

// SMTP Configuration Tab Component
const SMTPTab = () => {
  const [formData, setFormData] = useState({
    host: '',
    port: 587,
    secure: false,
    user: '',
    pass: '',
    from: '',
  });
  const [testEmail, setTestEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const queryClient = useQueryClient();

  const { data: smtpConfig, isLoading } = useQuery({
    queryKey: ['settings', 'smtp'],
    queryFn: async () => {
      const response = await settingsApi.getSMTPConfig();
      return response.data.data;
    },
  });

  useEffect(() => {
    if (smtpConfig) {
      setFormData({
        host: smtpConfig.host || '',
        port: smtpConfig.port || 587,
        secure: smtpConfig.secure || false,
        user: smtpConfig.user || '',
        pass: smtpConfig.pass === '••••••••' ? '' : (smtpConfig.pass || ''),
        from: smtpConfig.from || '',
      });
    }
  }, [smtpConfig]);

  const updateMutation = useMutation({
    mutationFn: (data: typeof formData) => settingsApi.updateSMTPConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'smtp'] });
      toast.success('SMTP configuration updated successfully');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to update SMTP configuration';
      const errors = error.response?.data?.errors;
      
      if (errors && Array.isArray(errors)) {
        // Show validation errors
        const errorDetails = errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ');
        toast.error(`Validation error: ${errorDetails}`);
      } else {
        toast.error(errorMessage);
      }
    },
  });

  const testMutation = useMutation({
    mutationFn: (email: string) => settingsApi.testSMTPConfig(email),
    onSuccess: (response) => {
      // Check both response.data.success and response.data.data.success for compatibility
      const result = response.data.data || response.data;
      if (result.success || response.data.success) {
        toast.success(result.message || response.data.message || 'Test email sent successfully!');
      } else {
        toast.error(result.message || response.data.message || 'Failed to send test email');
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to send test email');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prepare data - remove empty optional fields
    const submitData: any = {
      host: formData.host,
      port: typeof formData.port === 'string' ? parseInt(formData.port, 10) : formData.port,
      secure: formData.secure,
      user: formData.user,
      pass: formData.pass,
    };
    
    // Only include 'from' if it's not empty
    if (formData.from && formData.from.trim() !== '') {
      submitData.from = formData.from;
    }
    
    updateMutation.mutate(submitData);
  };

  const handleTest = () => {
    if (!testEmail || !testEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    testMutation.mutate(testEmail);
  };

  if (isLoading) {
    return <div className="card"><p className="text-gray-600 dark:text-gray-300">Loading SMTP configuration...</p></div>;
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">SMTP Configuration</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Configure your SMTP settings to enable email notifications for employees. Common SMTP providers:
        </p>
        
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="font-medium text-blue-900 dark:text-blue-200 mb-2">Common SMTP Settings:</h3>
          <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
            <li><strong>Gmail:</strong> smtp.gmail.com, Port: 587, Secure: false</li>
            <li><strong>Outlook:</strong> smtp-mail.outlook.com, Port: 587, Secure: false</li>
            <li><strong>Yahoo:</strong> smtp.mail.yahoo.com, Port: 587, Secure: false</li>
            <li><strong>Custom:</strong> Contact your email provider for SMTP settings</li>
          </ul>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                SMTP Host <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.host}
                onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                required
                className="input"
                placeholder="smtp.gmail.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                SMTP Port <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.port}
                onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) || 587 })}
                required
                className="input"
                placeholder="587"
                min="1"
                max="65535"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                SMTP User (Email) <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData.user}
                onChange={(e) => setFormData({ ...formData, user: e.target.value })}
                required
                className="input"
                placeholder="your-email@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                SMTP Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.pass}
                  onChange={(e) => setFormData({ ...formData, pass: e.target.value })}
                  required
                  className="input pr-10"
                  placeholder="Enter SMTP password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                From Email (Optional)
              </label>
              <input
                type="email"
                value={formData.from}
                onChange={(e) => setFormData({ ...formData, from: e.target.value })}
                className="input"
                placeholder="noreply@example.com"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                If not provided, SMTP user email will be used
              </p>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="secure"
                checked={formData.secure}
                onChange={(e) => setFormData({ ...formData, secure: e.target.checked })}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="secure" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Use Secure Connection (TLS/SSL)
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="btn-primary"
            >
              {updateMutation.isPending ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </form>
      </div>

      {/* Test Email Section */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Test Email Configuration</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Send a test email to verify your SMTP configuration is working correctly.
        </p>
        
        <div className="flex gap-4">
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            className="input flex-1"
            placeholder="Enter email address to test"
          />
          <button
            type="button"
            onClick={handleTest}
            disabled={testMutation.isPending || !testEmail}
            className="btn-secondary"
          >
            {testMutation.isPending ? 'Sending...' : 'Send Test Email'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
