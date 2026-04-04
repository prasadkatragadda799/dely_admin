const isDev = import.meta.env.DEV;

/**
 * Mobile app may persist file:// or content:// in KYC rows; browsers cannot load these.
 */
export function isUnsafeLocalDeviceUrl(url: string): boolean {
  const low = url.trim().toLowerCase();
  return (
    low.startsWith('file:') ||
    low.startsWith('content:') ||
    low.startsWith('blob:') ||
    low.startsWith('ph://') ||
    low.startsWith('phassets://') ||
    low.startsWith('android.resource:') ||
    low.startsWith('assets-library:')
  );
}

/**
 * Turn API-stored paths into a URL the admin SPA can use in <img src> and fetch().
 * Dev: same-origin /api + path (Vite proxy). Prod: VITE_API_URL origin + path.
 */
export function resolveMediaUrl(url: string | undefined | null): string | undefined {
  if (url == null || typeof url !== 'string') return undefined;
  const u = url.trim();
  if (!u) return undefined;
  if (isUnsafeLocalDeviceUrl(u)) return undefined;
  if (u.startsWith('http://') || u.startsWith('https://')) return u;
  if (u.startsWith('//')) return `https:${u}`;
  const path = u.startsWith('/') ? u : `/${u}`;
  if (isDev && typeof window !== 'undefined') {
    return `${window.location.origin}/api${path}`;
  }
  const rawBase = import.meta.env.VITE_API_URL || 'https://api.delycart.in';
  const base = rawBase.replace(/\/api\/?$/, '').replace(/\/$/, '');
  return `${base}${path}`;
}
