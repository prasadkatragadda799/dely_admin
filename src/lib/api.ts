import axios, { AxiosInstance, AxiosError } from 'axios';

// Helper function to ensure UUID is properly formatted with dashes
function formatUUID(uuid: string): string {
  if (!uuid) return uuid;
  // If UUID is missing dashes and is 32 characters, add them
  if (!uuid.includes('-') && uuid.length === 32) {
    return `${uuid.slice(0, 8)}-${uuid.slice(8, 12)}-${uuid.slice(12, 16)}-${uuid.slice(16, 20)}-${uuid.slice(20)}`;
  }
  // If UUID already has dashes, return as is
  if (uuid.includes('-')) {
    return uuid;
  }
  // Return as is if it doesn't match expected format
  return uuid;
}

// API Configuration
// In development, use Vite proxy to avoid CORS issues
// In production, use direct backend URL from environment variable
const isDevelopment = import.meta.env.DEV;
let API_BASE_URL: string;
if (isDevelopment) {
  // In development, use Vite proxy - it will rewrite /api to remove it
  // The proxy targets VITE_API_URL or defaults to https://dely-backend.onrender.com
  API_BASE_URL = '/api';
} else {
  // In production, use direct backend URL (ensure it doesn't include /api)
  const prodUrl = import.meta.env.VITE_API_URL || 'https://dely-backend.onrender.com';
  // Remove trailing /api if present
  API_BASE_URL = prodUrl.replace(/\/api\/?$/, '');
}

// Create axios instance
// Backend endpoints are under /admin/* path
// baseURL is just the base domain, endpoints include /admin/ prefix
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token and handle FormData
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('dely_admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // If data is FormData, remove Content-Type header to let axios set it with boundary
    if (config.data instanceof FormData) {
      // Remove Content-Type header so axios can set it automatically with boundary
      if (config.headers && 'Content-Type' in config.headers) {
        delete config.headers['Content-Type'];
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response) {
      // Handle specific error status codes
      switch (error.response.status) {
        case 401:
          // Unauthorized - Clear token and redirect to login
          localStorage.removeItem('dely_admin_token');
          localStorage.removeItem('dely_admin_user');
          window.location.href = '/login';
          break;
        case 403:
          // Forbidden - Show access denied message
          console.error('Access denied');
          break;
        case 404:
          // Not found
          console.error('Resource not found');
          break;
        case 500:
          // Server error
          console.error('Server error:', error.response.data);
          console.error('Error details:', {
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data,
            url: error.config?.url,
          });
          break;
        default:
          console.error('API Error:', error.response.data);
      }
    } else if (error.request) {
      // Request made but no response
      console.error('Network error - No response from server');
    } else {
      // Something else happened
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Admin Auth API
export const adminAuthAPI = {
  login: async (email: string, password: string) => {
    const response = await apiClient.post<ApiResponse<{
      token: string;
      refreshToken: string;
      admin: {
        id: string;
        email: string;
        name: string;
        role: string;
        companyId?: string | null;
        avatar?: string;
      };
    }>>('/admin/auth/login', { email, password });
    return response.data;
  },

  logout: async () => {
    const response = await apiClient.post('/admin/auth/logout');
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await apiClient.get<ApiResponse<{
      id: string;
      email: string;
      name: string;
      role: string;
      companyId?: string | null;
      avatar?: string;
    }>>('/admin/auth/me');
    return response.data;
  },

  refreshToken: async (refreshToken: string) => {
    const response = await apiClient.post<ApiResponse<{
      token: string;
      refreshToken: string;
    }>>('/admin/auth/refresh-token', { refreshToken });
    return response.data;
  },

  // Change own password (for sellers/admins)
  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await apiClient.put<ApiResponse<void>>('/admin/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },
};

// Sellers (admin-managed)
export const sellersAPI = {
  getSellers: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    company_id?: string;
    is_active?: boolean;
  }) => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<any>>>('/admin/sellers', { params });
    return response.data;
  },

  getSeller: async (id: string) => {
    const formattedId = formatUUID(id);
    const response = await apiClient.get<ApiResponse<any>>(`/admin/sellers/${formattedId}`);
    return response.data;
  },

  createSeller: async (data: {
    email: string;
    name: string;
    company_id: string;
    password?: string;
  }) => {
    const response = await apiClient.post<ApiResponse<any>>('/admin/sellers', data);
    return response.data;
  },

  updateSeller: async (
    id: string,
    data: { name?: string; email?: string; company_id?: string; is_active?: boolean }
  ) => {
    const formattedId = formatUUID(id);
    const response = await apiClient.put<ApiResponse<any>>(`/admin/sellers/${formattedId}`, data);
    return response.data;
  },

  deleteSeller: async (id: string) => {
    const formattedId = formatUUID(id);
    const response = await apiClient.delete<ApiResponse<void>>(`/admin/sellers/${formattedId}`);
    return response.data;
  },

  resetSellerPassword: async (id: string) => {
    const formattedId = formatUUID(id);
    const response = await apiClient.post<ApiResponse<{ temporary_password: string }>>(
      `/admin/sellers/${formattedId}/reset-password`
    );
    return response.data;
  },
};

// Seller Products API (same UI as admin products, but restricted by backend to seller's company)
export const sellerProductsAPI = {
  getProducts: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    category_id?: string;
    is_available?: boolean;
  }) => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<any>>>('/seller/products', { params });
    return response.data;
  },

  getProduct: async (id: string) => {
    const formattedId = formatUUID(id);
    const response = await apiClient.get<ApiResponse<any>>(`/seller/products/${formattedId}`);
    return response.data;
  },

  createProduct: async (productData: FormData) => {
    const response = await apiClient.post<ApiResponse<any>>('/seller/products', productData);
    return response.data;
  },

  updateProduct: async (id: string, productData: FormData) => {
    const formattedId = formatUUID(id);
    const response = await apiClient.put<ApiResponse<any>>(`/seller/products/${formattedId}`, productData);
    return response.data;
  },

  deleteProduct: async (id: string) => {
    const formattedId = formatUUID(id);
    const response = await apiClient.delete<ApiResponse<void>>(`/seller/products/${formattedId}`);
    return response.data;
  },

  getStatistics: async () => {
    const response = await apiClient.get<ApiResponse<any>>('/seller/products/statistics/overview');
    return response.data;
  },
};

