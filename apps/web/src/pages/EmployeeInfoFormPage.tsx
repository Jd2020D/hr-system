import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { employeeApi } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { format } from 'date-fns';
import type { Employee } from '../types';

interface EmployeeFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  gender?: string;
  dob?: string;
  address?: string;
  nationalId?: string;
  emergencyContact?: {
    name?: string;
    relationship?: string;
    phone?: string;
  };
}

const EmployeeInfoFormPage = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<EmployeeFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    gender: '',
    dob: '',
    address: '',
    nationalId: '',
    emergencyContact: {
      name: '',
      relationship: '',
      phone: '',
    },
  });

  // Get current employee data
  const { data: employee, isLoading } = useQuery({
    queryKey: ['employee', 'my-profile'],
    queryFn: async () => {
      const response = await employeeApi.getMyProfile();
      return response.data.data;
    },
  });

  // Populate form when employee data is loaded
  useEffect(() => {
    if (employee) {
      setFormData({
        firstName: employee.firstName || '',
        lastName: employee.lastName || '',
        email: employee.email || '',
        phone: employee.phone || '',
        gender: employee.gender || '',
        dob: employee.dob ? format(new Date(employee.dob), 'yyyy-MM-dd') : '',
        address: employee.address || '',
        nationalId: employee.nationalId || '',
        emergencyContact: employee.emergencyContact || {
          name: '',
          relationship: '',
          phone: '',
        },
      });
    }
  }, [employee]);

  const updateMutation = useMutation({
    mutationFn: (data: Partial<EmployeeFormData>) => {
      return employeeApi.updateMyProfile(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee', 'my-profile'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Your information has been updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update information');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData: any = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone || undefined,
      gender: formData.gender || undefined,
      dob: formData.dob || undefined,
      address: formData.address || undefined,
      nationalId: formData.nationalId || undefined,
      emergencyContact: formData.emergencyContact,
    };

    updateMutation.mutate(submitData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('emergencyContact.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        emergencyContact: {
          ...prev.emergencyContact,
          [field]: value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600 dark:text-gray-300">Loading your information...</p>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="card">
          <p className="text-red-600 dark:text-red-400">Unable to load your employee information.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          My Information
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Please fill in your personal information and keep it up to date.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information Section */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
            Personal Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Employee Code <span className="text-gray-400 dark:text-gray-500">(Read-only)</span>
              </label>
              <input
                type="text"
                value={employee.code || ''}
                disabled
                className="input bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Department <span className="text-gray-400 dark:text-gray-500">(Read-only)</span>
              </label>
              <input
                type="text"
                value={employee.department?.name || ''}
                disabled
                className="input bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Job Title <span className="text-gray-400 dark:text-gray-500">(Read-only)</span>
              </label>
              <input
                type="text"
                value={employee.jobTitle || ''}
                disabled
                className="input bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Hire Date <span className="text-gray-400 dark:text-gray-500">(Read-only)</span>
              </label>
              <input
                type="text"
                value={employee.hireDate ? format(new Date(employee.hireDate), 'MMM dd, yyyy') : ''}
                disabled
                className="input bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="input"
                placeholder="+1234567890"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Gender
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="input"
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Date of Birth
              </label>
              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                className="input"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Address
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={3}
                className="input"
                placeholder="Enter your full address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                National ID
              </label>
              <input
                type="text"
                name="nationalId"
                value={formData.nationalId}
                onChange={handleChange}
                className="input"
                placeholder="Enter your national ID"
              />
            </div>
          </div>
        </div>

        {/* Emergency Contact Section */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
            Emergency Contact
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Contact Name
              </label>
              <input
                type="text"
                name="emergencyContact.name"
                value={formData.emergencyContact?.name || ''}
                onChange={handleChange}
                className="input"
                placeholder="Full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Relationship
              </label>
              <input
                type="text"
                name="emergencyContact.relationship"
                value={formData.emergencyContact?.relationship || ''}
                onChange={handleChange}
                className="input"
                placeholder="e.g., Spouse, Parent, Sibling"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Phone Number
              </label>
              <input
                type="tel"
                name="emergencyContact.phone"
                value={formData.emergencyContact?.phone || ''}
                onChange={handleChange}
                className="input"
                placeholder="+1234567890"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => {
              if (employee) {
                setFormData({
                  firstName: employee.firstName || '',
                  lastName: employee.lastName || '',
                  email: employee.email || '',
                  phone: employee.phone || '',
                  gender: employee.gender || '',
                  dob: employee.dob ? format(new Date(employee.dob), 'yyyy-MM-dd') : '',
                  address: employee.address || '',
                  nationalId: employee.nationalId || '',
                  emergencyContact: employee.emergencyContact || {
                    name: '',
                    relationship: '',
                    phone: '',
                  },
                });
              }
            }}
            className="btn-secondary"
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="btn-primary"
          >
            {updateMutation.isPending ? 'Saving...' : 'Save Information'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EmployeeInfoFormPage;

