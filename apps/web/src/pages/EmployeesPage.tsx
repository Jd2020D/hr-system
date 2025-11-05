import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { employeeApi } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { format } from 'date-fns';
import type { Employee, Salary } from '../types';

interface EmployeeFormData {
  code: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  gender?: string;
  hireDate: string;
  departmentId: string;
  jobTitle: string;
  status: 'ACTIVE' | 'INACTIVE';
}

const EmployeesPage = () => {
  const { hasRole } = useAuthStore();
  const canManage = hasRole(['ADMIN', 'HR']);
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState<Partial<EmployeeFormData>>({
    status: 'ACTIVE',
  });
  
  // Salary management state
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [selectedEmployeeForSalary, setSelectedEmployeeForSalary] = useState<Employee | null>(null);
  const [showSalaryForm, setShowSalaryForm] = useState(false);
  const [editingSalary, setEditingSalary] = useState<Salary | null>(null);
  const [salaryFormData, setSalaryFormData] = useState<Partial<Salary>>({
    baseSalary: 0,
    allowance: 0,
    deduction: 0,
    currency: 'AED',
    effectiveFrom: format(new Date(), 'yyyy-MM-dd'),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const response = await employeeApi.getAll();
      return response.data.data || [];
    },
  });

  // Extract unique departments from employees
  const departments = Array.from(
    new Map(
      (data || []).map((emp: Employee) => [emp.department?.id, emp.department])
    ).values()
  ).filter((dept): dept is NonNullable<Employee['department']> => Boolean(dept));

  const deleteMutation = useMutation({
    mutationFn: (id: string) => employeeApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Employee deleted successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to delete: ${error.response?.data?.message || 'Unknown error'}`);
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => employeeApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setShowModal(false);
      setFormData({ status: 'ACTIVE' });
      toast.success('Employee created successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to create: ${error.response?.data?.message || 'Unknown error'}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => employeeApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setShowModal(false);
      setEditingEmployee(null);
      setFormData({ status: 'ACTIVE' });
      toast.success('Employee updated successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to update: ${error.response?.data?.message || 'Unknown error'}`);
    },
  });

  // Salary queries and mutations
  const { data: salariesData, refetch: refetchSalaries } = useQuery({
    queryKey: ['salaries', selectedEmployeeForSalary?.id],
    queryFn: async () => {
      if (!selectedEmployeeForSalary) return [];
      const response = await employeeApi.getSalaries(selectedEmployeeForSalary.id);
      return response.data.data || [];
    },
    enabled: !!selectedEmployeeForSalary && showSalaryModal,
  });

  const createSalaryMutation = useMutation({
    mutationFn: ({ employeeId, data }: { employeeId: string; data: any }) =>
      employeeApi.createSalary(employeeId, data),
    onSuccess: () => {
      refetchSalaries();
      setShowSalaryForm(false);
      setEditingSalary(null);
      setSalaryFormData({
        baseSalary: 0,
        allowance: 0,
        deduction: 0,
        currency: 'AED',
        effectiveFrom: format(new Date(), 'yyyy-MM-dd'),
      });
      toast.success('Salary created successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to create salary: ${error.response?.data?.message || 'Unknown error'}`);
    },
  });

  const updateSalaryMutation = useMutation({
    mutationFn: ({ salaryId, data }: { salaryId: string; data: any }) =>
      employeeApi.updateSalary(salaryId, data),
    onSuccess: () => {
      refetchSalaries();
      setShowSalaryForm(false);
      setEditingSalary(null);
      setSalaryFormData({
        baseSalary: 0,
        allowance: 0,
        deduction: 0,
        currency: 'AED',
        effectiveFrom: format(new Date(), 'yyyy-MM-dd'),
      });
      toast.success('Salary updated successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to update salary: ${error.response?.data?.message || 'Unknown error'}`);
    },
  });

  const deleteSalaryMutation = useMutation({
    mutationFn: (salaryId: string) => employeeApi.deleteSalary(salaryId),
    onSuccess: () => {
      refetchSalaries();
      toast.success('Salary deleted successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to delete salary: ${error.response?.data?.message || 'Unknown error'}`);
    },
  });

  const handleDelete = (employee: Employee) => {
    if (confirm(`Delete ${employee.firstName} ${employee.lastName}?`)) {
      deleteMutation.mutate(employee.id);
    }
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      code: employee.code,
      firstName: employee.firstName,
      lastName: employee.lastName,
      email: employee.email,
      phone: employee.phone || '',
      gender: employee.gender || '',
      hireDate: employee.hireDate.split('T')[0],
      departmentId: employee.department?.id || '',
      jobTitle: employee.jobTitle,
      status: employee.status,
    });
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingEmployee(null);
    setFormData({ status: 'ACTIVE' });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEmployee) {
      updateMutation.mutate({ id: editingEmployee.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  // Salary management handlers
  const handleManageSalary = (employee: Employee) => {
    setSelectedEmployeeForSalary(employee);
    setShowSalaryModal(true);
    setShowSalaryForm(false);
  };

  const handleAddSalary = () => {
    setEditingSalary(null);
    setSalaryFormData({
      baseSalary: 0,
      allowance: 0,
      deduction: 0,
      currency: 'AED',
      effectiveFrom: format(new Date(), 'yyyy-MM-dd'),
      effectiveTo: null,
    });
    setShowSalaryForm(true);
  };

  const handleEditSalary = (salary: Salary) => {
    setEditingSalary(salary);
    setSalaryFormData({
      baseSalary: Number(salary.baseSalary || 0),
      allowance: Number(salary.allowance || 0),
      deduction: Number(salary.deduction || 0),
      currency: salary.currency || 'AED',
      effectiveFrom: salary.effectiveFrom.split('T')[0],
      effectiveTo: salary.effectiveTo ? salary.effectiveTo.split('T')[0] : null,
    });
    setShowSalaryForm(true);
  };

  const handleDeleteSalary = (salary: Salary) => {
    if (confirm('Delete this salary record?')) {
      deleteSalaryMutation.mutate(salary.id);
    }
  };

  const handleSalarySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeForSalary) return;

    const startDate = new Date(salaryFormData.effectiveFrom!);
    startDate.setHours(0, 0, 0, 0);
    const endDate = salaryFormData.effectiveTo ? new Date(salaryFormData.effectiveTo) : null;
    if (endDate) {
      endDate.setHours(23, 59, 59, 999);
    }

    const data = {
      baseSalary: parseFloat(salaryFormData.baseSalary as any),
      allowance: parseFloat(salaryFormData.allowance as any) || 0,
      deduction: parseFloat(salaryFormData.deduction as any) || 0,
      currency: salaryFormData.currency || 'AED',
      effectiveFrom: startDate.toISOString(),
      effectiveTo: endDate ? endDate.toISOString() : null,
    };

    if (editingSalary) {
      updateSalaryMutation.mutate({ salaryId: editingSalary.id, data });
    } else {
      createSalaryMutation.mutate({ employeeId: selectedEmployeeForSalary.id, data });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600 dark:text-gray-300">Loading employees...</div>
      </div>
    );
  }

  const employees = data || [];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Employees</h1>
        {canManage && (
          <button type="button" onClick={handleAdd} className="btn-primary">
            Add Employee
          </button>
        )}
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Code</th>
                <th className="text-left py-3 px-4">Name</th>
                <th className="text-left py-3 px-4">Email</th>
                <th className="text-left py-3 px-4">Department</th>
                <th className="text-left py-3 px-4">Job Title</th>
                <th className="text-left py-3 px-4">Status</th>
                {canManage && <th className="text-left py-3 px-4">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {employees.map((employee: Employee) => (
                <tr key={employee.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="py-3 px-4">{employee.code}</td>
                  <td className="py-3 px-4">{`${employee.firstName} ${employee.lastName}`}</td>
                  <td className="py-3 px-4">{employee.email}</td>
                  <td className="py-3 px-4">{employee.department?.code || 'N/A'}</td>
                  <td className="py-3 px-4">{employee.jobTitle}</td>
                  <td className="py-3 px-4">
                    <span className={employee.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}>
                      {employee.status}
                    </span>
                  </td>
                  {canManage && (
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleEdit(employee);
                        }}
                        className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleManageSalary(employee);
                        }}
                        className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 mr-3"
                      >
                        Salary
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleDelete(employee);
                        }}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        disabled={deleteMutation.isPending}
                      >
                        {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto transition-colors">
            <h2 className="text-2xl font-bold mb-4 dark:text-gray-100">
              {editingEmployee ? 'Edit Employee' : 'Add Employee'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">Employee Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.code || ''}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="input"
                    disabled={!!editingEmployee}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName || ''}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName || ''}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">Phone</label>
                  <input
                    type="text"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">Gender</label>
                  <select
                    value={formData.gender || ''}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="input"
                  >
                    <option value="">Select...</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">Hire Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.hireDate || ''}
                    onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">Department *</label>
                  <select
                    required
                    value={formData.departmentId || ''}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    className="input"
                  >
                    <option value="">Select Department...</option>
                    {departments.filter(Boolean).map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.code} - {dept.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">Job Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.jobTitle || ''}
                    onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">Status *</label>
                  <select
                    required
                    value={formData.status || 'ACTIVE'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="input"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? 'Saving...'
                    : editingEmployee
                    ? 'Update'
                    : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Salary Management Modal */}
      {showSalaryModal && selectedEmployeeForSalary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto transition-colors">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold dark:text-gray-100">
                Salary Management - {selectedEmployeeForSalary.firstName} {selectedEmployeeForSalary.lastName}
              </h2>
              <button
                onClick={() => {
                  setShowSalaryModal(false);
                  setSelectedEmployeeForSalary(null);
                  setShowSalaryForm(false);
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            {!showSalaryForm ? (
              <>
                <div className="flex justify-end mb-4">
                  <button type="button" onClick={handleAddSalary} className="btn-primary">
                    Add Salary
                  </button>
                </div>

                <div className="card">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-3">Effective From</th>
                        <th className="text-left py-2 px-3">Effective To</th>
                        <th className="text-right py-2 px-3">Base Salary</th>
                        <th className="text-right py-2 px-3">Allowance</th>
                        <th className="text-right py-2 px-3">Deduction</th>
                        <th className="text-right py-2 px-3">Net</th>
                        <th className="text-left py-2 px-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salariesData && salariesData.length > 0 ? (
                        salariesData.map((salary: Salary) => {
                          // Convert Decimal values to numbers
                          const baseSalary = Number(salary.baseSalary || 0);
                          const allowance = Number(salary.allowance || 0);
                          const deduction = Number(salary.deduction || 0);
                          const net = baseSalary + allowance - deduction;
                          const currency = salary.currency || 'AED';
                          const isActive = !salary.effectiveTo || new Date(salary.effectiveTo) > new Date();
                          return (
                            <tr key={salary.id} className={`border-b ${isActive ? 'bg-green-50 dark:bg-green-900/20' : ''}`}>
                              <td className="py-2 px-3">
                                {format(new Date(salary.effectiveFrom), 'MMM dd, yyyy')}
                              </td>
                              <td className="py-2 px-3">
                                {salary.effectiveTo ? format(new Date(salary.effectiveTo), 'MMM dd, yyyy') : 'Active'}
                              </td>
                              <td className="py-2 px-3 text-right">
                                {baseSalary.toFixed(2)} {currency}
                              </td>
                              <td className="py-2 px-3 text-right">
                                {allowance.toFixed(2)} {currency}
                              </td>
                              <td className="py-2 px-3 text-right">
                                {deduction.toFixed(2)} {currency}
                              </td>
                              <td className="py-2 px-3 text-right font-semibold">
                                {net.toFixed(2)} {currency}
                              </td>
                              <td className="py-2 px-3">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleEditSalary(salary);
                                  }}
                                  className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 mr-2 text-sm"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleDeleteSalary(salary);
                                  }}
                                  className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm"
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={7} className="py-4 text-center text-gray-600 dark:text-gray-400">
                            No salary records found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <form onSubmit={handleSalarySubmit} className="space-y-4">
                <h3 className="text-xl font-bold mb-4 dark:text-gray-100">
                  {editingSalary ? 'Edit Salary' : 'Add Salary'}
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">Currency *</label>
                    <select
                      required
                      value={salaryFormData.currency || 'AED'}
                      onChange={(e) => setSalaryFormData({ ...salaryFormData, currency: e.target.value as 'USD' | 'JD' | 'AED' })}
                      className="input"
                    >
                      <option value="USD">USD - US Dollar</option>
                      <option value="JD">JD - Jordanian Dinar</option>
                      <option value="AED">AED - UAE Dirham</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">Base Salary *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={salaryFormData.baseSalary || ''}
                      onChange={(e) => setSalaryFormData({ ...salaryFormData, baseSalary: parseFloat(e.target.value) || 0 })}
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">Allowance</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={salaryFormData.allowance || ''}
                      onChange={(e) => setSalaryFormData({ ...salaryFormData, allowance: parseFloat(e.target.value) || 0 })}
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">Deduction</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={salaryFormData.deduction || ''}
                      onChange={(e) => setSalaryFormData({ ...salaryFormData, deduction: parseFloat(e.target.value) || 0 })}
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">Effective From *</label>
                    <input
                      type="date"
                      required
                      value={salaryFormData.effectiveFrom || ''}
                      onChange={(e) => setSalaryFormData({ ...salaryFormData, effectiveFrom: e.target.value })}
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">Effective To (Optional)</label>
                    <input
                      type="date"
                      value={salaryFormData.effectiveTo || ''}
                      onChange={(e) => setSalaryFormData({ ...salaryFormData, effectiveTo: e.target.value || null })}
                      className="input"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Leave empty for active salary</p>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md">
                  <p className="text-sm font-medium mb-1 dark:text-gray-300">Net Salary Calculation:</p>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">
                    {((salaryFormData.baseSalary || 0) + (salaryFormData.allowance || 0) - (salaryFormData.deduction || 0)).toFixed(2)} {salaryFormData.currency || 'AED'}
                  </p>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSalaryForm(false);
                      setEditingSalary(null);
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={createSalaryMutation.isPending || updateSalaryMutation.isPending}
                  >
                    {createSalaryMutation.isPending || updateSalaryMutation.isPending
                      ? 'Saving...'
                      : editingSalary
                      ? 'Update'
                      : 'Create'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeesPage;
