/**
 * Environment and API configuration.
 * Centralizes all env-based config for easier testing and overrides.
 */
const isDev = import.meta.env.DEV;

export const config = {
  isDev,
  api: {
    baseUrl: isDev
      ? '/api'
      : (import.meta.env.VITE_API_URL || 'https://dely-backend.onrender.com').replace(/\/api\/?$/, ''),
    timeout: 30_000,
  },
  storageKeys: {
    token: 'dely_admin_token',
    user: 'dely_admin_user',
  },
} as const;
