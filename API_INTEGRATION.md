# API Integration Guide

## Production Backend URL

The admin panel is configured to use the production backend service:

**Base URL:** `https://dely-backend.onrender.com`

**API Endpoint:** `https://dely-backend.onrender.com/admin`

**Note:** All admin endpoints are directly under `/admin/*` path (not `/api/v1/admin/*`)

## Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_URL=https://dely-backend.onrender.com
VITE_ENV=production
```

The API client will automatically use this URL. If not set, it defaults to the production URL.

### API Client Setup

The API client is configured in `src/lib/api.ts` with:

- **Base URL:** `https://dely-backend.onrender.com/api/v1`
- **Timeout:** 30 seconds
- **Authentication:** JWT Bearer token (stored in localStorage)
- **Error Handling:** Automatic token refresh and logout on 401

## Available API Modules

All API functions are exported from `src/lib/api.ts`:

### Authentication
```typescript
import { adminAuthAPI } from '@/lib/api';

// Login
const response = await adminAuthAPI.login(email, password);

// Get current user
const user = await adminAuthAPI.getCurrentUser();

// Logout
await adminAuthAPI.logout();

// Refresh token
await adminAuthAPI.refreshToken(refreshToken);
```

### Products
```typescript
import { productsAPI } from '@/lib/api';

// Get products with filters
const products = await productsAPI.getProducts({
  page: 1,
  limit: 20,
  search: 'rice',
  category: 'category-id',
  status: 'available'
});

// Create product
const newProduct = await productsAPI.createProduct(formData);

// Update product
await productsAPI.updateProduct(productId, formData);

// Delete product
await productsAPI.deleteProduct(productId);
```

### Orders
```typescript
import { ordersAPI } from '@/lib/api';

// Get orders
const orders = await ordersAPI.getOrders({
  status: 'pending',
  page: 1
});

// Update order status
await ordersAPI.updateOrderStatus(orderId, 'confirmed', 'Notes');

// Get invoice
const invoiceBlob = await ordersAPI.getInvoice(orderId);
```

### Users
```typescript
import { usersAPI } from '@/lib/api';

// Get users
const users = await usersAPI.getUsers({
  kycStatus: 'pending'
});

// Block/unblock user
await usersAPI.blockUser(userId, false, 'Reason');
```

### KYC
```typescript
import { kycAPI } from '@/lib/api';

// Get KYC submissions
const kycList = await kycAPI.getKYCSubmissions({
  status: 'pending'
});

// Verify KYC
await kycAPI.verifyKYC(kycId, 'Comments');

// Reject KYC
await kycAPI.rejectKYC(kycId, 'Reason');
```

### Companies & Brands
```typescript
import { companiesAPI, brandsAPI } from '@/lib/api';

// Get companies
const companies = await companiesAPI.getCompanies();

// Create company
await companiesAPI.createCompany(formData);

// Get brands
const brands = await brandsAPI.getBrands({ companyId: 'id' });
```

### Categories
```typescript
import { categoriesAPI } from '@/lib/api';

// Get categories (tree structure)
const categories = await categoriesAPI.getCategories();

// Create category
await categoriesAPI.createCategory({
  name: 'Rice & Grains',
  slug: 'rice-grains',
  icon: 'rice',
  color: '#1E6DD8'
});
```

### Offers
```typescript
import { offersAPI } from '@/lib/api';

// Get offers
const offers = await offersAPI.getOffers({
  type: 'banner',
  status: 'active'
});

// Create offer
await offersAPI.createOffer(formData);
```

### Analytics
```typescript
import { analyticsAPI } from '@/lib/api';

// Get dashboard metrics
const metrics = await analyticsAPI.getDashboardMetrics();

// Get revenue data
const revenue = await analyticsAPI.getRevenueData({
  period: 'monthly',
  dateFrom: '2024-01-01',
  dateTo: '2024-01-31'
});
```

### Settings
```typescript
import { settingsAPI } from '@/lib/api';

// Get settings
const settings = await settingsAPI.getSettings();

// Update settings
await settingsAPI.updateSettings({
  appName: 'Dely',
  contactEmail: 'support@dely.com'
});
```

### File Upload
```typescript
import { uploadAPI } from '@/lib/api';

// Upload image
const result = await uploadAPI.uploadImage(
  file,
  'product', // or 'company', 'brand', 'offer', 'category'
  'entity-id' // optional
);
```

## Error Handling

The API client automatically handles:

- **401 Unauthorized:** Clears token and redirects to login
- **403 Forbidden:** Shows access denied message
- **404 Not Found:** Logs resource not found
- **500 Server Error:** Logs server error
- **Network Errors:** Handles connection issues

## Authentication Flow

1. User logs in via `adminAuthAPI.login()`
2. Token is stored in `localStorage` as `dely_admin_token`
3. Token is automatically added to all API requests via interceptor
4. On 401 error, token is cleared and user is redirected to login
5. On app load, stored token is validated with backend

## Usage Example

```typescript
import { productsAPI } from '@/lib/api';
import { useQuery, useMutation } from '@tanstack/react-query';

// In a React component
function ProductsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsAPI.getProducts({ page: 1, limit: 20 })
  });

  const createMutation = useMutation({
    mutationFn: (formData: FormData) => productsAPI.createProduct(formData),
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries(['products']);
    }
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {data?.data.items.map(product => (
        <div key={product.id}>{product.name}</div>
      ))}
    </div>
  );
}
```

## Testing API Connection

To test if the backend is accessible:

```typescript
import apiClient from '@/lib/api';

// Test connection
apiClient.get('/admin/auth/me')
  .then(response => console.log('Connected:', response.data))
  .catch(error => console.error('Connection failed:', error));
```

## Backend Requirements

Ensure your backend at `https://dely-backend.onrender.com` implements:

1. **CORS** - Allow requests from your admin panel domain
2. **JWT Authentication** - Token-based auth for `/admin/*` routes
3. **API Versioning** - Routes under `/api/v1/`
4. **Error Format** - Consistent error response format
5. **File Upload** - Support for multipart/form-data

## API Response Format

All API responses should follow this format:

**Success:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message",
    "details": { ... }
  }
}
```

## Pagination Format

Paginated responses:
```json
{
  "success": true,
  "data": {
    "items": [ ... ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

---

For detailed API endpoint specifications, see the backend documentation or refer to `BACKEND_REQUIREMENTS.md` if available.

