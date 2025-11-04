import { create } from 'zustand';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  hasRole: (role: string | string[]) => boolean;
}

// Load from localStorage on init
const loadAuthFromStorage = () => {
  if (typeof window === 'undefined') return { user: null, accessToken: null };
  
  const token = localStorage.getItem('accessToken');
  const userStr = localStorage.getItem('user');
  
  return {
    accessToken: token,
    user: userStr ? JSON.parse(userStr) : null,
  };
};

const initialAuth = loadAuthFromStorage();

export const useAuthStore = create<AuthState>((set, get) => ({
  user: initialAuth.user,
  accessToken: initialAuth.accessToken,
  
  setAuth: (user, accessToken) => {
    set({ user, accessToken });
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('user', JSON.stringify(user));
  },
  
  logout: () => {
    set({ user: null, accessToken: null });
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
  },
  
  isAuthenticated: () => !!get().user && !!get().accessToken,
  
  hasRole: (roles) => {
    const user = get().user;
    if (!user) return false;
    if (Array.isArray(roles)) {
      return roles.includes(user.role);
    }
    return user.role === roles;
  },
}));

