import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { ROUTES } from '@/constants';

interface GuardProps {
  children: ReactNode;
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" aria-hidden />
    </div>
  );
}

/**
 * Protects routes that require authentication. Wraps content in AdminLayout.
 */
export function ProtectedRoute({ children }: GuardProps) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to={ROUTES.LOGIN} replace />;

  return <AdminLayout>{children}</AdminLayout>;
}

/**
 * For login/signup only. Redirects to dashboard if already authenticated.
 */
export function PublicRoute({ children }: GuardProps) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;
  if (isAuthenticated) return <Navigate to={ROUTES.DASHBOARD} replace />;

  return <>{children}</>;
}

/**
 * Restricts access to non-seller roles (e.g. orders, users, KYC). Use inside ProtectedRoute.
 */
export function BlockSellerRoute({ children }: GuardProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;
  if (user?.role === 'seller') return <Navigate to={ROUTES.PRODUCTS} replace />;

  return <>{children}</>;
}

/**
 * Restricts access to admin and super_admin only. Use inside ProtectedRoute.
 */
export function AdminOnlyRoute({ children }: GuardProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;
  if (user?.role !== 'admin' && user?.role !== 'super_admin') {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return <>{children}</>;
}
