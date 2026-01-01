import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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

// Demo users for the prototype
const DEMO_USERS: Record<string, { password: string; user: User }> = {
  'admin@dely.com': {
    password: 'admin123',
    user: {
      id: '1',
      email: 'admin@dely.com',
      name: 'Rajesh Kumar',
      role: 'super_admin',
    },
  },
  'manager@dely.com': {
    password: 'manager123',
    user: {
      id: '2',
      email: 'manager@dely.com',
      name: 'Priya Sharma',
      role: 'manager',
    },
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored session
    const storedUser = localStorage.getItem('dely_admin_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('dely_admin_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const demoUser = DEMO_USERS[email.toLowerCase()];
    
    if (!demoUser) {
      return { success: false, error: 'User not found' };
    }
    
    if (demoUser.password !== password) {
      return { success: false, error: 'Invalid password' };
    }

    setUser(demoUser.user);
    localStorage.setItem('dely_admin_user', JSON.stringify(demoUser.user));
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('dely_admin_user');
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
