import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { payrollApi } from '../lib/api';
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import type { PayrollRun } from '../types';

const PayrollPage = () => {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedRun, setSelectedRun] = useState<PayrollRun | null>(null);
  const [formData, setFormData] = useState({
    periodStart: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    periodEnd: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
    notes: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['payroll', 'runs'],
    queryFn: async () => {
      const response = await payrollApi.getRuns();
      return response.data.data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => payrollApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll'] });
      setShowCreateModal(false);
      setFormData({
        periodStart: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
        periodEnd: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
        notes: '',
      });
      toast.success('Payroll run created successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to create: ${error.response?.data?.message || 'Unknown error'}`);
    },
  });

  const prepareMutation = useMutation({
    mutationFn: (id: string) => payrollApi.prepare(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll'] });
      toast.success('Payroll run prepared successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to prepare: ${error.response?.data?.message || 'Unknown error'}`);
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => payrollApi.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll'] });
      toast.success('Payroll run approved');
    },
    onError: (error: any) => {
      toast.error(`Failed to approve: ${error.response?.data?.message || 'Unknown error'}`);
    },
  });

  const payMutation = useMutation({
    mutationFn: (id: string) => payrollApi.pay(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll'] });
      toast.success('Payroll run marked as paid');
    },
    onError: (error: any) => {
      toast.error(`Failed to mark as paid: ${error.response?.data?.message || 'Unknown error'}`);
    },
  });

  const handleCreate = () => {
    setShowCreateModal(true);
  };

  const handleView = (run: PayrollRun) => {
    setSelectedRun(run);
    setShowViewModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const startDate = new Date(formData.periodStart);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(formData.periodEnd);
    endDate.setHours(23, 59, 59, 999);

    createMutation.mutate({
      periodStart: startDate.toISOString(),
      periodEnd: endDate.toISOString(),
      notes: formData.notes || undefined,
    });
  };

  const calculateTotals = (items: any[]) => {
    return items.reduce(
      (acc, item) => ({
        gross: acc.gross + parseFloat(item.grossSalary || 0),
        allowance: acc.allowance + parseFloat(item.totalAllowance || 0),
        deduction: acc.deduction + parseFloat(item.totalDeduction || 0),
        net: acc.net + parseFloat(item.netPay || 0),
      }),
      { gross: 0, allowance: 0, deduction: 0, net: 0 }
    );
  };

  if (isLoading) {
    return <div className="text-center py-8 text-gray-600">Loading payroll runs...</div>;
  }

  const runs = data || [];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Payroll</h1>
        <button onClick={handleCreate} className="btn-primary">New Payroll Run</button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">Total Runs</h3>
          <p className="text-2xl font-bold text-primary-600">{runs.length}</p>
        </div>
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">Draft</h3>
          <p className="text-2xl font-bold text-yellow-600">
            {runs.filter((r: any) => r.status === 'DRAFT').length}
          </p>
        </div>
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">Approved</h3>
          <p className="text-2xl font-bold text-blue-600">
            {runs.filter((r: any) => r.status === 'APPROVED').length}
          </p>
        </div>
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">Paid</h3>
          <p className="text-2xl font-bold text-green-600">
            {runs.filter((r: any) => r.status === 'PAID').length}
          </p>
        </div>
      </div>

      {/* Payroll Runs Table */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Payroll Runs</h2>
        {runs.length === 0 ? (
          <div className="text-center py-8 text-gray-600">
            <p className="mb-4">No payroll runs found</p>
            <button onClick={handleCreate} className="btn-primary">Create First Payroll Run</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Period</th>
                  <th className="text-left py-3 px-4">Start Date</th>
                  <th className="text-left py-3 px-4">End Date</th>
                  <th className="text-left py-3 px-4">Employees</th>
                  <th className="text-right py-3 px-4">Total Net Pay</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((run: any) => {
                  const totals = calculateTotals(run.items || []);
                  return (
                    <tr key={run.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">{format(new Date(run.periodStart), 'MMM yyyy')}</td>
                      <td className="py-3 px-4">{format(new Date(run.periodStart), 'MMM dd, yyyy')}</td>
                      <td className="py-3 px-4">{format(new Date(run.periodEnd), 'MMM dd, yyyy')}</td>
                      <td className="py-3 px-4">{run.items?.length || 0}</td>
                      <td className="py-3 px-4 text-right">
                        {totals.net.toFixed(2)} AED
                      </td>
                      <td className="py-3 px-4">
                        <span className={
                          run.status === 'PAID' ? 'badge-success' :
                          run.status === 'APPROVED' ? 'badge-info' :
                          'badge-warning'
                        }>
                          {run.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => handleView(run)}
                            className="text-primary-600 hover:text-primary-800 text-sm"
                          >
                            View
                          </button>
                          {run.status === 'DRAFT' && run.items?.length === 0 && (
                            <button
                              onClick={() => {
                                if (confirm('Prepare this payroll run? This will calculate salaries for all active employees.')) {
                                  prepareMutation.mutate(run.id);
                                }
                              }}
                              className="text-orange-600 hover:text-orange-800 text-sm"
                            >
                              Prepare
                            </button>
                          )}
                          {run.status === 'DRAFT' && run.items && run.items.length > 0 && (
                            <button
                              onClick={() => {
                                if (confirm('Approve this payroll run?')) {
                                  approveMutation.mutate(run.id);
                                }
                              }}
                              className="text-green-600 hover:text-green-800 text-sm"
                            >
                              Approve
                            </button>
                          )}
                          {run.status === 'APPROVED' && (
                            <button
                              onClick={() => {
                                if (confirm('Mark this payroll as paid?')) {
                                  payMutation.mutate(run.id);
                                }
                              }}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              Mark Paid
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Payroll Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Create Payroll Run</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.periodStart}
                    onChange={(e) => setFormData({ ...formData, periodStart: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">End Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.periodEnd}
                    onChange={(e) => setFormData({ ...formData, periodEnd: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notes (Optional)</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Add any notes for this payroll run..."
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Payroll Details Modal */}
      {showViewModal && selectedRun && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Payroll Details</h2>
            
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Period</p>
                  <p className="font-semibold">
                    {format(new Date(selectedRun.periodStart), 'MMM dd, yyyy')} - 
                    {format(new Date(selectedRun.periodEnd), 'MMM dd, yyyy')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p>
                    <span className={
                      selectedRun.status === 'PAID' ? 'badge-success' :
                      selectedRun.status === 'APPROVED' ? 'badge-info' :
                      'badge-warning'
                    }>
                      {selectedRun.status}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Employees</p>
                  <p className="font-semibold">{selectedRun.items?.length || 0}</p>
                </div>
              </div>
              {selectedRun.notes && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600">Notes</p>
                  <p className="text-sm">{selectedRun.notes}</p>
                </div>
              )}
            </div>

            {selectedRun.items && selectedRun.items.length > 0 ? (
              <>
                <div className="overflow-x-auto mb-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-3">Employee</th>
                        <th className="text-right py-2 px-3">Gross Salary</th>
                        <th className="text-right py-2 px-3">Allowances</th>
                        <th className="text-right py-2 px-3">Deductions</th>
                        <th className="text-right py-2 px-3">Net Pay</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedRun.items.map((item: any) => {
                        const currency = item.currency || 'AED';
                        return (
                          <tr key={item.id} className="border-b hover:bg-gray-50">
                            <td className="py-2 px-3">
                              {item.employee 
                                ? `${item.employee.firstName} ${item.employee.lastName}`
                                : 'Unknown'}
                            </td>
                            <td className="py-2 px-3 text-right">
                              {parseFloat(item.grossSalary || 0).toFixed(2)} {currency}
                            </td>
                            <td className="py-2 px-3 text-right">
                              {parseFloat(item.totalAllowance || 0).toFixed(2)} {currency}
                            </td>
                            <td className="py-2 px-3 text-right">
                              {parseFloat(item.totalDeduction || 0).toFixed(2)} {currency}
                            </td>
                            <td className="py-2 px-3 text-right font-semibold">
                              {parseFloat(item.netPay || 0).toFixed(2)} {currency}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="border-t-2 font-bold">
                      <tr>
                        <td className="py-2 px-3">Totals</td>
                        <td className="py-2 px-3 text-right">
                          {calculateTotals(selectedRun.items).gross.toFixed(2)} AED
                        </td>
                        <td className="py-2 px-3 text-right">
                          {calculateTotals(selectedRun.items).allowance.toFixed(2)} AED
                        </td>
                        <td className="py-2 px-3 text-right">
                          {calculateTotals(selectedRun.items).deduction.toFixed(2)} AED
                        </td>
                        <td className="py-2 px-3 text-right">
                          {calculateTotals(selectedRun.items).net.toFixed(2)} AED
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-600">
                <p className="mb-4">No payroll items found</p>
                {selectedRun.status === 'DRAFT' && (
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      if (confirm('Prepare this payroll run? This will calculate salaries for all active employees.')) {
                        prepareMutation.mutate(selectedRun.id);
                      }
                    }}
                    className="btn-primary"
                  >
                    Prepare Payroll
                  </button>
                )}
              </div>
            )}

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setShowViewModal(false)}
                className="btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollPage;
