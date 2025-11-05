import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectApi, employeeApi } from '../lib/api';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const PROJECT_STATUSES = ['LEAD', 'PLANNING', 'RUNNING', 'ON_HOLD', 'COMPLETED', 'CANCELLED'] as const;
const CURRENCIES = ['USD', 'JD', 'AED'] as const;

export default function ProjectsPage() {
  const navigate = useNavigate();
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
      LEAD: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
      PLANNING: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200',
      RUNNING: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200',
      ON_HOLD: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200',
      COMPLETED: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200',
      CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
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
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mb-2"
            >
              ← Back to Projects
            </button>
            <h1 className="text-3xl font-bold dark:text-gray-100">{selectedProject.name}</h1>
            <p className="text-gray-600 dark:text-gray-400">{selectedProject.code}</p>
          </div>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="card">
              <p className="text-gray-600 dark:text-gray-300 text-sm">Budget</p>
              <p className="text-2xl font-bold dark:text-gray-100">{summary.project.currency} {Number(summary.project.budget).toLocaleString()}</p>
            </div>
            <div className="card">
              <p className="text-gray-600 dark:text-gray-300 text-sm">Expenses</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{summary.project.currency} {summary.expenses.total.toLocaleString()}</p>
            </div>
            <div className="card">
              <p className="text-gray-600 dark:text-gray-300 text-sm">Invoices</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{summary.project.currency} {summary.invoices.total.toLocaleString()}</p>
            </div>
            <div className="card">
              <p className="text-gray-600 dark:text-gray-300 text-sm">Payments</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{summary.project.currency} {summary.invoices.paid.toLocaleString()}</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b dark:border-gray-700 mb-6">
          <nav className="flex space-x-8">
            {(['overview', 'resources', 'expenses', 'invoices', 'payments'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="card">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2 dark:text-gray-100">Project Details</h3>
                <dl className="space-y-2">
                  <div>
                    <dt className="text-gray-600 dark:text-gray-400">Status</dt>
                    <dd><span className={`px-2 py-1 rounded text-sm ${getStatusColor(selectedProject.status)}`}>{selectedProject.status}</span></dd>
                  </div>
                  <div>
                    <dt className="text-gray-600 dark:text-gray-400">Manager</dt>
                    <dd>
                      {selectedProject.manager ? (
                        <button
                          onClick={() => navigate('/employees')}
                          className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 hover:underline"
                        >
                          {selectedProject.manager.firstName} {selectedProject.manager.lastName}
                        </button>
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400">Not assigned</span>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-600 dark:text-gray-400">Client</dt>
                    <dd className="dark:text-gray-200">{selectedProject.clientName || 'N/A'}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-600 dark:text-gray-400">Start Date</dt>
                    <dd className="dark:text-gray-200">{selectedProject.startDate ? format(new Date(selectedProject.startDate), 'MMM dd, yyyy') : 'N/A'}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-600 dark:text-gray-400">End Date</dt>
                    <dd className="dark:text-gray-200">{selectedProject.endDate ? format(new Date(selectedProject.endDate), 'MMM dd, yyyy') : 'N/A'}</dd>
                  </div>
                </dl>
              </div>
              <div>
                <h3 className="font-semibold mb-2 dark:text-gray-100">Description</h3>
                <p className="text-gray-700 dark:text-gray-300">{selectedProject.description || 'No description'}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'resources' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold dark:text-gray-100">Resources</h2>
              <button
                onClick={handleAddResource}
                className="btn-primary"
              >
                + Add Resource
              </button>
            </div>
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b dark:border-gray-700">
                      <th className="text-left py-3 px-4 dark:text-gray-300">Employee</th>
                      <th className="text-left py-3 px-4 dark:text-gray-300">Role</th>
                      <th className="text-left py-3 px-4 dark:text-gray-300">Allocation</th>
                      <th className="text-left py-3 px-4 dark:text-gray-300">Hourly Rate</th>
                      <th className="text-left py-3 px-4 dark:text-gray-300">Start Date</th>
                      <th className="text-left py-3 px-4 dark:text-gray-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resources.map((resource: any) => (
                      <tr key={resource.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-6 py-4 whitespace-nowrap dark:text-gray-200">
                          <button
                            onClick={() => navigate('/employees')}
                            className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 hover:underline"
                          >
                            {resource.employee?.firstName} {resource.employee?.lastName}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap dark:text-gray-200">{resource.role || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap dark:text-gray-200">{Number(resource.allocation)}%</td>
                        <td className="px-6 py-4 whitespace-nowrap dark:text-gray-200">{resource.hourlyRate ? `${Number(resource.hourlyRate).toFixed(2)}` : 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap dark:text-gray-200">{format(new Date(resource.startDate), 'MMM dd, yyyy')}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button onClick={() => handleEditResource(resource)} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3">Edit</button>
                          <button onClick={() => deleteResourceMutation.mutate(resource.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'expenses' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold dark:text-gray-100">Expenses</h2>
              <button
                onClick={handleAddExpense}
                className="btn-primary"
              >
                + Add Expense
              </button>
            </div>
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b dark:border-gray-700">
                      <th className="text-left py-3 px-4 dark:text-gray-300">Date</th>
                      <th className="text-left py-3 px-4 dark:text-gray-300">Category</th>
                      <th className="text-left py-3 px-4 dark:text-gray-300">Description</th>
                      <th className="text-left py-3 px-4 dark:text-gray-300">Amount</th>
                      <th className="text-left py-3 px-4 dark:text-gray-300">Vendor</th>
                      <th className="text-left py-3 px-4 dark:text-gray-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((expense: any) => (
                      <tr key={expense.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-6 py-4 whitespace-nowrap dark:text-gray-200">{format(new Date(expense.expenseDate), 'MMM dd, yyyy')}</td>
                        <td className="px-6 py-4 whitespace-nowrap dark:text-gray-200">{expense.category}</td>
                        <td className="px-6 py-4 dark:text-gray-200">{expense.description}</td>
                        <td className="px-6 py-4 whitespace-nowrap dark:text-gray-200">{expense.currency} {Number(expense.amount).toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap dark:text-gray-200">{expense.vendor || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button onClick={() => handleEditExpense(expense)} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3">Edit</button>
                          <button onClick={() => deleteExpenseMutation.mutate(expense.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'invoices' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold dark:text-gray-100">Invoices</h2>
              <button
                onClick={handleAddInvoice}
                className="btn-primary"
              >
                + Add Invoice
              </button>
            </div>
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b dark:border-gray-700">
                      <th className="text-left py-3 px-4 dark:text-gray-300">Invoice #</th>
                      <th className="text-left py-3 px-4 dark:text-gray-300">Issue Date</th>
                      <th className="text-left py-3 px-4 dark:text-gray-300">Due Date</th>
                      <th className="text-left py-3 px-4 dark:text-gray-300">Amount</th>
                      <th className="text-left py-3 px-4 dark:text-gray-300">Status</th>
                      <th className="text-left py-3 px-4 dark:text-gray-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((invoice: any) => (
                      <tr key={invoice.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-6 py-4 whitespace-nowrap font-medium dark:text-gray-200">{invoice.invoiceNumber}</td>
                        <td className="px-6 py-4 whitespace-nowrap dark:text-gray-200">{format(new Date(invoice.issueDate), 'MMM dd, yyyy')}</td>
                        <td className="px-6 py-4 whitespace-nowrap dark:text-gray-200">{format(new Date(invoice.dueDate), 'MMM dd, yyyy')}</td>
                        <td className="px-6 py-4 whitespace-nowrap dark:text-gray-200">{invoice.currency} {Number(invoice.amount).toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded text-xs ${
                            invoice.status === 'PAID' ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200' :
                            invoice.status === 'OVERDUE' ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200' :
                            'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200'
                          }`}>
                            {invoice.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button onClick={() => handleEditInvoice(invoice)} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3">Edit</button>
                          <button onClick={() => deleteInvoiceMutation.mutate(invoice.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'payments' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold dark:text-gray-100">Payments</h2>
              <button
                onClick={handleAddPayment}
                className="btn-primary"
              >
                + Add Payment
              </button>
            </div>
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b dark:border-gray-700">
                      <th className="text-left py-3 px-4 dark:text-gray-300">Date</th>
                      <th className="text-left py-3 px-4 dark:text-gray-300">Amount</th>
                      <th className="text-left py-3 px-4 dark:text-gray-300">Method</th>
                      <th className="text-left py-3 px-4 dark:text-gray-300">Reference</th>
                      <th className="text-left py-3 px-4 dark:text-gray-300">Invoice</th>
                      <th className="text-left py-3 px-4 dark:text-gray-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment: any) => (
                      <tr key={payment.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-6 py-4 whitespace-nowrap dark:text-gray-200">{format(new Date(payment.paymentDate), 'MMM dd, yyyy')}</td>
                        <td className="px-6 py-4 whitespace-nowrap dark:text-gray-200">{payment.currency} {Number(payment.amount).toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap dark:text-gray-200">{payment.paymentMethod}</td>
                        <td className="px-6 py-4 whitespace-nowrap dark:text-gray-200">{payment.reference || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap dark:text-gray-200">{payment.invoice?.invoiceNumber || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button onClick={() => handleEditPayment(payment)} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3">Edit</button>
                          <button onClick={() => deletePaymentMutation.mutate(payment.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Modals */}
        {showResourceModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto transition-colors">
              <h2 className="text-2xl font-bold mb-4 dark:text-gray-100">{editingResource ? 'Edit Resource' : 'Add Resource'}</h2>
              <form onSubmit={handleResourceSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Employee</label>
                  <select
                    required
                    value={resourceFormData.employeeId}
                    onChange={(e) => setResourceFormData({ ...resourceFormData, employeeId: e.target.value })}
                    className="input"
                  >
                    <option value="">Select Employee</option>
                    {employees.map((emp: any) => (
                      <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                  <input
                    type="text"
                    value={resourceFormData.role}
                    onChange={(e) => setResourceFormData({ ...resourceFormData, role: e.target.value })}
                    className="input"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Allocation (%)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      max="100"
                      value={resourceFormData.allocation}
                      onChange={(e) => setResourceFormData({ ...resourceFormData, allocation: Number(e.target.value) })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hourly Rate</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={resourceFormData.hourlyRate}
                      onChange={(e) => setResourceFormData({ ...resourceFormData, hourlyRate: e.target.value })}
                      className="input"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
                    <input
                      type="date"
                      required
                      value={resourceFormData.startDate}
                      onChange={(e) => setResourceFormData({ ...resourceFormData, startDate: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
                    <input
                      type="date"
                      value={resourceFormData.endDate}
                      onChange={(e) => setResourceFormData({ ...resourceFormData, endDate: e.target.value })}
                      className="input"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
                  <textarea
                    value={resourceFormData.notes}
                    onChange={(e) => setResourceFormData({ ...resourceFormData, notes: e.target.value })}
                    className="input"
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
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                  >
                    {editingResource ? 'Update' : 'Add'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showExpenseModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto transition-colors">
              <h2 className="text-2xl font-bold mb-4 dark:text-gray-100">{editingExpense ? 'Edit Expense' : 'Add Expense'}</h2>
              <form onSubmit={handleExpenseSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                    <input
                      type="text"
                      required
                      value={expenseFormData.category}
                      onChange={(e) => setExpenseFormData({ ...expenseFormData, category: e.target.value })}
                      className="input"
                      placeholder="e.g., Travel, Equipment"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Currency</label>
                    <select
                      value={expenseFormData.currency}
                      onChange={(e) => setExpenseFormData({ ...expenseFormData, currency: e.target.value })}
                      className="input"
                    >
                      {CURRENCIES.map((curr) => (
                        <option key={curr} value={curr}>{curr}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                  <input
                    type="text"
                    required
                    value={expenseFormData.description}
                    onChange={(e) => setExpenseFormData({ ...expenseFormData, description: e.target.value })}
                    className="input"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={expenseFormData.amount}
                      onChange={(e) => setExpenseFormData({ ...expenseFormData, amount: Number(e.target.value) })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expense Date</label>
                    <input
                      type="date"
                      required
                      value={expenseFormData.expenseDate}
                      onChange={(e) => setExpenseFormData({ ...expenseFormData, expenseDate: e.target.value })}
                      className="input"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vendor</label>
                  <input
                    type="text"
                    value={expenseFormData.vendor}
                    onChange={(e) => setExpenseFormData({ ...expenseFormData, vendor: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Receipt URL</label>
                  <input
                    type="url"
                    value={expenseFormData.receiptUrl}
                    onChange={(e) => setExpenseFormData({ ...expenseFormData, receiptUrl: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
                  <textarea
                    value={expenseFormData.notes}
                    onChange={(e) => setExpenseFormData({ ...expenseFormData, notes: e.target.value })}
                    className="input"
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
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                  >
                    {editingExpense ? 'Update' : 'Add'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showInvoiceModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto transition-colors">
              <h2 className="text-2xl font-bold mb-4 dark:text-gray-100">{editingInvoice ? 'Edit Invoice' : 'Add Invoice'}</h2>
              <form onSubmit={handleInvoiceSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Invoice Number</label>
                  <input
                    type="text"
                    required
                    value={invoiceFormData.invoiceNumber}
                    onChange={(e) => setInvoiceFormData({ ...invoiceFormData, invoiceNumber: e.target.value })}
                    className="input"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={invoiceFormData.amount}
                      onChange={(e) => setInvoiceFormData({ ...invoiceFormData, amount: Number(e.target.value) })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Currency</label>
                    <select
                      value={invoiceFormData.currency}
                      onChange={(e) => setInvoiceFormData({ ...invoiceFormData, currency: e.target.value })}
                      className="input"
                    >
                      {CURRENCIES.map((curr) => (
                        <option key={curr} value={curr}>{curr}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Issue Date</label>
                    <input
                      type="date"
                      required
                      value={invoiceFormData.issueDate}
                      onChange={(e) => setInvoiceFormData({ ...invoiceFormData, issueDate: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Due Date</label>
                    <input
                      type="date"
                      required
                      value={invoiceFormData.dueDate}
                      onChange={(e) => setInvoiceFormData({ ...invoiceFormData, dueDate: e.target.value })}
                      className="input"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                  <select
                    value={invoiceFormData.status}
                    onChange={(e) => setInvoiceFormData({ ...invoiceFormData, status: e.target.value })}
                    className="input"
                  >
                    <option value="DRAFT">DRAFT</option>
                    <option value="SENT">SENT</option>
                    <option value="PAID">PAID</option>
                    <option value="OVERDUE">OVERDUE</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                  <textarea
                    value={invoiceFormData.description}
                    onChange={(e) => setInvoiceFormData({ ...invoiceFormData, description: e.target.value })}
                    className="input"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Attachment URL</label>
                  <input
                    type="url"
                    value={invoiceFormData.attachmentUrl}
                    onChange={(e) => setInvoiceFormData({ ...invoiceFormData, attachmentUrl: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
                  <textarea
                    value={invoiceFormData.notes}
                    onChange={(e) => setInvoiceFormData({ ...invoiceFormData, notes: e.target.value })}
                    className="input"
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
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                  >
                    {editingInvoice ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showPaymentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto transition-colors">
              <h2 className="text-2xl font-bold mb-4 dark:text-gray-100">{editingPayment ? 'Edit Payment' : 'Add Payment'}</h2>
              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Invoice (Optional)</label>
                  <select
                    value={paymentFormData.invoiceId}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, invoiceId: e.target.value })}
                    className="input"
                  >
                    <option value="">None</option>
                    {invoices.map((inv: any) => (
                      <option key={inv.id} value={inv.id}>{inv.invoiceNumber} - {inv.currency} {Number(inv.amount).toLocaleString()}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={paymentFormData.amount}
                      onChange={(e) => setPaymentFormData({ ...paymentFormData, amount: Number(e.target.value) })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Currency</label>
                    <select
                      value={paymentFormData.currency}
                      onChange={(e) => setPaymentFormData({ ...paymentFormData, currency: e.target.value })}
                      className="input"
                    >
                      {CURRENCIES.map((curr) => (
                        <option key={curr} value={curr}>{curr}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Payment Date</label>
                    <input
                      type="date"
                      required
                      value={paymentFormData.paymentDate}
                      onChange={(e) => setPaymentFormData({ ...paymentFormData, paymentDate: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Payment Method</label>
                    <input
                      type="text"
                      required
                      value={paymentFormData.paymentMethod}
                      onChange={(e) => setPaymentFormData({ ...paymentFormData, paymentMethod: e.target.value })}
                      className="input"
                      placeholder="e.g., Bank Transfer, Cash"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reference</label>
                  <input
                    type="text"
                    value={paymentFormData.reference}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, reference: e.target.value })}
                    className="input"
                    placeholder="Transaction reference"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
                  <textarea
                    value={paymentFormData.notes}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, notes: e.target.value })}
                    className="input"
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
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
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
        <div>
          <h1 className="text-3xl font-bold dark:text-gray-100">Projects</h1>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-sm text-primary-600 dark:text-primary-400 hover:underline mt-1"
          >
            ← Back to Dashboard
          </button>
        </div>
        <button
          onClick={handleAdd}
          className="btn-primary"
        >
          + Add Project
        </button>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="input"
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
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b dark:border-gray-700">
                <th className="text-left py-3 px-4 dark:text-gray-300">Code</th>
                <th className="text-left py-3 px-4 dark:text-gray-300">Name</th>
                <th className="text-left py-3 px-4 dark:text-gray-300">Status</th>
                <th className="text-left py-3 px-4 dark:text-gray-300">Budget</th>
                <th className="text-left py-3 px-4 dark:text-gray-300">Manager</th>
                <th className="text-left py-3 px-4 dark:text-gray-300">Client</th>
                <th className="text-left py-3 px-4 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-600 dark:text-gray-400">Loading...</td>
                </tr>
              ) : projects.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-600 dark:text-gray-400">No projects found</td>
                </tr>
              ) : (
                projects.map((project: any) => (
                  <tr key={project.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap font-medium dark:text-gray-200">{project.code}</td>
                    <td className="px-6 py-4 whitespace-nowrap dark:text-gray-200">{project.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded text-sm ${getStatusColor(project.status)}`}>
                        {project.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap dark:text-gray-200">{project.currency} {Number(project.budget).toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {project.manager ? (
                        <button
                          onClick={() => navigate('/employees')}
                          className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 hover:underline"
                        >
                          {project.manager.firstName} {project.manager.lastName}
                        </button>
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap dark:text-gray-200">{project.clientName || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button onClick={() => handleViewProject(project)} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3">View</button>
                      <button onClick={() => handleEdit(project)} className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 mr-3">Edit</button>
                      <button onClick={() => deleteMutation.mutate(project.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {projectsData?.data?.meta && (
        <div className="mt-4 flex justify-between items-center">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Showing {((projectsData.data.meta.page - 1) * projectsData.data.meta.limit) + 1} to{' '}
            {Math.min(projectsData.data.meta.page * projectsData.data.meta.limit, projectsData.data.meta.total)} of{' '}
            {projectsData.data.meta.total} projects
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= (projectsData.data.meta.totalPages || 1)}
              className="btn-secondary disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Add/Edit Project Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto transition-colors">
            <h2 className="text-2xl font-bold mb-4 dark:text-gray-100">{editingProject ? 'Edit Project' : 'Add Project'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Project Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Project Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="input"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="input"
                  >
                    {PROJECT_STATUSES.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Manager</label>
                  <select
                    value={formData.managerEmployeeId}
                    onChange={(e) => setFormData({ ...formData, managerEmployeeId: e.target.value })}
                    className="input"
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Budget *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Currency</label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="input"
                  >
                    {CURRENCIES.map((curr) => (
                      <option key={curr} value={curr}>{curr}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="input"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Client Name</label>
                  <input
                    type="text"
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Client Email</label>
                  <input
                    type="email"
                    value={formData.clientEmail}
                    onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                    className="input"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="input"
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
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
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