// Seller resource APIs (brands, categories, companies) for seller-scoped access
export const sellerResourcesAPI = {
  getBrands: async () => {
    const response = await apiClient.get<ApiResponse<any[]>>('/seller/brands');
    return response.data;
  },

  getCategories: async () => {
    const response = await apiClient.get<ApiResponse<any[]>>('/seller/categories');
    return response.data;
  },

  getCompanies: async () => {
    const response = await apiClient.get<ApiResponse<any[]>>('/seller/companies');
    return response.data;
  },
};

// Products API
export const productsAPI = {
  getProducts: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    company?: string;
    brand?: string;
    status?: string;
    stock_status?: string;
    sort?: string;
    order?: 'asc' | 'desc';
  }) => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<any>>>('/admin/products', {
      params,
    });
    return response.data;
  },

  getProduct: async (id: string) => {
    const formattedId = formatUUID(id);
    const response = await apiClient.get<ApiResponse<any>>(`/admin/products/${formattedId}`);
    return response.data;
  },

  createProduct: async (productData: FormData) => {
    // Don't set Content-Type - let axios set it automatically with boundary
    const response = await apiClient.post<ApiResponse<any>>('/admin/products', productData);
    return response.data;
  },

  updateProduct: async (id: string, productData: FormData) => {
    // Don't set Content-Type - let axios set it automatically with boundary
    const formattedId = formatUUID(id);
    const response = await apiClient.put<ApiResponse<any>>(`/admin/products/${formattedId}`, productData);
    return response.data;
  },

  deleteProduct: async (id: string) => {
    const formattedId = formatUUID(id);
    const response = await apiClient.delete<ApiResponse<void>>(`/admin/products/${formattedId}`);
    return response.data;
  },

  bulkUpdate: async (productIds: string[], updates: any) => {
    const response = await apiClient.post<ApiResponse<void>>('/admin/products/bulk-update', {
      productIds,
      updates,
    });
    return response.data;
  },

  uploadImages: async (productId: string, images: File[]) => {
    const formattedId = formatUUID(productId);
    const formData = new FormData();
    images.forEach((image, index) => {
      formData.append('images', image); // Backend expects 'images' not 'images[]'
      if (index === 0) {
        formData.append('primaryIndex', '0');
      }
    });
    // Don't set Content-Type - let axios set it automatically with boundary
    const response = await apiClient.post<ApiResponse<any>>(
      `/admin/products/${formattedId}/images`,
      formData
    );
    return response.data;
  },
};

