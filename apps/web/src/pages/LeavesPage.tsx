import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { leaveApi } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { format, differenceInDays, addDays } from 'date-fns';
import type { LeaveRequest, LeaveType } from '../types';

interface LeaveFormData {
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  reason?: string;
}

const LeavesPage = () => {
  const { user, hasRole } = useAuthStore();
  const queryClient = useQueryClient();
  const isEmployee = hasRole('EMPLOYEE');
  const isManager = hasRole(['MANAGER', 'HR', 'ADMIN']);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<Partial<LeaveFormData>>({});
  const [selectedLeaveType, setSelectedLeaveType] = useState<LeaveType | null>(null);

  // Fetch leave requests
  const { data: requestsData, isLoading } = useQuery({
    queryKey: ['leaves', 'requests'],
    queryFn: async () => {
      const response = await leaveApi.getRequests();
      return response.data.data || [];
    },
  });

  // Fetch leave types from existing requests
  const leaveTypes = Array.from(
    new Map(
      (requestsData || []).map((req: LeaveRequest) => [req.leaveType?.id, req.leaveType])
    ).values()
  ).filter(Boolean) as LeaveType[];

  // Calculate days when dates change
  const calculateDays = () => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (end >= start) {
        return differenceInDays(end, start) + 1;
      }
    }
    return 0;
  };

  const days = calculateDays();

  const approveMutation = useMutation({
    mutationFn: (id: string) => leaveApi.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      toast.success('Leave request approved');
    },
    onError: (error: any) => {
      toast.error(`Failed to approve: ${error.response?.data?.message || 'Unknown error'}`);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => leaveApi.reject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      toast.success('Leave request rejected');
    },
    onError: (error: any) => {
      toast.error(`Failed to reject: ${error.response?.data?.message || 'Unknown error'}`);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => leaveApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      toast.success('Leave request cancelled');
    },
    onError: (error: any) => {
      toast.error(`Failed to cancel: ${error.response?.data?.message || 'Unknown error'}`);
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => leaveApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      setShowModal(false);
      setFormData({});
      toast.success('Leave request created successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to create: ${error.response?.data?.message || 'Unknown error'}`);
    },
  });

  const handleRequestLeave = () => {
    setFormData({});
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.leaveTypeId || !formData.startDate || !formData.endDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Convert date strings to datetime strings (start of day)
    const startDateTime = new Date(formData.startDate);
    startDateTime.setHours(0, 0, 0, 0);
    const endDateTime = new Date(formData.endDate);
    endDateTime.setHours(23, 59, 59, 999);

    const submitData = {
      leaveTypeId: formData.leaveTypeId,
      startDate: startDateTime.toISOString(),
      endDate: endDateTime.toISOString(),
      reason: formData.reason || undefined,
    };

    createMutation.mutate(submitData);
  };

  const handleStartDateChange = (date: string) => {
    setFormData({ ...formData, startDate: date });
    // Auto-set end date to same day if not set
    if (!formData.endDate || new Date(date) > new Date(formData.endDate)) {
      setFormData({ ...formData, startDate: date, endDate: date });
    }
  };

  const requests = requestsData || [];
  const userRequests = isEmployee ? requests.filter((req: LeaveRequest) => req.employeeId === user?.employeeId) : requests;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Leave Management</h1>
        {isEmployee && (
          <button onClick={handleRequestLeave} className="btn-primary">
            Request Leave
          </button>
        )}
      </div>

      {/* Leave Balances for Employees */}
      {isEmployee && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="card">
            <h3 className="font-semibold text-gray-600 dark:text-gray-300 mb-2">Annual Leave</h3>
            <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">21 days</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Available</p>
          </div>
          <div className="card">
            <h3 className="font-semibold text-gray-600 dark:text-gray-300 mb-2">Sick Leave</h3>
            <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">7 days</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Available</p>
          </div>
          <div className="card">
            <h3 className="font-semibold text-gray-600 dark:text-gray-300 mb-2">Unpaid Leave</h3>
            <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">Unlimited</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Available</p>
          </div>
        </div>
      )}

      <div className="card">
        <h2 className="text-xl font-bold mb-4">
          {isEmployee ? 'My Leave Requests' : 'Leave Requests'}
        </h2>
        {isLoading ? (
          <div className="text-center py-8 text-gray-600 dark:text-gray-300">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Employee</th>
                  <th className="text-left py-3 px-4">Type</th>
                  <th className="text-left py-3 px-4">Start Date</th>
                  <th className="text-left py-3 px-4">End Date</th>
                  <th className="text-left py-3 px-4">Days</th>
                  <th className="text-left py-3 px-4">Reason</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {userRequests.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-gray-600 dark:text-gray-400">
                      No leave requests found
                    </td>
                  </tr>
                ) : (
                  userRequests.map((request: LeaveRequest) => (
                    <tr key={request.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="py-3 px-4">
                        {request.employee 
                          ? `${request.employee.firstName} ${request.employee.lastName}` 
                          : 'Unknown'}
                      </td>
                      <td className="py-3 px-4">{request.leaveType?.name || 'N/A'}</td>
                      <td className="py-3 px-4">{format(new Date(request.startDate), 'MMM dd, yyyy')}</td>
                      <td className="py-3 px-4">{format(new Date(request.endDate), 'MMM dd, yyyy')}</td>
                      <td className="py-3 px-4">{request.days}</td>
                      <td className="py-3 px-4">{request.reason || '-'}</td>
                      <td className="py-3 px-4">
                        <span className={
                          request.status === 'APPROVED' ? 'badge-success' :
                          request.status === 'REJECTED' ? 'badge-danger' :
                          request.status === 'CANCELLED' ? 'badge-info' :
                          'badge-warning'
                        }>
                          {request.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          {isManager && request.status === 'PENDING' && (
                            <>
                              <button 
                                onClick={() => approveMutation.mutate(request.id)}
                                className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 text-sm"
                              >
                                Approve
                              </button>
                              <button 
                                onClick={() => rejectMutation.mutate(request.id)}
                                className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {isEmployee && 
                           (request.status === 'PENDING' || request.status === 'APPROVED') && 
                           new Date(request.startDate) > new Date() && (
                            <button 
                              onClick={() => {
                                if (confirm('Cancel this leave request?')) {
                                  cancelMutation.mutate(request.id);
                                }
                              }}
                              className="text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300 text-sm"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Request Leave Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto transition-colors">
            <h2 className="text-2xl font-bold mb-4 dark:text-gray-100">Request Leave</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Leave Type *</label>
                <select
                  required
                  value={formData.leaveTypeId || ''}
                  onChange={(e) => {
                    const selected = leaveTypes.find(lt => lt.id === e.target.value);
                    setSelectedLeaveType(selected || null);
                    setFormData({ ...formData, leaveTypeId: e.target.value });
                  }}
                  className="input"
                  disabled={leaveTypes.length === 0}
                >
                  <option value="">
                    {leaveTypes.length === 0 ? 'No leave types available. Please contact HR.' : 'Select Leave Type...'}
                  </option>
                  {leaveTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name} ({type.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">Start Date *</label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={formData.startDate || ''}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">End Date *</label>
                  <input
                    type="date"
                    required
                    min={formData.startDate || new Date().toISOString().split('T')[0]}
                    value={formData.endDate || ''}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="input"
                  />
                </div>
              </div>

              {days > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Days Requested:</strong> {days} day{days !== 1 ? 's' : ''}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Reason (Optional)</label>
                <textarea
                  value={formData.reason || ''}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  rows={3}
                  className="input"
                  placeholder="Enter reason for leave..."
                />
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
                  disabled={createMutation.isPending || days === 0}
                >
                  {createMutation.isPending ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeavesPage;
