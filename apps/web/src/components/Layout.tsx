import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../lib/api';
import { useState } from 'react';
import Logo from './Logo';

const Layout = () => {
  const { user, logout, hasRole } = useAuthStore();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      logout();
      navigate('/login');
    }
  };

  // Role-based navigation items
  const allNavItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊', roles: ['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'] },
    { path: '/employees', label: 'Employees', icon: '👥', roles: ['ADMIN', 'HR', 'MANAGER'] },
    { path: '/attendance', label: 'Attendance', icon: '⏰', roles: ['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'] },
    { path: '/leaves', label: 'Leaves', icon: '🏖️', roles: ['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'] },
    { path: '/payroll', label: 'Payroll', icon: '💰', roles: ['ADMIN', 'HR'] },
    { path: '/projects', label: 'Projects', icon: '📁', roles: ['ADMIN', 'HR', 'MANAGER'] },
    { path: '/settings', label: 'Settings', icon: '⚙️', roles: ['ADMIN', 'HR'] },
  ];

  // Filter nav items based on user role
  const navItems = allNavItems.filter(item => hasRole(item.roles));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white shadow-md relative">
        {/* Logo in top-left corner */}
        <div className="absolute top-0 left-0 p-4 z-10">
          <Logo size="md" />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-end items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="text-sm">
                <span className="text-gray-600">{user?.email}</span>
                <span className="ml-2 px-2 py-1 text-xs rounded-full bg-primary-100 text-primary-800">
                  {user?.role}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-md min-h-screen hidden md:block">
          <nav className="mt-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="flex items-center px-6 py-3 text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-colors"
              >
                <span className="mr-3 text-xl">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>
        </aside>

        {/* Mobile menu button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md"
        >
          <span className="text-2xl">☰</span>
        </button>

        {/* Mobile sidebar */}
        {isMenuOpen && (
          <aside className="fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg md:hidden">
            <div className="p-4">
              <button
                onClick={() => setIsMenuOpen(false)}
                className="text-gray-600 hover:text-gray-900"
              >
                ✕
              </button>
            </div>
            <nav className="mt-8">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center px-6 py-3 text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-colors"
                >
                  <span className="mr-3 text-xl">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </Link>
              ))}
            </nav>
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 p-6 md:ml-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;