// Orders API
export const ordersAPI = {
  getOrders: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    paymentMethod?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
    sort?: string;
    order?: 'asc' | 'desc';
  }) => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<any>>>('/admin/orders', {
      params,
    });
    return response.data;
  },

  getOrder: async (id: string) => {
    const response = await apiClient.get<ApiResponse<any>>(`/admin/orders/${id}`);
    return response.data;
  },

  updateOrderStatus: async (id: string, status: string, notes?: string) => {
    const response = await apiClient.put<ApiResponse<any>>(`/admin/orders/${id}/status`, {
      status,
      notes,
    });
    return response.data;
  },

  cancelOrder: async (id: string, reason: string) => {
    const response = await apiClient.post<ApiResponse<void>>(`/admin/orders/${id}/cancel`, {
      reason,
    });
    return response.data;
  },

  getInvoice: async (id: string) => {
    const response = await apiClient.get(`/admin/orders/${id}/invoice`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Invoice JSON (for on-screen Udaan-style invoice)
  getInvoiceData: async (id: string) => {
    const response = await apiClient.get<ApiResponse<any>>(`/admin/orders/${id}/invoice`);
    return response.data;
  },
};

// Delivery System APIs
export const adminDeliveryAPI = {
  // Delivery persons
  getDeliveryPersons: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    is_online?: boolean;
    is_available?: boolean;
    is_active?: boolean;
  }) => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<any>>>('/admin/delivery/persons', { params });
    return response.data;
  },

  createDeliveryPerson: async (data: {
    name: string;
    phone: string;
    email?: string;
    password: string;
    employeeId?: string;
    licenseNumber?: string;
    vehicleNumber?: string;
    vehicleType?: string;
  }) => {
    const response = await apiClient.post<ApiResponse<any>>('/admin/delivery/persons', data);
    return response.data;
  },

  updateDeliveryPerson: async (
    id: string,
    data: Partial<{
      name: string;
      phone: string;
      email: string;
      password: string;
      employeeId: string;
      licenseNumber: string;
      vehicleNumber: string;
      vehicleType: string;
      isActive: boolean;
    }>
  ) => {
    const response = await apiClient.put<ApiResponse<any>>(`/admin/delivery/persons/${formatUUID(id)}`, data);
    return response.data;
  },

  deactivateDeliveryPerson: async (id: string) => {
    const response = await apiClient.delete<ApiResponse<void>>(`/admin/delivery/persons/${formatUUID(id)}`);
    return response.data;
  },

  // Assignment
  assignOrder: async (data: { orderId: string; deliveryPersonId: string }) => {
    const response = await apiClient.post<ApiResponse<any>>('/admin/delivery/assign', data);
    return response.data;
  },

  // Person orders
  getDeliveryPersonOrders: async (personId: string) => {
    const response = await apiClient.get<ApiResponse<any>>(`/admin/delivery/persons/${formatUUID(personId)}/orders`);
    return response.data;
  },
};

export const deliveryAuthAPI = {
  login: async (phone: string, password: string) => {
    const response = await apiClient.post<ApiResponse<any>>('/delivery/auth/login', { phone, password });
    return response.data;
  },
};

export const deliveryOrdersAPI = {
  getAssignedOrders: async (params?: { status?: string }) => {
    const response = await apiClient.get<ApiResponse<any>>('/delivery/orders/assigned', { params });
    return response.data;
  },

  getOrder: async (orderId: string) => {
    const response = await apiClient.get<ApiResponse<any>>(`/delivery/orders/${formatUUID(orderId)}`);
    return response.data;
  },

  updateOrderStatus: async (
    orderId: string,
    data: {
      status: string;
      latitude: number;
      longitude: number;
      notes?: string;
      photo?: string;
    }
  ) => {
    const response = await apiClient.put<ApiResponse<any>>(`/delivery/orders/${formatUUID(orderId)}/status`, data);
    return response.data;
  },

  updateLocation: async (data: { latitude: number; longitude: number }) => {
    const response = await apiClient.post<ApiResponse<any>>('/delivery/orders/location', data);
    return response.data;
  },

  setAvailability: async (available: boolean) => {
    const response = await apiClient.post<ApiResponse<any>>('/delivery/orders/availability', { available });
    return response.data;
  },
};

