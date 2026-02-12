import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { adminAuthAPI } from '@/lib/api';
import { config } from '@/config';
import type { AuthUser } from '@/types';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const { token: tokenKey, user: userKey } = config.storageKeys;
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem(userKey);
    const storedToken = localStorage.getItem(tokenKey);

    if (storedUser && storedToken) {
      try {
        const userData = JSON.parse(storedUser) as AuthUser;
        setUser(userData);

        adminAuthAPI.getCurrentUser()
          .then((response) => {
            if (response.success) {
              const normalizedUser: AuthUser = {
                ...response.data,
                role: response.data.role as AuthUser['role'],
              };
              setUser(normalizedUser);
              localStorage.setItem(userKey, JSON.stringify(normalizedUser));
            } else {
              localStorage.removeItem(userKey);
              localStorage.removeItem(tokenKey);
              setUser(null);
            }
          })
          .catch(() => {
            localStorage.removeItem(userKey);
            localStorage.removeItem(tokenKey);
            setUser(null);
          })
          .finally(() => setIsLoading(false));
      } catch {
        localStorage.removeItem(userKey);
        localStorage.removeItem(tokenKey);
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
        const normalizedUser: AuthUser = {
          ...admin,
          role: admin.role as AuthUser['role'],
        };

        localStorage.setItem(tokenKey, token);
        localStorage.setItem(userKey, JSON.stringify(normalizedUser));
        setUser(normalizedUser);
        return { success: true };
      }
      return { success: false, error: 'Invalid credentials' };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: { message?: string } } }; message?: string };
      const errorMessage = err?.response?.data?.error?.message || err?.message || 'Login failed';
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      await adminAuthAPI.logout();
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      setUser(null);
      localStorage.removeItem(userKey);
      localStorage.removeItem(tokenKey);
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
