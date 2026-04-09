import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye,
  Download,
  Package,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsAPI, categoriesAPI, divisionsAPI, type Division, sellerProductsAPI } from '@/lib/api';
import { ExcelBulkImportSection } from '@/components/admin/ExcelBulkImportSection';
import { ProductForm } from '@/components/admin/ProductForm';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';

interface Category {
  id: string;
  name: string;
  slug: string;
  children?: Category[];
}

/** Align with backend format_variant_packaging_line / mobile app */
function formatVariantPackagingLine(v: Record<string, unknown> | null | undefined): string {
  if (!v) return '';
  const pl = String(v.packagingLabel ?? '').trim();
  if (pl) return pl;
  const type = String(v.packagingLabelType ?? v.packaging_label_type ?? '')
    .trim()
    .toLowerCase();
  const labels: Record<string, string> = {
    set: 'Set',
    pieces: 'Pieces',
    pack: 'Pack',
    unit: 'Unit',
    pair: 'Pair',
    dozen: 'Dozen',
  };
  const head = type && labels[type] ? labels[type] : '';
  const detail = String(v.setPieces ?? v.set_pcs ?? '').trim();
  if (head && detail) return `${head}: ${detail}`;
  if (head) return head;
  return detail;
}

export default function Products() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | undefined>();
  const [viewingProduct, setViewingProduct] = useState<any | null>(null);
  const [viewingImageIndex, setViewingImageIndex] = useState(0);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50); // Admin API supports up to 10000; seller up to 100
  const [exporting, setExporting] = useState(false);
  /** all | seller | platform — staff-only; seller role uses seller API. */
  const [listingScope, setListingScope] = useState<'all' | 'seller' | 'platform'>('all');

  const [searchParams, setSearchParams] = useSearchParams();
  const createdByFromUrl = (searchParams.get('created_by') || '').trim();

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isSeller = user?.role === 'seller';

  useEffect(() => {
    if (isSeller || !createdByFromUrl) return;
    setListingScope('all');
    setPage(1);
  }, [createdByFromUrl, isSeller]);

  // Ensure query runs when component mounts
  useEffect(() => {
    // Invalidate and refetch products when component mounts
    queryClient.invalidateQueries({ queryKey: ['products'] });
  }, [queryClient]);

  // Fetch categories for filter
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await categoriesAPI.getCategories();
      return response.data || [];
    },
  });

  const { data: divisionsData } = useQuery({
    queryKey: ['divisions'],
    queryFn: async () => {
      const response = await divisionsAPI.getDivisions();
      return (response.data || []) as Division[];
    },
  });

  const divisionById = useMemo(() => {
    const map = new Map<string, Division>();
    (divisionsData || []).forEach((d) => map.set(d.id, d));
    return map;
  }, [divisionsData]);

  const getDivisionBadge = (product: any) => {
    const divisionId = product?.division?.id ?? product?.divisionId ?? product?.division_id ?? null;
    const slug = product?.division?.slug ?? divisionById.get(divisionId || '')?.slug ?? null;
    const name = product?.division?.name ?? divisionById.get(divisionId || '')?.name ?? null;
    if (!divisionId) return <Badge variant="secondary">Grocery</Badge>;
    if (slug === 'kitchen') return <Badge className="bg-amber-500/15 text-amber-700 border border-amber-500/30">Kitchen</Badge>;
    return <Badge variant="secondary">{name || 'Division'}</Badge>;
  };

  const getHsnCode = (product: any) => {
    const variants =
      (Array.isArray(product?.variants) && product.variants) ||
      (Array.isArray(product?.product_variants) && product.product_variants) ||
      (Array.isArray(product?.productVariants) && product.productVariants) ||
      [];
    const v0 = variants[0];
    const hsn =
      product?.hsnCode ??
      product?.hsn_code ??
      v0?.hsnCode ??
      v0?.hsn_code ??
      v0?.hsn ??
      null;
    const s = String(hsn ?? '').trim();
    return s ? s : '—';
  };

  const getProductImageUrls = (product: any): string[] => {
    const rows =
      (Array.isArray(product?.images) && product.images) ||
      (Array.isArray(product?.product_images) && product.product_images) ||
      (Array.isArray(product?.productImages) && product.productImages) ||
      [];
    const urls = rows
      .map((img: any) => String(img?.image_url || img?.imageUrl || img?.url || '').trim())
      .filter(Boolean);
    const deduped: string[] = Array.from(new Set<string>(urls));
    const primary = rows.find((img: any) => img?.isPrimary || img?.is_primary);
    const primaryUrl = String(primary?.image_url || primary?.imageUrl || primary?.url || '').trim();
    if (primaryUrl) {
      return [primaryUrl, ...deduped.filter((u: string) => u !== primaryUrl)];
    }
    return deduped;
  };

  // Flatten categories for dropdown
  const flattenCategories = (cats: Category[]): Category[] => {
    const result: Category[] = [];
    const flatten = (items: Category[], level = 0) => {
      items.forEach((cat) => {
        result.push({ ...cat, name: '  '.repeat(level) + cat.name });
        if (cat.children && cat.children.length > 0) {
          flatten(cat.children, level + 1);
        }
      });
    };
    flatten(cats);
    return result;
  };

  const categories = categoriesData ? flattenCategories(categoriesData) : [];

  // Calculate discount percentage helper
  const calculateDiscountPercent = (mrp: number, sellingPrice: number): number => {
    if (!mrp || mrp === 0 || mrp <= sellingPrice) return 0;
    return Math.round(((mrp - sellingPrice) / mrp) * 100);
  };

  // Build filters
  const filters = useMemo(() => {
    const filterParams: any = {
      page,
      limit,
    };

    if (searchQuery) {
      filterParams.search = searchQuery;
    }

    if (selectedCategory && selectedCategory !== 'all') {
      filterParams.category = selectedCategory;
    }

    if (selectedStatus === 'available') {
      filterParams.status = 'available';
    } else if (selectedStatus === 'low_stock') {
      filterParams.stock_status = 'low_stock';
    } else     if (selectedStatus === 'out_of_stock') {
      filterParams.stock_status = 'out_of_stock';
    }

    if (!isSeller) {
      if (createdByFromUrl) {
        filterParams.created_by = createdByFromUrl;
      } else if (listingScope === 'seller' || listingScope === 'platform') {
        filterParams.listing_scope = listingScope;
      }
    }

    return filterParams;
  }, [
    searchQuery,
    selectedCategory,
    selectedStatus,
    page,
    limit,
    isSeller,
    createdByFromUrl,
    listingScope,
  ]);

  // Normalize pagination from various backend shapes to { page, limit, total, totalPages }
  const normalizePagination = (data: any, fallback: { page: number; limit: number }) => {
    const page = fallback.page || 1;
    const limit = fallback.limit || 20;
    const pag = data?.pagination ?? data;
    const total = pag?.total ?? pag?.totalCount ?? pag?.total_count ?? 0;
    const currentPage = Number(pag?.page ?? pag?.currentPage ?? pag?.current_page ?? page);
    const limitVal = Number(pag?.limit ?? pag?.per_page ?? limit);
    const totalPages = Number((pag?.totalPages ?? pag?.total_pages ?? Math.ceil((total || 0) / limitVal)) || 1);
    return {
      page: currentPage,
      limit: limitVal,
      total: Number(total) || 0,
      totalPages: totalPages >= 1 ? totalPages : 1,
    };
  };

  // Fetch products
  const {
    data: productsResponse,
    isLoading,
    isError,
    error,
    isFetching,
  } = useQuery({
    queryKey: ['products', filters],
    queryFn: async () => {
      try {
        const response = isSeller
          ? await sellerProductsAPI.getProducts({
              page: filters.page,
              limit: filters.limit,
              search: filters.search,
              category_id: filters.category,
              is_available: filters.status === 'available' ? true : undefined,
            })
          : await productsAPI.getProducts(filters);
        
        const fallback = { page: filters.page || 1, limit: filters.limit || 20 };
        // response may be axios response.data: either { data: { items, pagination } } or { items, pagination } at top level
        const payload = (response as any)?.data ?? response;
        if (!payload) {
          return { items: [], pagination: { ...fallback, total: 0, totalPages: 1 } };
        }

        let items: any[] = [];
        let paginationSource: any = payload;

        if (payload.items && Array.isArray(payload.items)) {
          items = payload.items;
          paginationSource = payload;
        } else if (Array.isArray(payload)) {
          items = payload;
          paginationSource = { total: payload.length };
        } else if (payload.products && Array.isArray(payload.products)) {
          items = payload.products;
          paginationSource = payload;
        }

        const pagination = normalizePagination(paginationSource, fallback);

        return {
          items,
          pagination: {
            ...pagination,
            totalPages: Math.max(1, Math.ceil((pagination.total || 0) / pagination.limit)),
          },
        };
      } catch (error) {
        console.error('[Products] Error fetching products:', error);
        throw error;
      }
    },
    // Use placeholderData instead of deprecated keepPreviousData for React Query v5
    placeholderData: (previousData) => previousData,
    staleTime: 0, // Always refetch when navigating to the page
    refetchOnWindowFocus: true,
    refetchOnMount: true, // Always refetch when component mounts
    enabled: true, // Explicitly enable the query
  });

  const products = productsResponse?.items || [];
  const pagination = productsResponse?.pagination || {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  };

  // Delete product mutation
  const deleteMutation = useMutation({
    mutationFn: (productId: string) =>
      isSeller ? sellerProductsAPI.deleteProduct(productId) : productsAPI.deleteProduct(productId),
    onSuccess: () => {
      // Invalidate and refetch products
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: 'Product deleted',
        description: 'Product has been deleted successfully',
      });
      setDeletingProductId(null);
      setSelectedProducts([]);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error?.message || 'Failed to delete product',
        variant: 'destructive',
      });
      setDeletingProductId(null);
    },
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatExpiry = (product: any) => {
    const raw = product?.expiryDate ?? product?.expiry_date ?? null;
    if (!raw) return '—';
    const d = new Date(raw);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getStatusBadge = (product: any) => {
    const stock = product.stockQuantity || product.stock_quantity || 0;
    const isAvailable = product.isAvailable !== undefined ? product.isAvailable : (product.is_available !== undefined ? product.is_available : true);
    if (!isAvailable) return <Badge variant="cancelled">Unavailable</Badge>;
    if (stock === 0) return <Badge variant="cancelled">Out of Stock</Badge>;
    if (stock < 50) return <Badge variant="pending">Low Stock</Badge>;
    return <Badge variant="delivered">Available</Badge>;
  };

  const toggleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map((p: any) => p.id));
    }
  };

  const toggleSelectProduct = (id: string) => {
    if (selectedProducts.includes(id)) {
      setSelectedProducts(selectedProducts.filter((p) => p !== id));
    } else {
      setSelectedProducts([...selectedProducts, id]);
    }
  };

  const handleEdit = (productId: string) => {
    setEditingProductId(productId);
    setIsFormOpen(true);
  };

  const handleDelete = (productId: string) => {
    setDeletingProductId(productId);
  };

  const handleViewDetails = (product: any) => {
    setViewingProduct(product);
    setViewingImageIndex(0);
  };

  const confirmDelete = () => {
    if (deletingProductId) {
      deleteMutation.mutate(deletingProductId);
    }
  };

  const handleAddProduct = () => {
    setEditingProductId(undefined);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingProductId(undefined);
  };

  const escapeCsv = (val: string | number): string => {
    const s = String(val ?? '');
    if (s.includes('"') || s.includes(',') || s.includes('\n') || s.includes('\r')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const exportLimit = isSeller ? 100 : 5000;
      const params: any = { page: 1, limit: exportLimit };
      if (searchQuery) params.search = searchQuery;
      if (selectedCategory && selectedCategory !== 'all') params.category = selectedCategory;
      if (selectedStatus === 'available') params.status = 'available';
      if (selectedStatus === 'low_stock') params.stock_status = 'low_stock';
      if (selectedStatus === 'out_of_stock') params.stock_status = 'out_of_stock';
      if (!isSeller) {
        if (createdByFromUrl) params.created_by = createdByFromUrl;
        else if (listingScope === 'seller' || listingScope === 'platform') {
          params.listing_scope = listingScope;
        }
      }

      const response = isSeller
        ? await sellerProductsAPI.getProducts({
            page: 1,
            limit: exportLimit,
            search: params.search,
            category_id: params.category,
            is_available: params.status === 'available' ? true : undefined,
          })
        : await productsAPI.getProducts(params);

      const payload = (response as any)?.data ?? response;
      let items: any[] = [];
      if (payload?.items && Array.isArray(payload.items)) items = payload.items;
      else if (Array.isArray(payload)) items = payload;
      else if (payload?.products && Array.isArray(payload.products)) items = payload.products;

      const headers = [
        'Name',
        'Division',
        'HSN Code',
        'Brand',
        'Company',
        'Category',
        ...(isSeller ? [] : ['Listed by', 'Creator role']),
        'MRP',
        'Selling Price',
        'Stock',
        'Expiry',
        'Status',
      ];
      const rows = items.map((p: any) => {
        const mrp = p.mrp ?? 0;
        const sellingPrice = p.sellingPrice ?? p.selling_price ?? 0;
        const stock = p.stockQuantity ?? p.stock_quantity ?? 0;
        const isAvailable = p.isAvailable !== undefined ? p.isAvailable : (p.is_available !== undefined ? p.is_available : true);
        let status = 'Available';
        if (!isAvailable) status = 'Unavailable';
        else if (stock === 0) status = 'Out of Stock';
        else if (stock < 50) status = 'Low Stock';
        const expiry = p.expiryDate ?? p.expiry_date ?? '';
        const expiryStr = expiry ? new Date(expiry).toLocaleDateString('en-CA') : '';
        const divId = p?.division?.id ?? p?.divisionId ?? p?.division_id ?? null;
        const divSlug = p?.division?.slug ?? divisionById.get(divId || '')?.slug ?? '';
        const divName = p?.division?.name ?? divisionById.get(divId || '')?.name ?? '';
        const divisionLabel = divId ? (divSlug || divName || 'Division') : 'Grocery';

        const variants =
          (Array.isArray(p?.variants) && p.variants) ||
          (Array.isArray(p?.product_variants) && p.product_variants) ||
          (Array.isArray(p?.productVariants) && p.productVariants) ||
          [];
        const v0 = variants[0];
        const hsn = p?.hsnCode ?? p?.hsn_code ?? v0?.hsnCode ?? v0?.hsn_code ?? v0?.hsn ?? '';

        const cells = [
          escapeCsv(p.name ?? ''),
          escapeCsv(divisionLabel),
          escapeCsv(hsn ?? ''),
          escapeCsv(p.brand?.name ?? ''),
          escapeCsv(p.company?.name ?? ''),
          escapeCsv(p.category?.name ?? ''),
        ];
        if (!isSeller) {
          cells.push(escapeCsv(p.creator?.name ?? ''), escapeCsv(p.creator?.role ?? ''));
        }
        cells.push(
          escapeCsv(mrp),
          escapeCsv(sellingPrice),
          escapeCsv(stock),
          escapeCsv(expiryStr),
          escapeCsv(status),
        );
        return cells.join(',');
      });
      const csv = [headers.join(','), ...rows].join('\r\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `products-export-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: 'Export done', description: `${items.length} products exported.` });
    } catch (err: any) {
      toast({
        title: 'Export failed',
        description: err?.response?.data?.message || err?.message || 'Could not export products.',
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
    }
  };

  // Calculate stats from products
  const stats = useMemo(() => {
    const total = pagination.total || products.length;
    const inStock = products.filter((p: any) => {
      const stock = p.stockQuantity || p.stock_quantity || 0;
      const isAvailable = p.isAvailable !== undefined ? p.isAvailable : (p.is_available !== undefined ? p.is_available : true);
      return stock > 0 && isAvailable;
    }).length;
    const lowStock = products.filter((p: any) => {
      const stock = p.stockQuantity || p.stock_quantity || 0;
      return stock > 0 && stock < 50;
    }).length;
    const outOfStock = products.filter((p: any) => {
      const stock = p.stockQuantity || p.stock_quantity || 0;
      return stock === 0;
    }).length;
    return { total, inStock, lowStock, outOfStock };
  }, [products, pagination]);

  return (
    <div className="min-w-0 space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Products</h1>
          <p className="text-muted-foreground">Manage your product catalog</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Export
          </Button>
          <ExcelBulkImportSection entity="products" invalidateQueryKeys={[['products']]} />
          <Button variant="gradient" onClick={handleAddProduct}>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                )}
                <p className="text-xs text-muted-foreground">Total Products</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100">
                <Package className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">{stats.inStock}</p>
                )}
                <p className="text-xs text-muted-foreground">In Stock</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100">
                <Package className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">{stats.lowStock}</p>
                )}
                <p className="text-xs text-muted-foreground">Low Stock</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100">
                <Package className="h-5 w-5 text-red-600" />
              </div>
              <div>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">{stats.outOfStock}</p>
                )}
                <p className="text-xs text-muted-foreground">Out of Stock</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {!isSeller && createdByFromUrl && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-lg border border-border bg-secondary/30 px-4 py-3 text-sm">
          <p className="text-foreground">
            Showing products created by this seller (admin id filter). Use{' '}
            <span className="font-mono text-xs">{createdByFromUrl}</span>
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchParams((prev) => {
                const p = new URLSearchParams(prev);
                p.delete('created_by');
                return p;
              });
              setPage(1);
            }}
          >
            Clear seller filter
          </Button>
        </div>
      )}

      {/* Filters */}
      <Card className="shadow-card">
        <CardContent className="p-4">
          <div className="flex min-w-0 flex-col gap-4 lg:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search products by name, brand, or company..."
                className="min-w-0 pl-10"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1); // Reset to first page on search
                }}
              />
            </div>
            <div className="flex min-w-0 flex-wrap gap-3">
              <Select value={selectedCategory} onValueChange={(value) => {
                setSelectedCategory(value);
                setPage(1);
              }}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedStatus} onValueChange={(value) => {
                setSelectedStatus(value);
                setPage(1);
              }}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="low_stock">Low Stock</SelectItem>
                  <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
              {!isSeller && !createdByFromUrl && (
                <Select
                  value={listingScope}
                  onValueChange={(value: 'all' | 'seller' | 'platform') => {
                    setListingScope(value);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-[200px]" title="Catalog scope">
                    <SelectValue placeholder="Catalog scope" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All listings</SelectItem>
                    <SelectItem value="seller">Seller listings only</SelectItem>
                    <SelectItem value="platform">Platform catalog only</SelectItem>
                  </SelectContent>
                </Select>
              )}
              <Select
                value={String(limit)}
                onValueChange={(value) => {
                  setLimit(Number(value));
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[120px]" title="Products per page">
                  <SelectValue placeholder="Per page" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="20">20 per page</SelectItem>
                  <SelectItem value="50">50 per page</SelectItem>
                  <SelectItem value="100">100 per page</SelectItem>
                  {!isSeller && (
                    <>
                      <SelectItem value="250">250 per page</SelectItem>
                      <SelectItem value="500">500 per page</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSelectedStatus('all');
                  setListingScope('all');
                  setPage(1);
                  setSearchParams((prev) => {
                    const p = new URLSearchParams(prev);
                    p.delete('created_by');
                    return p;
                  });
                }}
              >
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedProducts.length > 0 && (
        <div className="bg-secondary/50 border border-border rounded-lg p-3 flex items-center justify-between animate-fade-in">
          <span className="text-sm text-foreground">
            <strong>{selectedProducts.length}</strong> products selected
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">Update Stock</Button>
            <Button variant="outline" size="sm">Update Status</Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                // Handle bulk delete
                toast({
                  title: 'Bulk delete',
                  description: 'Bulk delete functionality coming soon',
                });
              }}
            >
              Delete Selected
            </Button>
          </div>
        </div>
      )}

      {/* Products Table */}
      <Card className="min-w-0 shadow-card">
        <CardContent className="min-w-0 p-0">
          {isLoading && !productsResponse ? (
            <div className="p-8 space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : isError ? (
            <div className="p-8 text-center">
              <p className="text-destructive">
                Error loading products: {error instanceof Error ? error.message : 'Unknown error'}
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => queryClient.invalidateQueries({ queryKey: ['products'] })}
              >
                Retry
              </Button>
            </div>
          ) : products.length === 0 ? (
            <div className="p-8 text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No products found</p>
              <Button variant="gradient" className="mt-4" onClick={handleAddProduct}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Product
              </Button>
            </div>
          ) : (
            <>
              {isFetching && productsResponse && (
                <div className="absolute top-0 right-0 p-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                </div>
              )}
          <div className="max-w-full overflow-x-auto">
            <table className="w-full min-w-max">
              <thead className="bg-secondary/50">
                <tr className="border-b border-border">
                  <th className="py-4 px-4 text-left">
                    <Checkbox
                          checked={selectedProducts.length === products.length && products.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </th>
                      <th className="py-4 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Product
                      </th>
                      <th className="py-4 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Division
                      </th>
                      <th className="py-4 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        HSN Code
                      </th>
                      <th className="py-4 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Brand / Company
                      </th>
                      <th className="py-4 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Category
                      </th>
                      <th className="py-4 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Unit / pack
                      </th>
                      {!isSeller && (
                        <th className="py-4 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                          Listed by
                        </th>
                      )}
                      <th className="py-4 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Price
                      </th>
                      <th className="py-4 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Discount %
                      </th>
                      <th className="py-4 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Stock
                      </th>
                      <th className="py-4 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Expiry
                      </th>
                      <th className="py-4 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Status
                      </th>
                      <th className="py-4 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Actions
                      </th>
                </tr>
              </thead>
              <tbody>
                    {products.map((product: any) => {
                      // Handle both camelCase and snake_case field names
                      const productId = product.id || product._id || product.product_id;
                      const imageUrls = getProductImageUrls(product);
                      const imageUrl = imageUrls[0];
                      const sellingPrice = product.sellingPrice || product.selling_price || 0;
                      const commissionCost = product.commissionCost ?? product.commission_cost ?? 0;
                      const finalSellingPrice = product.finalSellingPrice ?? product.final_selling_price ?? (Number(sellingPrice) + Number(commissionCost));
                      const mrp = product.mrp || product.mrp || 0;
                      const stockQuantity = product.stockQuantity || product.stock_quantity || 0;
                      const isFeatured = product.isFeatured || product.is_featured || false;
                      const isAvailable = product.isAvailable !== undefined ? product.isAvailable : (product.is_available !== undefined ? product.is_available : true);
                      const variants =
                        (Array.isArray(product.variants) && product.variants) ||
                        (Array.isArray(product.product_variants) && product.product_variants) ||
                        (Array.isArray(product.productVariants) && product.productVariants) ||
                        [];
                      const primaryVariant = variants[0];
                      const variantPackLine = formatVariantPackagingLine(primaryVariant);
                      const saleUnit = product.unit || 'piece';
                      const piecesPerUnit =
                        product.piecesPerSet ?? product.pieces_per_set ?? 1;

                      return (
                        <tr
                          key={productId}
                          className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors"
                        >
                    <td className="py-4 px-4">
                      <Checkbox
                        checked={selectedProducts.includes(productId)}
                        onCheckedChange={() => toggleSelectProduct(productId)}
                      />
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                              {imageUrl ? (
                                <div className="h-12 w-12 rounded-lg bg-secondary border border-border overflow-hidden flex items-center justify-center">
                        <img
                                    src={imageUrl}
                          alt={product.name}
                                    className="max-h-full max-w-full object-contain"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none';
                                      const parent = (e.target as HTMLImageElement).parentElement;
                                      if (parent) {
                                        parent.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"></rect><path d="M9 9h6v6H9z"></path></svg>';
                                        parent.className = 'h-12 w-12 rounded-lg bg-secondary flex items-center justify-center';
                                      }
                                    }}
                                  />
                                </div>
                              ) : (
                                <div className="h-12 w-12 rounded-lg bg-secondary border border-border flex items-center justify-center">
                                  <Package className="h-6 w-6 text-muted-foreground" />
                                </div>
                              )}
                        <div>
                          <p className="font-medium text-foreground">{product.name}</p>
                                {primaryVariant && (
                                  <p className="text-xs text-muted-foreground">
                                    {variantPackLine ? `${variantPackLine} · ` : ''}
                                    {primaryVariant.weight && `${primaryVariant.weight} · `}
                                    ₹{primaryVariant.specialPrice || primaryVariant.sellingPrice || primaryVariant.mrp}
                                  </p>
                                )}
                                {variants.length > 1 && (
                                  <p className="text-[11px] text-muted-foreground">
                                    {variants.length} variants
                                  </p>
                                )}
                                {imageUrls.length > 1 && (
                                  <p className="text-[11px] text-muted-foreground">
                                    {imageUrls.length} images
                                  </p>
                                )}
                                {isFeatured && (
                                  <Badge variant="secondary" className="mt-1 text-xs">
                                    Featured
                                  </Badge>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      {getDivisionBadge(product)}
                    </td>
                    <td className="py-4 px-4">
                            <span className="text-sm text-muted-foreground">
                              {getHsnCode(product)}
                            </span>
                    </td>
                    <td className="py-4 px-4">
                            <p className="font-medium text-foreground">
                              {product.brand?.name || '-'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {product.company?.name || '-'}
                            </p>
                          </td>
                          <td className="py-4 px-4 text-foreground">
                            {product.category?.name || '-'}
                    </td>
                    <td className="py-4 px-4 align-top">
                      <p className="text-sm font-medium capitalize">{saleUnit}</p>
                      {Number(piecesPerUnit) > 1 && (
                        <p className="text-xs text-muted-foreground">
                          {piecesPerUnit} pcs / {saleUnit}
                        </p>
                      )}
                      {variantPackLine && (
                        <p className="text-xs text-muted-foreground mt-1 max-w-[180px] break-words">
                          {variantPackLine}
                        </p>
                      )}
                    </td>
                    {!isSeller && (
                      <td className="py-4 px-4 text-sm">
                        {product.creator?.name ? (
                          <div className="space-y-1">
                            <p className="font-medium text-foreground">{product.creator.name}</p>
                            <p className="text-xs text-muted-foreground">{product.creator.email || '—'}</p>
                            {product.creator.role === 'seller' && (
                              <Badge variant="outline" className="text-[10px]">
                                Seller
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Platform</span>
                        )}
                      </td>
                    )}
                    <td className="py-4 px-4">
                            <p className="font-medium text-foreground">
                              {formatCurrency(parseFloat(finalSellingPrice.toString()))}
                            </p>
                            {!isSeller && Number(commissionCost) > 0 && (
                              <p className="text-xs text-muted-foreground">
                                Base: {formatCurrency(parseFloat(sellingPrice.toString()))} + Commission: {formatCurrency(parseFloat(commissionCost.toString()))}
                              </p>
                            )}
                            {parseFloat(mrp.toString()) > parseFloat(sellingPrice.toString()) && (
                              <p className="text-xs text-muted-foreground line-through">
                                {formatCurrency(parseFloat(mrp.toString()))}
                              </p>
                            )}
                    </td>
                    <td className="py-4 px-4">
                            {(() => {
                              const discountPercent = calculateDiscountPercent(
                                parseFloat(mrp.toString()),
                                parseFloat(sellingPrice.toString())
                              );
                              return discountPercent > 0 ? (
                                <span className="font-semibold text-emerald-600">
                                  {discountPercent}% OFF
                                </span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              );
                            })()}
                    </td>
                    <td className="py-4 px-4">
                            <span
                              className={`font-medium ${
                                stockQuantity === 0
                                  ? 'text-red-600'
                                  : stockQuantity < 50
                                  ? 'text-amber-600'
                                  : 'text-foreground'
                              }`}
                            >
                              {stockQuantity}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-muted-foreground text-sm">
                      {formatExpiry(product)}
                    </td>
                          <td className="py-4 px-4">{getStatusBadge(product)}</td>
                    <td className="py-4 px-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover">
                          <DropdownMenuItem onClick={() => handleViewDetails(product)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEdit(productId)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Product
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => handleDelete(productId)}
                                >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Product
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                      );
                    })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-sm text-muted-foreground">
              {pagination.total === 0 ? (
                'No products'
              ) : (
                <>
                  Showing <strong>{Math.min((page - 1) * limit + 1, pagination.total)}</strong> to{' '}
                  <strong>{Math.min(page * limit, pagination.total)}</strong> of{' '}
                  <strong>{pagination.total}</strong> products
                </>
              )}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || pagination.totalPages <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              {pagination.totalPages > 0 && (() => {
                const totalP = pagination.totalPages;
                const windowSize = 5;
                const half = Math.floor(windowSize / 2);
                let start = Math.max(1, page - half);
                let end = Math.min(totalP, start + windowSize - 1);
                if (end - start + 1 < windowSize) start = Math.max(1, end - windowSize + 1);
                const pages: number[] = [];
                for (let i = start; i <= end; i++) pages.push(i);
                return pages.map((pageNum) => (
                  <Button
                    key={pageNum}
                    variant={page === pageNum ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={() => setPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                ));
              })()}
              <Button
                variant="outline"
                size="sm"
                disabled={page >= pagination.totalPages || pagination.totalPages <= 1}
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Product Form Dialog */}
      <ProductForm
        open={isFormOpen}
        onOpenChange={handleFormClose}
        productId={editingProductId}
      />

      {/* View Product Details Dialog */}
      <Dialog
        open={!!viewingProduct}
        onOpenChange={(open) => {
          if (!open) {
            setViewingProduct(null);
            setViewingImageIndex(0);
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{viewingProduct?.name || 'Product details'}</DialogTitle>
            <DialogDescription>Read-only product information</DialogDescription>
          </DialogHeader>

          {viewingProduct && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Brand</p>
                  <p className="font-medium">{viewingProduct.brand?.name || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Company</p>
                  <p className="font-medium">{viewingProduct.company?.name || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Category</p>
                  <p className="font-medium">{viewingProduct.category?.name || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Division</p>
                  <p className="font-medium">
                    {viewingProduct?.division?.name ||
                      (viewingProduct?.division?.slug === 'kitchen' ? 'Kitchen' : 'Grocery')}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">MRP</p>
                  <p className="font-medium">{formatCurrency(Number(viewingProduct.mrp || 0))}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Selling Price</p>
                  <p className="font-medium">
                    {formatCurrency(Number(viewingProduct.sellingPrice || viewingProduct.selling_price || 0))}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Stock</p>
                  <p className="font-medium">{viewingProduct.stockQuantity || viewingProduct.stock_quantity || 0}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Expiry</p>
                  <p className="font-medium">{formatExpiry(viewingProduct)}</p>
                </div>
              </div>

              {getProductImageUrls(viewingProduct).length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Images ({getProductImageUrls(viewingProduct).length})
                  </p>

                  <div className="rounded-md border bg-muted/30 p-2 mb-2">
                    <img
                      src={getProductImageUrls(viewingProduct)[viewingImageIndex]}
                      alt={`Product image ${viewingImageIndex + 1}`}
                      className="w-full h-56 object-contain rounded bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-6 gap-2">
                    {getProductImageUrls(viewingProduct).map((url, idx) => {
                      const active = idx === viewingImageIndex;
                      return (
                        <button
                          key={`${url}-${idx}`}
                          type="button"
                          onClick={() => setViewingImageIndex(idx)}
                          className={`rounded border p-1 bg-white ${active ? 'border-primary ring-1 ring-primary' : 'border-border'}`}
                        >
                          <img
                            src={url}
                            alt={`Thumbnail ${idx + 1}`}
                            className="w-full h-14 object-contain rounded"
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingProductId} onOpenChange={() => setDeletingProductId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this product? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