// Users API
export const usersAPI = {
  getUsers: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    kycStatus?: string;
    isActive?: boolean;
    sort?: string;
    order?: 'asc' | 'desc';
  }) => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<any>>>('/admin/users', {
      params,
    });
    return response.data;
  },

  getUser: async (id: string) => {
    const response = await apiClient.get<ApiResponse<any>>(`/admin/users/${id}`);
    return response.data;
  },

  updateUser: async (id: string, userData: any) => {
    const response = await apiClient.put<ApiResponse<any>>(`/admin/users/${id}`, userData);
    return response.data;
  },

  blockUser: async (id: string, isActive: boolean, reason?: string) => {
    const response = await apiClient.put<ApiResponse<void>>(`/admin/users/${id}/block`, {
      isActive,
      reason,
    });
    return response.data;
  },

  resetPassword: async (id: string) => {
    const response = await apiClient.post<ApiResponse<void>>(`/admin/users/${id}/reset-password`);
    return response.data;
  },
};

// KYC API
export const kycAPI = {
  getKYCSubmissions: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }) => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<any>>>('/admin/kyc', {
      params,
    });
    return response.data;
  },

  getKYCDetails: async (id: string) => {
    const response = await apiClient.get<ApiResponse<any>>(`/admin/kyc/${id}`);
    return response.data;
  },

  verifyKYC: async (id: string, comments?: string) => {
    const response = await apiClient.put<ApiResponse<void>>(`/admin/kyc/${id}/verify`, {
      comments,
    });
    return response.data;
  },

  rejectKYC: async (id: string, reason: string) => {
    const response = await apiClient.put<ApiResponse<void>>(`/admin/kyc/${id}/reject`, {
      reason,
    });
    return response.data;
  },

  getKYCDocuments: async (id: string) => {
    const response = await apiClient.get<ApiResponse<any>>(`/admin/kyc/${id}/documents`);
    return response.data;
  },

  // Optional: single-file ZIP download (best UX)
  downloadKYCDocumentsZip: async (id: string) => {
    const response = await apiClient.get(`/admin/kyc/${id}/documents/download`, {
      responseType: 'blob',
    });
    return response.data as Blob;
  },

  getKYCByUserId: async (userId: string) => {
    const response = await apiClient.get<ApiResponse<any>>(`/admin/kyc/user/${userId}`);
    return response.data;
  },
};

// Companies API
export const companiesAPI = {
  getCompanies: async () => {
    const response = await apiClient.get<ApiResponse<any[]>>('/admin/companies');
    return response.data;
  },

  getCompany: async (id: string) => {
    const formattedId = formatUUID(id);
    const response = await apiClient.get<ApiResponse<any>>(`/admin/companies/${formattedId}`);
    return response.data;
  },

  createCompany: async (companyData: FormData) => {
    // Don't set Content-Type - let axios set it automatically with boundary
    const response = await apiClient.post<ApiResponse<any>>('/admin/companies', companyData);
    return response.data;
  },

  updateCompany: async (id: string, companyData: FormData) => {
    // Don't set Content-Type - let axios set it automatically with boundary
    const formattedId = formatUUID(id);
    const response = await apiClient.put<ApiResponse<any>>(`/admin/companies/${formattedId}`, companyData);
    return response.data;
  },

  deleteCompany: async (id: string) => {
    const formattedId = formatUUID(id);
    const response = await apiClient.delete<ApiResponse<void>>(`/admin/companies/${formattedId}`);
    return response.data;
  },
};

