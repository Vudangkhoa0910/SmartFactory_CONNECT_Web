import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api';

interface User {
  id: string;
  employee_code: string;
  username?: string;
  email: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  role: string;
  level: number;
  preferred_language?: 'vi' | 'ja';
  department?: {
    id: string;
    name: string;
  } | null;
  permissions: {
    has_web_access: boolean;
    has_mobile_access: boolean;
    can_view_dashboard: boolean;
    can_manage_users: boolean;
    can_review_ideas: boolean;
    can_view_pink_box: boolean;
    can_create_news: boolean;
  };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: { email?: string; employee_code?: string; password: string }) => Promise<User>;
  logout: () => Promise<void>;
  hasWebAccess: () => boolean;
  canViewDashboard: () => boolean;
  canManageUsers: () => boolean;
  canReviewIdeas: () => boolean;
  canViewPinkBox: () => boolean;
  canCreateNews: () => boolean;
  isRole: (roleName: string) => boolean;
  hasMinLevel: (level: number) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (token && storedUser) {
      try {
        // Parse stored user data
        const userData = JSON.parse(storedUser);
        setUser(userData);
      } catch (error) {
        // Invalid stored data, clear storage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      }
    }
    setLoading(false);
  };

  const login = async (credentials: { email?: string; employee_code?: string; password: string }) => {
    const response = await api.post('/auth/login', credentials);
    const { token, user: userData } = response.data.data;
    
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    
    return userData;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      // Redirect to signin page after logout
      window.location.href = '/signin';
    }
  };

  // Permission helpers
  const hasWebAccess = () => user?.permissions?.has_web_access ?? false;
  const canViewDashboard = () => user?.permissions?.can_view_dashboard ?? false;
  const canManageUsers = () => user?.permissions?.can_manage_users ?? false;
  const canReviewIdeas = () => user?.permissions?.can_review_ideas ?? false;
  const canViewPinkBox = () => user?.permissions?.can_view_pink_box ?? false;
  const canCreateNews = () => user?.permissions?.can_create_news ?? false;

  const isRole = (roleName: string) => user?.role === roleName;
  const hasMinLevel = (level: number) => (user?.level ?? 999) <= level;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        hasWebAccess,
        canViewDashboard,
        canManageUsers,
        canReviewIdeas,
        canViewPinkBox,
        canCreateNews,
        isRole,
        hasMinLevel
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
