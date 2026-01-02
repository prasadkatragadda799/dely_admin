import axios, { AxiosInstance, AxiosError } from 'axios';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://dely-backend.onrender.com';

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

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('dely_admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
          console.error('Server error');
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
    const response = await apiClient.get<ApiResponse<any>>(`/admin/products/${id}`);
    return response.data;
  },

  createProduct: async (productData: FormData) => {
    const response = await apiClient.post<ApiResponse<any>>('/admin/products', productData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  updateProduct: async (id: string, productData: FormData) => {
    const response = await apiClient.put<ApiResponse<any>>(`/admin/products/${id}`, productData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deleteProduct: async (id: string) => {
    const response = await apiClient.delete<ApiResponse<void>>(`/admin/products/${id}`);
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
    const formData = new FormData();
    images.forEach((image, index) => {
      formData.append('images[]', image);
      if (index === 0) {
        formData.append('primaryIndex', '0');
      }
    });
    const response = await apiClient.post<ApiResponse<any>>(
      `/admin/products/${productId}/images`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
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
};

// Companies API
export const companiesAPI = {
  getCompanies: async () => {
    const response = await apiClient.get<ApiResponse<any[]>>('/admin/companies');
    return response.data;
  },

  createCompany: async (companyData: FormData) => {
    const response = await apiClient.post<ApiResponse<any>>('/admin/companies', companyData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  updateCompany: async (id: string, companyData: FormData) => {
    const response = await apiClient.put<ApiResponse<any>>(`/admin/companies/${id}`, companyData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deleteCompany: async (id: string) => {
    const response = await apiClient.delete<ApiResponse<void>>(`/admin/companies/${id}`);
    return response.data;
  },
};

// Brands API
export const brandsAPI = {
  getBrands: async (params?: { companyId?: string }) => {
    const response = await apiClient.get<ApiResponse<any[]>>('/admin/brands', { params });
    return response.data;
  },

  createBrand: async (brandData: FormData) => {
    const response = await apiClient.post<ApiResponse<any>>('/admin/brands', brandData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  updateBrand: async (id: string, brandData: FormData) => {
    const response = await apiClient.put<ApiResponse<any>>(`/admin/brands/${id}`, brandData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deleteBrand: async (id: string) => {
    const response = await apiClient.delete<ApiResponse<void>>(`/admin/brands/${id}`);
    return response.data;
  },
};

// Categories API
export const categoriesAPI = {
  getCategories: async () => {
    const response = await apiClient.get<ApiResponse<any[]>>('/admin/categories');
    return response.data;
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

  createOffer: async (offerData: FormData) => {
    const response = await apiClient.post<ApiResponse<any>>('/admin/offers', offerData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  updateOffer: async (id: string, offerData: FormData) => {
    const response = await apiClient.put<ApiResponse<any>>(`/admin/offers/${id}`, offerData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
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
  getDashboardMetrics: async () => {
    const response = await apiClient.get<ApiResponse<any>>('/admin/analytics/dashboard');
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
  }) => {
    const response = await apiClient.get<ApiResponse<any>>('/admin/analytics/products', { params });
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
};

// Settings API
export const settingsAPI = {
  getSettings: async () => {
    const response = await apiClient.get<ApiResponse<any>>('/admin/settings');
    return response.data;
  },

  updateSettings: async (settings: any) => {
    const response = await apiClient.put<ApiResponse<void>>('/admin/settings', settings);
    return response.data;
  },

  getAdmins: async () => {
    const response = await apiClient.get<ApiResponse<any[]>>('/admin/admins');
    return response.data;
  },

  createAdmin: async (adminData: any) => {
    const response = await apiClient.post<ApiResponse<any>>('/admin/admins', adminData);
    return response.data;
  },

  updateAdmin: async (id: string, adminData: any) => {
    const response = await apiClient.put<ApiResponse<any>>(`/admin/admins/${id}`, adminData);
    return response.data;
  },

  deleteAdmin: async (id: string) => {
    const response = await apiClient.delete<ApiResponse<void>>(`/admin/admins/${id}`);
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
    const response = await apiClient.post<ApiResponse<{
      url: string;
      thumbnailUrl: string;
      size: number;
      width: number;
      height: number;
    }>>('/admin/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

// Export default apiClient for custom requests
export default apiClient;