// Brands API
export const brandsAPI = {
  getBrands: async (params?: { companyId?: string }) => {
    const response = await apiClient.get<ApiResponse<any[]>>('/admin/brands', { params });
    return response.data;
  },

  getBrand: async (id: string) => {
    const formattedId = formatUUID(id);
    const response = await apiClient.get<ApiResponse<any>>(`/admin/brands/${formattedId}`);
    return response.data;
  },

  createBrand: async (brandData: FormData) => {
    // Don't set Content-Type - let axios set it automatically with boundary
    const response = await apiClient.post<ApiResponse<any>>('/admin/brands', brandData);
    return response.data;
  },

  updateBrand: async (id: string, brandData: FormData) => {
    // Don't set Content-Type - let axios set it automatically with boundary
    const formattedId = formatUUID(id);
    const response = await apiClient.put<ApiResponse<any>>(`/admin/brands/${formattedId}`, brandData);
    return response.data;
  },

  deleteBrand: async (id: string) => {
    const formattedId = formatUUID(id);
    const response = await apiClient.delete<ApiResponse<void>>(`/admin/brands/${formattedId}`);
    return response.data;
  },
};

// Categories API
export const categoriesAPI = {
  getCategories: async () => {
    // Admin endpoint first, fallback to seller/public endpoints for seller/mobile-like access
    try {
      const response = await apiClient.get<ApiResponse<any[]>>('/admin/categories');
      return response.data;
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 401 || status === 403) {
        // Seller fallback (preferred when logged-in as seller)
        try {
          const response = await apiClient.get<ApiResponse<any[]>>('/seller/categories');
          return response.data;
        } catch (sellerErr: any) {
          // Public fallback (as per backend): /api/v1/categories
          // Backend may return either `data: Category[]` or `data: { categories: Category[] }`
          const response = await apiClient.get<ApiResponse<any>>('/api/v1/categories');
          const data = response.data?.data as any;
          if (Array.isArray(data)) {
            return { ...response.data, data };
          }
          if (data && Array.isArray(data.categories)) {
            return { ...response.data, data: data.categories };
          }
          return { ...response.data, data: [] };
        }
      }
      throw error;
    }
  },

  createCategory: async (categoryData: any) => {
    const response = await apiClient.post<ApiResponse<any>>('/admin/categories', categoryData);
    return response.data;
  },

  updateCategory: async (id: string, categoryData: any) => {
    const response = await apiClient.put<ApiResponse<any>>(`/admin/categories/${id}`, categoryData);
    return response.data;
  },

  deleteCategory: async (id: string) => {
    const response = await apiClient.delete<ApiResponse<void>>(`/admin/categories/${id}`);
    return response.data;
  },

  reorderCategories: async (categories: Array<{ id: string; displayOrder: number }>) => {
    const response = await apiClient.put<ApiResponse<void>>('/admin/categories/reorder', {
      categories,
    });
    return response.data;
  },
};

// Offers API
export const offersAPI = {
  getOffers: async (params?: { type?: string; status?: string }) => {
    const response = await apiClient.get<ApiResponse<any[]>>('/admin/offers', { params });
    return response.data;
  },

  exportOffers: async (params?: { type?: string; status?: string; format?: 'csv' | 'xlsx' }) => {
    const response = await apiClient.get('/admin/offers/export', {
      params,
      responseType: 'blob',
    });
    return response.data as Blob;
  },

  createOffer: async (offerData: FormData) => {
    // Don't set Content-Type - let axios set it automatically with boundary
    const response = await apiClient.post<ApiResponse<any>>('/admin/offers', offerData);
    return response.data;
  },

  updateOffer: async (id: string, offerData: FormData) => {
    // Don't set Content-Type - let axios set it automatically with boundary
    const response = await apiClient.put<ApiResponse<any>>(`/admin/offers/${id}`, offerData);
    return response.data;
  },

  deleteOffer: async (id: string) => {
    const response = await apiClient.delete<ApiResponse<void>>(`/admin/offers/${id}`);
    return response.data;
  },

  toggleOfferStatus: async (id: string) => {
    const response = await apiClient.put<ApiResponse<void>>(`/admin/offers/${id}/toggle`);
    return response.data;
  },
};

