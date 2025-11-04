import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectApi, employeeApi, settingsApi } from '../lib/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const PROJECT_STATUSES = ['LEAD', 'PLANNING', 'RUNNING', 'ON_HOLD', 'COMPLETED', 'CANCELLED'] as const;
const CURRENCIES = ['USD', 'JD', 'AED'] as const;

export default function ProjectsPage() {
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'resources' | 'expenses' | 'invoices' | 'payments'>('overview');
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [editingResource, setEditingResource] = useState<any>(null);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [editingInvoice, setEditingInvoice] = useState<any>(null);
  const [editingPayment, setEditingPayment] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const queryClient = useQueryClient();

  const { data: projectsData, isLoading } = useQuery({
    queryKey: ['projects', page, statusFilter],
    queryFn: () => projectApi.getAll({ page, limit: 20, status: statusFilter || undefined }),
  });

  const { data: employeesData } = useQuery({
    queryKey: ['employees'],
    queryFn: () => employeeApi.getAll({ limit: 1000 }),
  });

  // Removed unused queries - departmentsData and projectDetail

  const { data: projectSummary } = useQuery({
    queryKey: ['project-summary', selectedProject?.id],
    queryFn: () => projectApi.getSummary(selectedProject.id),
    enabled: !!selectedProject,
  });

  const { data: resourcesData } = useQuery({
    queryKey: ['project-resources', selectedProject?.id],
    queryFn: () => projectApi.getResources(selectedProject.id),
    enabled: !!selectedProject && activeTab === 'resources',
  });

  const { data: expensesData } = useQuery({
    queryKey: ['project-expenses', selectedProject?.id],
    queryFn: () => projectApi.getExpenses(selectedProject.id, { page: 1, limit: 100 }),
    enabled: !!selectedProject && activeTab === 'expenses',
  });

  const { data: invoicesData } = useQuery({
    queryKey: ['project-invoices', selectedProject?.id],
    queryFn: () => projectApi.getInvoices(selectedProject.id, { page: 1, limit: 100 }),
    enabled: !!selectedProject && activeTab === 'invoices',
  });

  const { data: paymentsData } = useQuery({
    queryKey: ['project-payments', selectedProject?.id],
    queryFn: () => projectApi.getPayments(selectedProject.id, { page: 1, limit: 100 }),
    enabled: !!selectedProject && activeTab === 'payments',
  });

  const [formData, setFormData] = useState<any>({
    name: '',
    code: '',
    description: '',
    status: 'LEAD',
    budget: 0,
    currency: 'AED',
    startDate: '',
    endDate: '',
    clientName: '',
    clientEmail: '',
    managerEmployeeId: '',
    notes: '',
  });

  const [resourceFormData, setResourceFormData] = useState<any>({
    employeeId: '',
    role: '',
    allocation: 100,
    hourlyRate: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: '',
    notes: '',
  });

  const [expenseFormData, setExpenseFormData] = useState<any>({
    category: '',
    description: '',
    amount: 0,
    currency: 'AED',
    expenseDate: format(new Date(), 'yyyy-MM-dd'),
    vendor: '',
    receiptUrl: '',
    notes: '',
  });

  const [invoiceFormData, setInvoiceFormData] = useState<any>({
    invoiceNumber: '',
    amount: 0,
    currency: 'AED',
    issueDate: format(new Date(), 'yyyy-MM-dd'),
    dueDate: format(new Date(), 'yyyy-MM-dd'),
    description: '',
    status: 'DRAFT',
    attachmentUrl: '',
    notes: '',
  });

  const [paymentFormData, setPaymentFormData] = useState<any>({
    invoiceId: '',
    amount: 0,
    currency: 'AED',
    paymentDate: format(new Date(), 'yyyy-MM-dd'),
    paymentMethod: '',
    reference: '',
    notes: '',
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => projectApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setShowModal(false);
      setFormData({
        name: '',
        code: '',
        description: '',
        status: 'LEAD',
        budget: 0,
        currency: 'AED',
        startDate: '',
        endDate: '',
        clientName: '',
        clientEmail: '',
        managerEmployeeId: '',
        notes: '',
      });
      toast.success('Project created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create project');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => projectApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project'] });
      setShowModal(false);
      setEditingProject(null);
      toast.success('Project updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update project');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => projectApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      if (selectedProject?.id) setSelectedProject(null);
      toast.success('Project deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete project');
    },
  });

  const addResourceMutation = useMutation({
    mutationFn: (data: any) => projectApi.addResource(selectedProject.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-resources'] });
      setShowResourceModal(false);
      setResourceFormData({
        employeeId: '',
        role: '',
        allocation: 100,
        hourlyRate: '',
        startDate: format(new Date(), 'yyyy-MM-dd'),
        endDate: '',
        notes: '',
      });
      toast.success('Resource added successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add resource');
    },
  });

  const updateResourceMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => projectApi.updateResource(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-resources'] });
      setShowResourceModal(false);
      setEditingResource(null);
      toast.success('Resource updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update resource');
    },
  });

  const deleteResourceMutation = useMutation({
    mutationFn: (id: string) => projectApi.deleteResource(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-resources'] });
      toast.success('Resource removed successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to remove resource');
    },
  });

  const addExpenseMutation = useMutation({
    mutationFn: (data: any) => projectApi.addExpense(selectedProject.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-expenses'] });
      queryClient.invalidateQueries({ queryKey: ['project-summary'] });
      setShowExpenseModal(false);
      setExpenseFormData({
        category: '',
        description: '',
        amount: 0,
        currency: 'AED',
        expenseDate: format(new Date(), 'yyyy-MM-dd'),
        vendor: '',
        receiptUrl: '',
        notes: '',
      });
      toast.success('Expense added successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add expense');
    },
  });

  const updateExpenseMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => projectApi.updateExpense(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-expenses'] });
      queryClient.invalidateQueries({ queryKey: ['project-summary'] });
      setShowExpenseModal(false);
      setEditingExpense(null);
      toast.success('Expense updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update expense');
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: (id: string) => projectApi.deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-expenses'] });
      queryClient.invalidateQueries({ queryKey: ['project-summary'] });
      toast.success('Expense deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete expense');
    },
  });

  const addInvoiceMutation = useMutation({
    mutationFn: (data: any) => projectApi.addInvoice(selectedProject.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['project-summary'] });
      setShowInvoiceModal(false);
      setInvoiceFormData({
        invoiceNumber: '',
        amount: 0,
        currency: 'AED',
        issueDate: format(new Date(), 'yyyy-MM-dd'),
        dueDate: format(new Date(), 'yyyy-MM-dd'),
        description: '',
        status: 'DRAFT',
        attachmentUrl: '',
        notes: '',
      });
      toast.success('Invoice created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create invoice');
    },
  });

  const updateInvoiceMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => projectApi.updateInvoice(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['project-summary'] });
      setShowInvoiceModal(false);
      setEditingInvoice(null);
      toast.success('Invoice updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update invoice');
    },
  });

  const deleteInvoiceMutation = useMutation({
    mutationFn: (id: string) => projectApi.deleteInvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['project-summary'] });
      toast.success('Invoice deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete invoice');
    },
  });

  const addPaymentMutation = useMutation({
    mutationFn: (data: any) => projectApi.addPayment(selectedProject.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-payments'] });
      queryClient.invalidateQueries({ queryKey: ['project-summary'] });
      setShowPaymentModal(false);
      setPaymentFormData({
        invoiceId: '',
        amount: 0,
        currency: 'AED',
        paymentDate: format(new Date(), 'yyyy-MM-dd'),
        paymentMethod: '',
        reference: '',
        notes: '',
      });
      toast.success('Payment recorded successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to record payment');
    },
  });

  const updatePaymentMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => projectApi.updatePayment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-payments'] });
      queryClient.invalidateQueries({ queryKey: ['project-summary'] });
      setShowPaymentModal(false);
      setEditingPayment(null);
      toast.success('Payment updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update payment');
    },
  });

  const deletePaymentMutation = useMutation({
    mutationFn: (id: string) => projectApi.deletePayment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-payments'] });
      queryClient.invalidateQueries({ queryKey: ['project-summary'] });
      toast.success('Payment deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete payment');
    },
  });

  const handleEdit = (project: any) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      code: project.code,
      description: project.description || '',
      status: project.status,
      budget: Number(project.budget),
      currency: project.currency,
      startDate: project.startDate ? project.startDate.split('T')[0] : '',
      endDate: project.endDate ? project.endDate.split('T')[0] : '',
      clientName: project.clientName || '',
      clientEmail: project.clientEmail || '',
      managerEmployeeId: project.manager?.id || '',
      notes: project.notes || '',
    });
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingProject(null);
    setFormData({
      name: '',
      code: '',
      description: '',
      status: 'LEAD',
      budget: 0,
      currency: 'AED',
      startDate: '',
      endDate: '',
      clientName: '',
      clientEmail: '',
      managerEmployeeId: '',
      notes: '',
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProject) {
      updateMutation.mutate({ id: editingProject.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleViewProject = (project: any) => {
    setSelectedProject(project);
    setActiveTab('overview');
  };

  const handleEditResource = (resource: any) => {
    setEditingResource(resource);
    setResourceFormData({
      employeeId: resource.employeeId,
      role: resource.role || '',
      allocation: Number(resource.allocation),
      hourlyRate: resource.hourlyRate ? Number(resource.hourlyRate) : '',
      startDate: resource.startDate.split('T')[0],
      endDate: resource.endDate ? resource.endDate.split('T')[0] : '',
      notes: resource.notes || '',
    });
    setShowResourceModal(true);
  };

  const handleAddResource = () => {
    setEditingResource(null);
    setResourceFormData({
      employeeId: '',
      role: '',
      allocation: 100,
      hourlyRate: '',
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: '',
      notes: '',
    });
    setShowResourceModal(true);
  };

  const handleResourceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...resourceFormData };
    if (!data.endDate) delete data.endDate;
    if (!data.hourlyRate) delete data.hourlyRate;
    if (editingResource) {
      updateResourceMutation.mutate({ id: editingResource.id, data });
    } else {
      addResourceMutation.mutate(data);
    }
  };

  const handleEditExpense = (expense: any) => {
    setEditingExpense(expense);
    setExpenseFormData({
      category: expense.category,
      description: expense.description,
      amount: Number(expense.amount),
      currency: expense.currency,
      expenseDate: expense.expenseDate.split('T')[0],
      vendor: expense.vendor || '',
      receiptUrl: expense.receiptUrl || '',
      notes: expense.notes || '',
    });
    setShowExpenseModal(true);
  };

  const handleAddExpense = () => {
    setEditingExpense(null);
    setExpenseFormData({
      category: '',
      description: '',
      amount: 0,
      currency: selectedProject?.currency || 'AED',
      expenseDate: format(new Date(), 'yyyy-MM-dd'),
      vendor: '',
      receiptUrl: '',
      notes: '',
    });
    setShowExpenseModal(true);
  };

  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingExpense) {
      updateExpenseMutation.mutate({ id: editingExpense.id, data: expenseFormData });
    } else {
      addExpenseMutation.mutate(expenseFormData);
    }
  };

  const handleEditInvoice = (invoice: any) => {
    setEditingInvoice(invoice);
    setInvoiceFormData({
      invoiceNumber: invoice.invoiceNumber,
      amount: Number(invoice.amount),
      currency: invoice.currency,
      issueDate: invoice.issueDate.split('T')[0],
      dueDate: invoice.dueDate.split('T')[0],
      description: invoice.description || '',
      status: invoice.status,
      attachmentUrl: invoice.attachmentUrl || '',
      notes: invoice.notes || '',
    });
    setShowInvoiceModal(true);
  };

  const handleAddInvoice = () => {
    setEditingInvoice(null);
    setInvoiceFormData({
      invoiceNumber: '',
      amount: 0,
      currency: selectedProject?.currency || 'AED',
      issueDate: format(new Date(), 'yyyy-MM-dd'),
      dueDate: format(new Date(), 'yyyy-MM-dd'),
      description: '',
      status: 'DRAFT',
      attachmentUrl: '',
      notes: '',
    });
    setShowInvoiceModal(true);
  };

  const handleInvoiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingInvoice) {
      updateInvoiceMutation.mutate({ id: editingInvoice.id, data: invoiceFormData });
    } else {
      addInvoiceMutation.mutate(invoiceFormData);
    }
  };

  const handleEditPayment = (payment: any) => {
    setEditingPayment(payment);
    setPaymentFormData({
      invoiceId: payment.invoiceId || '',
      amount: Number(payment.amount),
      currency: payment.currency,
      paymentDate: payment.paymentDate.split('T')[0],
      paymentMethod: payment.paymentMethod,
      reference: payment.reference || '',
      notes: payment.notes || '',
    });
    setShowPaymentModal(true);
  };

  const handleAddPayment = () => {
    setEditingPayment(null);
    setPaymentFormData({
      invoiceId: '',
      amount: 0,
      currency: selectedProject?.currency || 'AED',
      paymentDate: format(new Date(), 'yyyy-MM-dd'),
      paymentMethod: '',
      reference: '',
      notes: '',
    });
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...paymentFormData };
    if (!data.invoiceId) delete data.invoiceId;
    if (editingPayment) {
      updatePaymentMutation.mutate({ id: editingPayment.id, data });
    } else {
      addPaymentMutation.mutate(data);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      LEAD: 'bg-gray-100 text-gray-800',
      PLANNING: 'bg-blue-100 text-blue-800',
      RUNNING: 'bg-green-100 text-green-800',
      ON_HOLD: 'bg-yellow-100 text-yellow-800',
      COMPLETED: 'bg-purple-100 text-purple-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const employees = employeesData?.data?.data || [];
  const projects = projectsData?.data?.data || [];
  const resources = resourcesData?.data?.data || [];
  const expenses = expensesData?.data?.data || [];
  const invoices = invoicesData?.data?.data || [];
  const payments = paymentsData?.data?.data || [];
  const summary = projectSummary?.data?.data;

  if (selectedProject) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <button
              onClick={() => setSelectedProject(null)}
              className="text-blue-600 hover:text-blue-800 mb-2"
            >
              ← Back to Projects
            </button>
            <h1 className="text-3xl font-bold">{selectedProject.name}</h1>
            <p className="text-gray-600">{selectedProject.code}</p>
          </div>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-gray-600 text-sm">Budget</p>
              <p className="text-2xl font-bold">{summary.project.currency} {Number(summary.project.budget).toLocaleString()}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-gray-600 text-sm">Expenses</p>
              <p className="text-2xl font-bold text-red-600">{summary.project.currency} {summary.expenses.total.toLocaleString()}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-gray-600 text-sm">Invoices</p>
              <p className="text-2xl font-bold text-blue-600">{summary.project.currency} {summary.invoices.total.toLocaleString()}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <p className="text-gray-600 text-sm">Payments</p>
              <p className="text-2xl font-bold text-green-600">{summary.project.currency} {summary.invoices.paid.toLocaleString()}</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b mb-6">
          <nav className="flex space-x-8">
            {(['overview', 'resources', 'expenses', 'invoices', 'payments'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Project Details</h3>
                <dl className="space-y-2">
                  <div>
                    <dt className="text-gray-600">Status</dt>
                    <dd><span className={`px-2 py-1 rounded text-sm ${getStatusColor(selectedProject.status)}`}>{selectedProject.status}</span></dd>
                  </div>
                  <div>
                    <dt className="text-gray-600">Manager</dt>
                    <dd>{selectedProject.manager ? `${selectedProject.manager.firstName} ${selectedProject.manager.lastName}` : 'Not assigned'}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-600">Client</dt>
                    <dd>{selectedProject.clientName || 'N/A'}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-600">Start Date</dt>
                    <dd>{selectedProject.startDate ? format(new Date(selectedProject.startDate), 'MMM dd, yyyy') : 'N/A'}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-600">End Date</dt>
                    <dd>{selectedProject.endDate ? format(new Date(selectedProject.endDate), 'MMM dd, yyyy') : 'N/A'}</dd>
                  </div>
                </dl>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-gray-700">{selectedProject.description || 'No description'}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'resources' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Resources</h2>
              <button
                onClick={handleAddResource}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                + Add Resource
              </button>
            </div>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Allocation</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hourly Rate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {resources.map((resource: any) => (
                    <tr key={resource.id}>
                      <td className="px-6 py-4 whitespace-nowrap">{resource.employee?.firstName} {resource.employee?.lastName}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{resource.role || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{Number(resource.allocation)}%</td>
                      <td className="px-6 py-4 whitespace-nowrap">{resource.hourlyRate ? `${Number(resource.hourlyRate).toFixed(2)}` : 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{format(new Date(resource.startDate), 'MMM dd, yyyy')}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button onClick={() => handleEditResource(resource)} className="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
                        <button onClick={() => deleteResourceMutation.mutate(resource.id)} className="text-red-600 hover:text-red-900">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'expenses' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Expenses</h2>
              <button
                onClick={handleAddExpense}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                + Add Expense
              </button>
            </div>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {expenses.map((expense: any) => (
                    <tr key={expense.id}>
                      <td className="px-6 py-4 whitespace-nowrap">{format(new Date(expense.expenseDate), 'MMM dd, yyyy')}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{expense.category}</td>
                      <td className="px-6 py-4">{expense.description}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{expense.currency} {Number(expense.amount).toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{expense.vendor || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button onClick={() => handleEditExpense(expense)} className="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
                        <button onClick={() => deleteExpenseMutation.mutate(expense.id)} className="text-red-600 hover:text-red-900">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'invoices' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Invoices</h2>
              <button
                onClick={handleAddInvoice}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                + Add Invoice
              </button>
            </div>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice #</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Issue Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoices.map((invoice: any) => (
                    <tr key={invoice.id}>
                      <td className="px-6 py-4 whitespace-nowrap font-medium">{invoice.invoiceNumber}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{format(new Date(invoice.issueDate), 'MMM dd, yyyy')}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{format(new Date(invoice.dueDate), 'MMM dd, yyyy')}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{invoice.currency} {Number(invoice.amount).toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 py-1 rounded text-xs ${invoice.status === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{invoice.status}</span></td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button onClick={() => handleEditInvoice(invoice)} className="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
                        <button onClick={() => deleteInvoiceMutation.mutate(invoice.id)} className="text-red-600 hover:text-red-900">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'payments' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Payments</h2>
              <button
                onClick={handleAddPayment}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                + Add Payment
              </button>
            </div>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payments.map((payment: any) => (
                    <tr key={payment.id}>
                      <td className="px-6 py-4 whitespace-nowrap">{format(new Date(payment.paymentDate), 'MMM dd, yyyy')}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{payment.currency} {Number(payment.amount).toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{payment.paymentMethod}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{payment.reference || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{payment.invoice?.invoiceNumber || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button onClick={() => handleEditPayment(payment)} className="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
                        <button onClick={() => deletePaymentMutation.mutate(payment.id)} className="text-red-600 hover:text-red-900">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modals */}
        {showResourceModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4">{editingResource ? 'Edit Resource' : 'Add Resource'}</h2>
              <form onSubmit={handleResourceSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Employee</label>
                  <select
                    required
                    value={resourceFormData.employeeId}
                    onChange={(e) => setResourceFormData({ ...resourceFormData, employeeId: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  >
                    <option value="">Select Employee</option>
                    {employees.map((emp: any) => (
                      <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <input
                    type="text"
                    value={resourceFormData.role}
                    onChange={(e) => setResourceFormData({ ...resourceFormData, role: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Allocation (%)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      max="100"
                      value={resourceFormData.allocation}
                      onChange={(e) => setResourceFormData({ ...resourceFormData, allocation: Number(e.target.value) })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Hourly Rate</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={resourceFormData.hourlyRate}
                      onChange={(e) => setResourceFormData({ ...resourceFormData, hourlyRate: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Start Date</label>
                    <input
                      type="date"
                      required
                      value={resourceFormData.startDate}
                      onChange={(e) => setResourceFormData({ ...resourceFormData, startDate: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">End Date</label>
                    <input
                      type="date"
                      value={resourceFormData.endDate}
                      onChange={(e) => setResourceFormData({ ...resourceFormData, endDate: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes</label>
                  <textarea
                    value={resourceFormData.notes}
                    onChange={(e) => setResourceFormData({ ...resourceFormData, notes: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowResourceModal(false);
                      setEditingResource(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {editingResource ? 'Update' : 'Add'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showExpenseModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4">{editingExpense ? 'Edit Expense' : 'Add Expense'}</h2>
              <form onSubmit={handleExpenseSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Category</label>
                    <input
                      type="text"
                      required
                      value={expenseFormData.category}
                      onChange={(e) => setExpenseFormData({ ...expenseFormData, category: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                      placeholder="e.g., Travel, Equipment"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Currency</label>
                    <select
                      value={expenseFormData.currency}
                      onChange={(e) => setExpenseFormData({ ...expenseFormData, currency: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    >
                      {CURRENCIES.map((curr) => (
                        <option key={curr} value={curr}>{curr}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <input
                    type="text"
                    required
                    value={expenseFormData.description}
                    onChange={(e) => setExpenseFormData({ ...expenseFormData, description: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Amount</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={expenseFormData.amount}
                      onChange={(e) => setExpenseFormData({ ...expenseFormData, amount: Number(e.target.value) })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Expense Date</label>
                    <input
                      type="date"
                      required
                      value={expenseFormData.expenseDate}
                      onChange={(e) => setExpenseFormData({ ...expenseFormData, expenseDate: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Vendor</label>
                  <input
                    type="text"
                    value={expenseFormData.vendor}
                    onChange={(e) => setExpenseFormData({ ...expenseFormData, vendor: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Receipt URL</label>
                  <input
                    type="url"
                    value={expenseFormData.receiptUrl}
                    onChange={(e) => setExpenseFormData({ ...expenseFormData, receiptUrl: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes</label>
                  <textarea
                    value={expenseFormData.notes}
                    onChange={(e) => setExpenseFormData({ ...expenseFormData, notes: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowExpenseModal(false);
                      setEditingExpense(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {editingExpense ? 'Update' : 'Add'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showInvoiceModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4">{editingInvoice ? 'Edit Invoice' : 'Add Invoice'}</h2>
              <form onSubmit={handleInvoiceSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Invoice Number</label>
                  <input
                    type="text"
                    required
                    value={invoiceFormData.invoiceNumber}
                    onChange={(e) => setInvoiceFormData({ ...invoiceFormData, invoiceNumber: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Amount</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={invoiceFormData.amount}
                      onChange={(e) => setInvoiceFormData({ ...invoiceFormData, amount: Number(e.target.value) })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Currency</label>
                    <select
                      value={invoiceFormData.currency}
                      onChange={(e) => setInvoiceFormData({ ...invoiceFormData, currency: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    >
                      {CURRENCIES.map((curr) => (
                        <option key={curr} value={curr}>{curr}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Issue Date</label>
                    <input
                      type="date"
                      required
                      value={invoiceFormData.issueDate}
                      onChange={(e) => setInvoiceFormData({ ...invoiceFormData, issueDate: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Due Date</label>
                    <input
                      type="date"
                      required
                      value={invoiceFormData.dueDate}
                      onChange={(e) => setInvoiceFormData({ ...invoiceFormData, dueDate: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    value={invoiceFormData.status}
                    onChange={(e) => setInvoiceFormData({ ...invoiceFormData, status: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  >
                    <option value="DRAFT">DRAFT</option>
                    <option value="SENT">SENT</option>
                    <option value="PAID">PAID</option>
                    <option value="OVERDUE">OVERDUE</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={invoiceFormData.description}
                    onChange={(e) => setInvoiceFormData({ ...invoiceFormData, description: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Attachment URL</label>
                  <input
                    type="url"
                    value={invoiceFormData.attachmentUrl}
                    onChange={(e) => setInvoiceFormData({ ...invoiceFormData, attachmentUrl: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes</label>
                  <textarea
                    value={invoiceFormData.notes}
                    onChange={(e) => setInvoiceFormData({ ...invoiceFormData, notes: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowInvoiceModal(false);
                      setEditingInvoice(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {editingInvoice ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showPaymentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4">{editingPayment ? 'Edit Payment' : 'Add Payment'}</h2>
              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Invoice (Optional)</label>
                  <select
                    value={paymentFormData.invoiceId}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, invoiceId: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  >
                    <option value="">None</option>
                    {invoices.map((inv: any) => (
                      <option key={inv.id} value={inv.id}>{inv.invoiceNumber} - {inv.currency} {Number(inv.amount).toLocaleString()}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Amount</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={paymentFormData.amount}
                      onChange={(e) => setPaymentFormData({ ...paymentFormData, amount: Number(e.target.value) })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Currency</label>
                    <select
                      value={paymentFormData.currency}
                      onChange={(e) => setPaymentFormData({ ...paymentFormData, currency: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    >
                      {CURRENCIES.map((curr) => (
                        <option key={curr} value={curr}>{curr}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Payment Date</label>
                    <input
                      type="date"
                      required
                      value={paymentFormData.paymentDate}
                      onChange={(e) => setPaymentFormData({ ...paymentFormData, paymentDate: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                    <input
                      type="text"
                      required
                      value={paymentFormData.paymentMethod}
                      onChange={(e) => setPaymentFormData({ ...paymentFormData, paymentMethod: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                      placeholder="e.g., Bank Transfer, Cash"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Reference</label>
                  <input
                    type="text"
                    value={paymentFormData.reference}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, reference: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    placeholder="Transaction reference"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes</label>
                  <textarea
                    value={paymentFormData.notes}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, notes: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPaymentModal(false);
                      setEditingPayment(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {editingPayment ? 'Update' : 'Record'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Projects</h1>
        <button
          onClick={handleAdd}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + Add Project
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-md border-gray-300 shadow-sm"
            >
              <option value="">All Statuses</option>
              {PROJECT_STATUSES.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Budget</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Manager</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center">Loading...</td>
              </tr>
            ) : projects.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center">No projects found</td>
              </tr>
            ) : (
              projects.map((project: any) => (
                <tr key={project.id}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">{project.code}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{project.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded text-sm ${getStatusColor(project.status)}`}>
                      {project.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{project.currency} {Number(project.budget).toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{project.manager ? `${project.manager.firstName} ${project.manager.lastName}` : 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{project.clientName || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onClick={() => handleViewProject(project)} className="text-blue-600 hover:text-blue-900 mr-3">View</button>
                    <button onClick={() => handleEdit(project)} className="text-green-600 hover:text-green-900 mr-3">Edit</button>
                    <button onClick={() => deleteMutation.mutate(project.id)} className="text-red-600 hover:text-red-900">Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {projectsData?.data?.meta && (
        <div className="mt-4 flex justify-between items-center">
          <div className="text-sm text-gray-700">
            Showing {((projectsData.data.meta.page - 1) * projectsData.data.meta.limit) + 1} to{' '}
            {Math.min(projectsData.data.meta.page * projectsData.data.meta.limit, projectsData.data.meta.total)} of{' '}
            {projectsData.data.meta.total} projects
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 border rounded disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= (projectsData.data.meta.totalPages || 1)}
              className="px-4 py-2 border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Add/Edit Project Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">{editingProject ? 'Edit Project' : 'Add Project'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Project Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Project Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  >
                    {PROJECT_STATUSES.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Manager</label>
                  <select
                    value={formData.managerEmployeeId}
                    onChange={(e) => setFormData({ ...formData, managerEmployeeId: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  >
                    <option value="">Select Manager</option>
                    {employees.filter((e: any) => e.jobTitle?.toLowerCase().includes('manager')).map((emp: any) => (
                      <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Budget *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Currency</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  >
                    {CURRENCIES.map((curr) => (
                      <option key={curr} value={curr}>{curr}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">End Date</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Client Name</label>
                  <input
                    type="text"
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Client Email</label>
                  <input
                    type="email"
                    value={formData.clientEmail}
                    onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingProject(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingProject ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
