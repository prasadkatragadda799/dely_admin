import { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  Eye,
  Download,
  Printer,
  Clock,
  CheckCircle2,
  Truck,
  Package,
  XCircle,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export default function Orders() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedDateRange, setSelectedDateRange] = useState<string>('all');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<string>('');
  const [statusNotes, setStatusNotes] = useState('');
  const limit = 20;

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Build filters
  const filters = useMemo(() => {
    const filterParams: any = {
      page,
      limit,
    };

    if (searchQuery) {
      filterParams.search = searchQuery;
    }

    if (activeTab !== 'all') {
      filterParams.status = activeTab;
    }

    if (selectedPaymentMethod && selectedPaymentMethod !== 'all') {
      filterParams.paymentMethod = selectedPaymentMethod;
    }

    // Date range handling
    if (selectedDateRange !== 'all') {
      const now = new Date();
      let dateFrom: Date;
      
      switch (selectedDateRange) {
        case 'today':
          dateFrom = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'week':
          dateFrom = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          dateFrom = new Date(now.setMonth(now.getMonth() - 1));
          break;
        default:
          dateFrom = new Date(0);
      }
      
      filterParams.dateFrom = dateFrom.toISOString().split('T')[0];
      filterParams.dateTo = new Date().toISOString().split('T')[0];
    }

    return filterParams;
  }, [searchQuery, activeTab, selectedDateRange, selectedPaymentMethod, page, limit]);

  // Fetch orders
  const {
    data: ordersResponse,
    isLoading,
    isError,
    error,
    isFetching,
  } = useQuery({
    queryKey: ['orders', filters],
    queryFn: async () => {
      const response = await ordersAPI.getOrders(filters);
      
      // Handle different response structures
      if (response) {
        const responseData = response.data as any;
        
        // Case 1: Response has data.items (paginated structure)
        if (responseData && responseData.items && Array.isArray(responseData.items)) {
          return responseData;
        }
        
        // Case 2: Response.data is an array directly
        if (responseData && Array.isArray(responseData)) {
          return {
            items: responseData,
            pagination: {
              page: filters.page || 1,
              limit: filters.limit || 20,
              total: responseData.length,
              totalPages: Math.ceil(responseData.length / (filters.limit || 20)),
            },
          };
        }
        
        // Case 3: Response has orders array
        if (responseData && responseData.orders && Array.isArray(responseData.orders)) {
          return {
            items: responseData.orders,
            pagination: {
              page: responseData.page || filters.page || 1,
              limit: responseData.limit || filters.limit || 20,
              total: responseData.total || responseData.orders.length,
              totalPages: responseData.totalPages || Math.ceil((responseData.total || responseData.orders.length) / (responseData.limit || filters.limit || 20)),
            },
          };
        }
      }
      
      // Fallback
      return {
        items: [],
        pagination: {
          page: filters.page || 1,
          limit: filters.limit || 20,
          total: 0,
          totalPages: 1,
        },
      };
    },
    placeholderData: (previousData) => previousData,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const orders = ordersResponse?.items || [];
  const pagination = ordersResponse?.pagination || {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  };

  // Update order status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status, notes }: { orderId: string; status: string; notes?: string }) =>
      ordersAPI.updateOrderStatus(orderId, status, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast({
        title: 'Order status updated',
        description: 'Order status has been updated successfully',
      });
      setUpdatingOrderId(null);
      setNewStatus('');
      setStatusNotes('');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error?.message || 'Failed to update order status',
        variant: 'destructive',
      });
      setUpdatingOrderId(null);
    },
  });

  // Cancel order mutation
  const cancelOrderMutation = useMutation({
    mutationFn: ({ orderId, reason }: { orderId: string; reason: string }) =>
      ordersAPI.cancelOrder(orderId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast({
        title: 'Order cancelled',
        description: 'Order has been cancelled successfully',
      });
      setCancellingOrderId(null);
      setCancelReason('');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error?.message || 'Failed to cancel order',
        variant: 'destructive',
      });
      setCancellingOrderId(null);
    },
  });

  // Calculate stats from orders data
  const stats = useMemo(() => {
    const all = pagination.total || orders.length;
    const pending = orders.filter((o: any) => {
      const status = o.status || o.order_status || 'pending';
      return status === 'pending';
    }).length;
    const confirmed = orders.filter((o: any) => {
      const status = o.status || o.order_status || 'pending';
      return status === 'confirmed' || status === 'processing';
    }).length;
    const shipped = orders.filter((o: any) => {
      const status = o.status || o.order_status || 'pending';
      return status === 'shipped' || status === 'out_for_delivery';
    }).length;
    const delivered = orders.filter((o: any) => {
      const status = o.status || o.order_status || 'pending';
      return status === 'delivered' || status === 'completed';
    }).length;
    const cancelled = orders.filter((o: any) => {
      const status = o.status || o.order_status || 'pending';
      return status === 'cancelled' || status === 'canceled';
    }).length;

    return { all, pending, confirmed, shipped, delivered, cancelled };
  }, [orders, pagination]);

  const orderStats = [
    { label: 'All Orders', value: stats.all, icon: Package, color: 'bg-blue-100 text-blue-600' },
    { label: 'Pending', value: stats.pending, icon: Clock, color: 'bg-amber-100 text-amber-600' },
    { label: 'Confirmed', value: stats.confirmed, icon: CheckCircle2, color: 'bg-indigo-100 text-indigo-600' },
    { label: 'Shipped', value: stats.shipped, icon: Truck, color: 'bg-cyan-100 text-cyan-600' },
    { label: 'Delivered', value: stats.delivered, icon: CheckCircle2, color: 'bg-emerald-100 text-emerald-600' },
    { label: 'Cancelled', value: stats.cancelled, icon: XCircle, color: 'bg-red-100 text-red-600' },
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: 'pending',
      confirmed: 'confirmed',
      processing: 'processing',
      shipped: 'shipped',
      out_for_delivery: 'shipped',
      delivered: 'delivered',
      completed: 'delivered',
      cancelled: 'cancelled',
      canceled: 'cancelled',
    };
    return <Badge variant={variants[status] || 'pending'}>{status || 'pending'}</Badge>;
  };

  const formatDate = (dateString: string | Date) => {
    if (!dateString || dateString === '-') return '-';
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleViewDetails = (orderId: string) => {
    // TODO: Implement order detail view/modal
    toast({
      title: 'View Order',
      description: 'Order detail view coming soon',
    });
  };

  const handleUpdateStatus = (orderId: string) => {
    setUpdatingOrderId(orderId);
    const order = orders.find((o: any) => o.id === orderId);
    setNewStatus(order?.status || order?.order_status || 'pending');
  };

  const confirmUpdateStatus = () => {
    if (updatingOrderId && newStatus) {
      updateStatusMutation.mutate({
        orderId: updatingOrderId,
        status: newStatus,
        notes: statusNotes || undefined,
      });
    }
  };

  const handleCancelOrder = (orderId: string) => {
    setCancellingOrderId(orderId);
  };

  const confirmCancel = () => {
    if (cancellingOrderId && cancelReason) {
      cancelOrderMutation.mutate({
        orderId: cancellingOrderId,
        reason: cancelReason,
      });
    }
  };

  const handlePrintInvoice = async (orderId: string) => {
    try {
      const blob = await ordersAPI.getInvoice(orderId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${orderId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast({
        title: 'Invoice downloaded',
        description: 'Invoice has been downloaded successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error?.message || 'Failed to download invoice',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Orders</h1>
          <p className="text-muted-foreground">Manage and track customer orders</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {orderStats.map((stat, index) => (
          <Card key={index} className="shadow-card hover:shadow-card-hover transition-shadow cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${stat.color}`}>
                  <stat.icon className="h-4 w-4" />
                </div>
                <div>
                  {isLoading && !ordersResponse ? (
                    <Skeleton className="h-6 w-12" />
                  ) : (
                    <p className="text-xl font-bold text-foreground">{stat.value}</p>
                  )}
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters and Search */}
      <Card className="shadow-card">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by order ID, customer name, or business..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div className="flex gap-3">
              <Select 
                value={selectedDateRange} 
                onValueChange={(value) => {
                  setSelectedDateRange(value);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
              <Select 
                value={selectedPaymentMethod} 
                onValueChange={(value) => {
                  setSelectedPaymentMethod(value);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Payment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payments</SelectItem>
                  <SelectItem value="credit">Credit</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank">Bank Transfer</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedDateRange('all');
                  setSelectedPaymentMethod('all');
                  setPage(1);
                }}
              >
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table with Tabs */}
      <Card className="shadow-card">
        <Tabs value={activeTab} onValueChange={(value) => {
          setActiveTab(value);
          setPage(1);
        }}>
          <div className="border-b border-border px-4">
            <TabsList className="h-12 bg-transparent p-0 gap-6">
              <TabsTrigger 
                value="all" 
                className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0"
              >
                All Orders
              </TabsTrigger>
              <TabsTrigger 
                value="pending"
                className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0"
              >
                Pending
              </TabsTrigger>
              <TabsTrigger 
                value="confirmed"
                className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0"
              >
                Confirmed
              </TabsTrigger>
              <TabsTrigger 
                value="shipped"
                className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0"
              >
                Shipped
              </TabsTrigger>
              <TabsTrigger 
                value="delivered"
                className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0"
              >
                Delivered
              </TabsTrigger>
              <TabsTrigger 
                value="cancelled"
                className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0"
              >
                Cancelled
              </TabsTrigger>
            </TabsList>
          </div>

          <CardContent className="p-0">
            {isLoading && !ordersResponse ? (
              <div className="p-8 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : isError ? (
              <div className="p-8 text-center">
                <p className="text-destructive">
                  Error loading orders: {error instanceof Error ? error.message : 'Unknown error'}
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => queryClient.invalidateQueries({ queryKey: ['orders'] })}
                >
                  Retry
                </Button>
              </div>
            ) : orders.length === 0 ? (
              <div className="p-8 text-center">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No orders found</p>
              </div>
            ) : (
              <>
                {isFetching && ordersResponse && (
                  <div className="absolute top-0 right-0 p-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  </div>
                )}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-secondary/50">
                      <tr className="border-b border-border">
                        <th className="py-4 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Order ID</th>
                        <th className="py-4 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Customer</th>
                        <th className="py-4 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Items</th>
                        <th className="py-4 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Amount</th>
                        <th className="py-4 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Payment</th>
                        <th className="py-4 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                        <th className="py-4 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Order Date</th>
                        <th className="py-4 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Delivery</th>
                        <th className="py-4 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order: any) => {
                        // Handle both camelCase and snake_case field names
                        const orderId = order.id || order.orderId || order.order_id;
                        const orderNumber = order.orderNumber || order.order_number || orderId;
                        const customerName = order.customer?.name || order.customerName || order.customer_name || 'Unknown';
                        const businessName = order.customer?.businessName || order.businessName || order.business_name || order.customer?.companyName || '-';
                        const itemsCount = order.itemsCount || order.items_count || order.items?.length || 0;
                        const totalAmount = order.totalAmount || order.total_amount || order.total || order.amount || 0;
                        const paymentMethod = order.paymentMethod || order.payment_method || order.payment?.method || 'Unknown';
                        const status = order.status || order.order_status || 'pending';
                        const orderDate = order.createdAt || order.created_at || order.orderDate || order.order_date;
                        const deliveryDate = order.deliveryDate || order.delivery_date || order.expectedDeliveryDate || order.expected_delivery_date;

                        return (
                          <tr key={orderId} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                            <td className="py-4 px-4">
                              <span className="font-semibold text-primary">{orderNumber}</span>
                            </td>
                            <td className="py-4 px-4">
                              <p className="font-medium text-foreground">{customerName}</p>
                              <p className="text-sm text-muted-foreground">{businessName}</p>
                            </td>
                            <td className="py-4 px-4 text-foreground">{itemsCount} items</td>
                            <td className="py-4 px-4 font-semibold text-foreground">{formatCurrency(parseFloat(totalAmount.toString()))}</td>
                            <td className="py-4 px-4">
                              <span className="text-sm text-muted-foreground">{paymentMethod}</span>
                            </td>
                            <td className="py-4 px-4">
                              {getStatusBadge(status)}
                            </td>
                            <td className="py-4 px-4 text-muted-foreground text-sm">{formatDate(orderDate)}</td>
                            <td className="py-4 px-4 text-muted-foreground text-sm">{formatDate(deliveryDate)}</td>
                            <td className="py-4 px-4">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-popover">
                                  <DropdownMenuItem onClick={() => handleViewDetails(orderId)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  {status !== 'cancelled' && status !== 'canceled' && status !== 'delivered' && status !== 'completed' && (
                                    <DropdownMenuItem onClick={() => handleUpdateStatus(orderId)}>
                                      <CheckCircle2 className="h-4 w-4 mr-2" />
                                      Update Status
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem onClick={() => handlePrintInvoice(orderId)}>
                                    <Printer className="h-4 w-4 mr-2" />
                                    Print Invoice
                                  </DropdownMenuItem>
                                  {status !== 'cancelled' && status !== 'canceled' && status !== 'delivered' && status !== 'completed' && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem 
                                        className="text-destructive focus:text-destructive"
                                        onClick={() => handleCancelOrder(orderId)}
                                      >
                                        <XCircle className="h-4 w-4 mr-2" />
                                        Cancel Order
                                      </DropdownMenuItem>
                                    </>
                                  )}
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
                    <strong>{pagination.total}</strong> orders
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
        </Tabs>
      </Card>

      {/* Update Status Dialog */}
      <AlertDialog open={!!updatingOrderId} onOpenChange={() => {
        if (!updateStatusMutation.isPending) {
          setUpdatingOrderId(null);
          setNewStatus('');
          setStatusNotes('');
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update Order Status</AlertDialogTitle>
            <AlertDialogDescription>
              Update the status of this order
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Textarea
                placeholder="Add any notes about this status update..."
                rows={3}
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={updateStatusMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmUpdateStatus}
              disabled={!newStatus || updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Status'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Order Dialog */}
      <AlertDialog open={!!cancellingOrderId} onOpenChange={() => {
        if (!cancelOrderMutation.isPending) {
          setCancellingOrderId(null);
          setCancelReason('');
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this order? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Reason *</Label>
              <Textarea
                placeholder="Enter reason for cancellation..."
                rows={4}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                required
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelOrderMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCancel}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={!cancelReason || cancelOrderMutation.isPending}
            >
              {cancelOrderMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                'Cancel Order'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