// Analytics API
export const analyticsAPI = {
  getDashboardMetrics: async (params?: {
    period?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => {
    const response = await apiClient.get<ApiResponse<any>>('/admin/analytics/dashboard', { params });
    return response.data;
  },

  getRevenueData: async (params?: {
    period?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => {
    const response = await apiClient.get<ApiResponse<any[]>>('/admin/analytics/revenue', { params });
    return response.data;
  },

  getOrderAnalytics: async (params?: {
    period?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => {
    const response = await apiClient.get<ApiResponse<any>>('/admin/analytics/orders', { params });
    return response.data;
  },

  getProductAnalytics: async (params?: {
    period?: string;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
  }) => {
    const response = await apiClient.get<ApiResponse<any>>('/admin/analytics/products', { params });
    return response.data;
  },

  getCategoryAnalytics: async (params?: {
    period?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => {
    const response = await apiClient.get<ApiResponse<any>>('/admin/analytics/categories', { params });
    return response.data;
  },

  getCompanyAnalytics: async (params?: {
    period?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => {
    const response = await apiClient.get<ApiResponse<any>>('/admin/analytics/companies', { params });
    return response.data;
  },

  getUserAnalytics: async (params?: {
    period?: string;
    dateFrom?: string;
    dateTo?: string;
  }) => {
    const response = await apiClient.get<ApiResponse<any>>('/admin/analytics/users', { params });
    return response.data;
  },

  exportAnalyticsReport: async (params?: {
    period?: string;
    dateFrom?: string;
    dateTo?: string;
    format?: 'xlsx' | 'csv';
  }) => {
    const response = await apiClient.get('/admin/analytics/export', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },
};

// Settings API
export const settingsAPI = {
  // Get all settings
  getSettings: async () => {
    const response = await apiClient.get<ApiResponse<any>>('/admin/settings');
    return response.data;
  },

  // Update all settings (or specific section)
  updateSettings: async (settings: any) => {
    const response = await apiClient.put<ApiResponse<void>>('/admin/settings', settings);
    return response.data;
  },

  // General settings
  getGeneralSettings: async () => {
    const response = await apiClient.get<ApiResponse<any>>('/admin/settings/general');
    return response.data;
  },

  updateGeneralSettings: async (settings: {
    appName?: string;
    appLogo?: File | string;
    contactEmail?: string;
    contactPhone?: string;
    businessAddress?: string;
  }) => {
    const formData = new FormData();
    if (settings.appName) formData.append('appName', settings.appName);
    if (settings.appLogo instanceof File) formData.append('appLogo', settings.appLogo);
    if (settings.appLogo && typeof settings.appLogo === 'string') formData.append('appLogoUrl', settings.appLogo);
    if (settings.contactEmail) formData.append('contactEmail', settings.contactEmail);
    if (settings.contactPhone) formData.append('contactPhone', settings.contactPhone);
    if (settings.businessAddress) formData.append('businessAddress', settings.businessAddress);
    
    const response = await apiClient.put<ApiResponse<void>>('/admin/settings/general', formData);
    return response.data;
  },

  // Payment settings
  getPaymentSettings: async () => {
    const response = await apiClient.get<ApiResponse<any>>('/admin/settings/payment');
    return response.data;
  },

  updatePaymentSettings: async (settings: {
    creditEnabled?: boolean;
    upiEnabled?: boolean;
    bankTransferEnabled?: boolean;
    cashOnDeliveryEnabled?: boolean;
    defaultCreditLimit?: number;
    paymentTermsDays?: number;
  }) => {
    const response = await apiClient.put<ApiResponse<void>>('/admin/settings/payment', settings);
    return response.data;
  },

  // Delivery settings
  getDeliverySettings: async () => {
    const response = await apiClient.get<ApiResponse<any>>('/admin/settings/delivery');
    return response.data;
  },

  updateDeliverySettings: async (settings: {
    standardDeliveryCharge?: number;
    freeDeliveryThreshold?: number;
    deliveryTimeSlots?: string;
    serviceablePincodes?: string[];
  }) => {
    const response = await apiClient.put<ApiResponse<void>>('/admin/settings/delivery', settings);
    return response.data;
  },

  // Tax settings
  getTaxSettings: async () => {
    const response = await apiClient.get<ApiResponse<any>>('/admin/settings/tax');
    return response.data;
  },

  updateTaxSettings: async (settings: {
    defaultGstRate?: number;
    categoryGstRates?: Array<{ categoryId: string; categoryName: string; gstRate: number }>;
  }) => {
    const response = await apiClient.put<ApiResponse<void>>('/admin/settings/tax', settings);
    return response.data;
  },

  // Notification settings
  getNotificationSettings: async () => {
    const response = await apiClient.get<ApiResponse<any>>('/admin/settings/notifications');
    return response.data;
  },

  updateNotificationSettings: async (settings: {
    emailTemplates?: {
      orderConfirmation?: string;
      orderShipped?: string;
      orderDelivered?: string;
      orderCancelled?: string;
    };
    smsTemplates?: {
      orderConfirmation?: string;
      orderShipped?: string;
      orderDelivered?: string;
      orderCancelled?: string;
    };
  }) => {
    const response = await apiClient.put<ApiResponse<void>>('/admin/settings/notifications', settings);
    return response.data;
  },

  // Admin users
  getAdmins: async () => {
    const response = await apiClient.get<ApiResponse<any[]>>('/admin/admins');
    return response.data;
  },

  createAdmin: async (adminData: {
    name: string;
    email: string;
    password: string;
    role: 'super_admin' | 'admin' | 'manager' | 'support';
  }) => {
    const response = await apiClient.post<ApiResponse<any>>('/admin/admins', adminData);
    return response.data;
  },

  updateAdmin: async (id: string, adminData: {
    name?: string;
    email?: string;
    password?: string;
    role?: 'super_admin' | 'admin' | 'manager' | 'support';
    status?: 'active' | 'inactive';
  }) => {
    const response = await apiClient.put<ApiResponse<any>>(`/admin/admins/${formatUUID(id)}`, adminData);
    return response.data;
  },

  deleteAdmin: async (id: string) => {
    const response = await apiClient.delete<ApiResponse<void>>(`/admin/admins/${formatUUID(id)}`);
    return response.data;
  },
};

// Notifications API (user inbox: KYC and order status notifications from backend)
export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  data?: Record<string, unknown>;
}

export interface NotificationsListResponse {
  notifications: NotificationItem[];
  unreadCount: number;
  pagination: { page: number; limit: number; total: number };
}

export const notificationsAPI = {
  getList: async (params?: { page?: number; limit?: number; unread?: boolean }) => {
    const response = await apiClient.get<ApiResponse<NotificationsListResponse>>('/v1/notifications', { params });
    return response.data;
  },

  markAllRead: async () => {
    const response = await apiClient.put<ApiResponse<{ message: string }>>('/v1/notifications/read-all');
    return response.data;
  },

  markRead: async (id: string) => {
    const response = await apiClient.put<ApiResponse<{ message: string }>>(`/v1/notifications/${id}/read`);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await apiClient.delete<ApiResponse<{ message: string }>>(`/v1/notifications/${id}`);
    return response.data;
  },
};

// File Upload API
export const uploadAPI = {
  uploadImage: async (file: File, type: 'product' | 'company' | 'brand' | 'offer' | 'category', entityId?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    if (entityId) {
      formData.append('entityId', entityId);
    }
    // Don't set Content-Type - let axios set it automatically with boundary
    const response = await apiClient.post<ApiResponse<{
      url: string;
      thumbnailUrl: string;
      size: number;
      width: number;
      height: number;
    }>>('/admin/upload/image', formData);
    return response.data;
  },
};

// Reports API
export const reportsAPI = {
  getWeeklyUserLocationReport: async (startDate: string, endDate: string) => {
    const response = await apiClient.get<ApiResponse<{
      locations: Array<{
        city?: string;
        state?: string;
        activeUsers: number;
        inactiveUsers: number;
      }>;
      summary: {
        totalActive: number;
        totalInactive: number;
        totalUsers: number;
      };
    }>>('/admin/reports/weekly/user-location', {
      params: {
        startDate,
        endDate,
      },
    });
    return response.data;
  },

  exportWeeklyUserLocationReport: async (startDate: string, endDate: string) => {
    const response = await apiClient.get('/admin/reports/weekly/user-location/export', {
      params: {
        startDate,
        endDate,
      },
      responseType: 'blob',
    });
    return response.data;
  },
};

// Export default apiClient for custom requests
export default apiClient;

