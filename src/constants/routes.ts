/**
 * Application route paths.
 * Use these constants instead of string literals for type-safety and refactoring.
 */
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  PRODUCTS: '/products',
  ORDERS: '/orders',
  USERS: '/users',
  CATEGORIES: '/categories',
  COMPANIES: '/companies',
  OFFERS: '/offers',
  KYC: '/kyc',
  ANALYTICS: '/analytics',
  REPORTS: '/reports',
  INVENTORY: '/inventory',
  SETTINGS: '/settings',
  PROFILE: '/profile',
  SELLERS: '/sellers',
  DELIVERY_PERSONS: '/delivery/persons',
  DELIVERY_TRACKING: '/delivery/tracking',
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];
