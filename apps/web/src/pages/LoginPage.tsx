import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import Logo from '../components/Logo';

const LoginPage = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [email, setEmail] = useState('admin@hrsystem.com');
  const [password, setPassword] = useState('Admin@123');

  const loginMutation = useMutation({
    mutationFn: (credentials: { email: string; password: string }) =>
      authApi.login(credentials.email, credentials.password),
    onSuccess: (response) => {
      if (response.data.success && response.data.data) {
        const { user, accessToken } = response.data.data;
        setAuth(user, accessToken);
        navigate('/dashboard');
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-xl p-8">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Logo size="lg" showText={true} onClick={() => {}} />
          </div>
          
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">
            HR Management System
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                required
              />
            </div>

            {loginMutation.isError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                Login failed. Please check your credentials.
              </div>
            )}

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full btn-primary py-3"
            >
              {loginMutation.isPending ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            <p>Demo credentials:</p>
            <p className="mt-2">
              <strong>Admin:</strong> admin@hrsystem.com / Admin@123
            </p>
            <p>
              <strong>HR:</strong> hr@hrsystem.com / Admin@123
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

