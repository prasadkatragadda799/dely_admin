import { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye,
  Download,
  Upload,
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
import { productsAPI, categoriesAPI } from '@/lib/api';
import { ProductForm } from '@/components/admin/ProductForm';
import { useToast } from '@/hooks/use-toast';
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
import { Skeleton } from '@/components/ui/skeleton';

interface Category {
  id: string;
  name: string;
  slug: string;
  children?: Category[];
}

export default function Products() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | undefined>();
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const limit = 20;

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch categories for filter
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await categoriesAPI.getCategories();
      return response.data || [];
    },
  });

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
    } else if (selectedStatus === 'out_of_stock') {
      filterParams.stock_status = 'out_of_stock';
    }

    return filterParams;
  }, [searchQuery, selectedCategory, selectedStatus, page, limit]);

  // Fetch products
  const {
    data: productsData,
    isLoading,
    isError,
    error,
    isFetching,
  } = useQuery({
    queryKey: ['products', filters],
    queryFn: async () => {
      const response = await productsAPI.getProducts(filters);
      return response.data;
    },
    // Use placeholderData instead of deprecated keepPreviousData for React Query v5
    placeholderData: (previousData) => previousData,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  const products = productsData?.items || [];
  const pagination = productsData?.pagination || {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  };

  // Delete product mutation
  const deleteMutation = useMutation({
    mutationFn: (productId: string) => productsAPI.deleteProduct(productId),
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
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getStatusBadge = (product: any) => {
    const stock = product.stockQuantity || 0;
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

  // Calculate stats from products
  const stats = useMemo(() => {
    const total = pagination.total;
    const inStock = products.filter((p: any) => (p.stockQuantity || 0) > 0 && p.isAvailable).length;
    const lowStock = products.filter((p: any) => (p.stockQuantity || 0) > 0 && (p.stockQuantity || 0) < 50).length;
    const outOfStock = products.filter((p: any) => (p.stockQuantity || 0) === 0).length;
    return { total, inStock, lowStock, outOfStock };
  }, [products, pagination]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Products</h1>
          <p className="text-muted-foreground">Manage your product catalog</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
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

      {/* Filters */}
      <Card className="shadow-card">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products by name, brand, or company..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1); // Reset to first page on search
                }}
              />
            </div>
            <div className="flex gap-3">
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
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSelectedStatus('all');
                  setPage(1);
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
      <Card className="shadow-card">
        <CardContent className="p-0">
          {isLoading && !productsData ? (
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
              {isFetching && productsData && (
                <div className="absolute top-0 right-0 p-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full">
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
                        Brand / Company
                      </th>
                      <th className="py-4 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Category
                      </th>
                      <th className="py-4 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Price
                      </th>
                      <th className="py-4 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Stock
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
                      const primaryImage = product.images?.find((img: any) => img.isPrimary) || product.images?.[0];
                      return (
                        <tr
                          key={product.id}
                          className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors"
                        >
                          <td className="py-4 px-4">
                            <Checkbox
                              checked={selectedProducts.includes(product.id)}
                              onCheckedChange={() => toggleSelectProduct(product.id)}
                            />
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              {primaryImage ? (
                                <img
                                  src={primaryImage.url}
                                  alt={product.name}
                                  className="h-12 w-12 rounded-lg object-cover bg-secondary"
                                />
                              ) : (
                                <div className="h-12 w-12 rounded-lg bg-secondary flex items-center justify-center">
                                  <Package className="h-6 w-6 text-muted-foreground" />
                                </div>
                              )}
                              <div>
                                <p className="font-medium text-foreground">{product.name}</p>
                                {product.isFeatured && (
                                  <Badge variant="secondary" className="mt-1 text-xs">
                                    Featured
                                  </Badge>
                                )}
                              </div>
                            </div>
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
                          <td className="py-4 px-4">
                            <p className="font-medium text-foreground">
                              {formatCurrency(product.sellingPrice || 0)}
                            </p>
                            {product.mrp > product.sellingPrice && (
                              <p className="text-xs text-muted-foreground line-through">
                                {formatCurrency(product.mrp || 0)}
                              </p>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            <span
                              className={`font-medium ${
                                (product.stockQuantity || 0) === 0
                                  ? 'text-red-600'
                                  : (product.stockQuantity || 0) < 50
                                  ? 'text-amber-600'
                                  : 'text-foreground'
                              }`}
                            >
                              {product.stockQuantity || 0}
                            </span>
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
                                <DropdownMenuItem>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEdit(product.id)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Product
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => handleDelete(product.id)}
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
                  Showing <strong>{(page - 1) * limit + 1}</strong> to{' '}
                  <strong>{Math.min(page * limit, pagination.total)}</strong> of{' '}
                  <strong>{pagination.total}</strong> products
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <Button
                        key={pageNum}
                        variant={page === pageNum ? 'secondary' : 'outline'}
                        size="sm"
                        onClick={() => setPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= pagination.totalPages}
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
