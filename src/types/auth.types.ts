/**
 * Auth-related types used across the app (context, guards, profile).
 */
export type AuthRole = 'super_admin' | 'admin' | 'manager' | 'seller' | 'support';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: AuthRole;
  companyId?: string | null;
  avatar?: string;
}
