import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { adminAuthAPI } from '@/lib/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'admin' | 'manager' | 'support';
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored session and validate token
    const storedUser = localStorage.getItem('dely_admin_user');
    const storedToken = localStorage.getItem('dely_admin_token');
    
    if (storedUser && storedToken) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        
        // Validate token with backend
        adminAuthAPI.getCurrentUser()
          .then((response) => {
            if (response.success) {
              setUser(response.data);
              localStorage.setItem('dely_admin_user', JSON.stringify(response.data));
            } else {
              // Token invalid, clear storage
              localStorage.removeItem('dely_admin_user');
              localStorage.removeItem('dely_admin_token');
              setUser(null);
            }
          })
          .catch(() => {
            // API error, clear storage
            localStorage.removeItem('dely_admin_user');
            localStorage.removeItem('dely_admin_token');
            setUser(null);
          })
          .finally(() => {
            setIsLoading(false);
          });
      } catch (e) {
        localStorage.removeItem('dely_admin_user');
        localStorage.removeItem('dely_admin_token');
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await adminAuthAPI.login(email, password);
      
      if (response.success) {
        const { token, admin } = response.data;
        
        // Store token and user data
        localStorage.setItem('dely_admin_token', token);
        localStorage.setItem('dely_admin_user', JSON.stringify(admin));
        
        setUser(admin);
        return { success: true };
      } else {
        return { success: false, error: 'Invalid credentials' };
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || error.message || 'Login failed';
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      // Call logout API
      await adminAuthAPI.logout();
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('Logout API error:', error);
    } finally {
      // Clear local storage
      setUser(null);
      localStorage.removeItem('dely_admin_user');
      localStorage.removeItem('dely_admin_token');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
