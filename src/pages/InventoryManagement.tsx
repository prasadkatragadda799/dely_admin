import { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  AlertTriangle,
  Package,
  Calendar,
  Loader2,
  Download,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { productsAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function InventoryManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const { toast } = useToast();

  // Fetch all products
  const {
    data: productsResponse,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['products', 'inventory'],
    queryFn: async () => {
      const response = await productsAPI.getProducts({ limit: 1000 });
      return response.data;
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const products = useMemo(() => {
    if (!productsResponse) return [];
    const responseData = (productsResponse as any).data;
    
    if (responseData?.items && Array.isArray(responseData.items)) {
      return responseData.items;
    }
    if (Array.isArray(responseData)) {
      return responseData;
    }
    if (responseData?.products && Array.isArray(responseData.products)) {
      return responseData.products;
    }
    return [];
  }, [productsResponse]);

  // Filter products with expiry dates and calculate alerts
  const inventoryData = useMemo(() => {
    const today = new Date();
    const twoMonthsFromNow = new Date();
    twoMonthsFromNow.setMonth(today.getMonth() + 2);

    return products
      .map((product: any) => {
        const expiryDate = product.expiryDate || product.expiry_date;
        if (!expiryDate) return null;

        const expiry = new Date(expiryDate);
        const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        let status: 'expired' | 'warning' | 'ok' = 'ok';
        if (daysUntilExpiry < 0) {
          status = 'expired';
        } else if (daysUntilExpiry <= 60) {
          status = 'warning';
        }

        return {
          ...product,
          expiryDate: expiryDate,
          daysUntilExpiry,
          status,
        };
      })
      .filter((item: any) => item !== null)
      .filter((item: any) => {
        if (filterStatus === 'all') return true;
        if (filterStatus === 'expired') return item.status === 'expired';
        if (filterStatus === 'warning') return item.status === 'warning';
        return true;
      })
      .filter((item: any) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
          item.name?.toLowerCase().includes(query) ||
          item.hsnCode?.toLowerCase().includes(query) ||
          item.hsn_code?.toLowerCase().includes(query)
        );
      })
      .sort((a: any, b: any) => a.daysUntilExpiry - b.daysUntilExpiry);
  }, [products, filterStatus, searchQuery]);

  const stats = useMemo(() => {
    const expired = inventoryData.filter((item: any) => item.status === 'expired').length;
    const warning = inventoryData.filter((item: any) => item.status === 'warning').length;
    const ok = inventoryData.filter((item: any) => item.status === 'ok').length;
    return { expired, warning, ok, total: inventoryData.length };
  }, [inventoryData]);

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: string, daysUntilExpiry: number) => {
    if (status === 'expired') {
      return <Badge variant="destructive">Expired</Badge>;
    }
    if (status === 'warning') {
      return <Badge variant="outline" className="border-amber-500 text-amber-600">Expiring Soon ({daysUntilExpiry} days)</Badge>;
    }
    return <Badge variant="secondary">OK</Badge>;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Inventory & Expiry Management</h1>
          <p className="text-muted-foreground">Monitor product expiry dates and inventory alerts</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">{stats.expired}</p>
                )}
                <p className="text-xs text-muted-foreground">Expired Products</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">{stats.warning}</p>
                )}
                <p className="text-xs text-muted-foreground">Expiring Soon (&lt;2 months)</p>
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
                  <p className="text-2xl font-bold text-foreground">{stats.ok}</p>
                )}
                <p className="text-xs text-muted-foreground">OK</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                )}
                <p className="text-xs text-muted-foreground">Total with Expiry</p>
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
                placeholder="Search by product name or HSN code..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="warning">Expiring Soon</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  setSearchQuery('');
                  setFilterStatus('all');
                }}
              >
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Product Expiry Status</CardTitle>
          <CardDescription>
            Products with expiry dates. Alerts shown for items expiring within 2 months.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : isError ? (
            <div className="p-8 text-center">
              <p className="text-destructive">
                Error loading inventory: {error instanceof Error ? error.message : 'Unknown error'}
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => refetch()}
              >
                Retry
              </Button>
            </div>
          ) : inventoryData.length === 0 ? (
            <div className="p-8 text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchQuery || filterStatus !== 'all'
                  ? 'No products found matching your filters'
                  : 'No products with expiry dates found'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product Name</TableHead>
                    <TableHead>HSN Code</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>Days Until Expiry</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventoryData.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.hsnCode || item.hsn_code || '-'}</TableCell>
                      <TableCell>{item.stockQuantity || item.stock_quantity || 0}</TableCell>
                      <TableCell>{formatDate(item.expiryDate)}</TableCell>
                      <TableCell>
                        {item.daysUntilExpiry < 0 ? (
                          <span className="text-red-600 font-semibold">
                            Expired {Math.abs(item.daysUntilExpiry)} days ago
                          </span>
                        ) : (
                          <span>{item.daysUntilExpiry} days</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(item.status, item.daysUntilExpiry)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
