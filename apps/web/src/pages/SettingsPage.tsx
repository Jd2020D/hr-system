import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { settingsApi, employeeApi } from '../lib/api';
import { format } from 'date-fns';
import type { Department, LeaveType, Shift, Holiday } from '../types';

type Tab = 'departments' | 'leaveTypes' | 'shifts' | 'holidays';

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

export default SettingsPage;
