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
import { adminDeliveryAPI, ordersAPI } from '@/lib/api';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select as AssignSelect,
  SelectContent as AssignSelectContent,
  SelectItem as AssignSelectItem,
  SelectTrigger as AssignSelectTrigger,
  SelectValue as AssignSelectValue,
} from '@/components/ui/select';

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
  const [invoiceOrder, setInvoiceOrder] = useState<any | null>(null);
  const [isInvoiceLoading, setIsInvoiceLoading] = useState(false);
  const [assignOrderId, setAssignOrderId] = useState<string | null>(null);
  const [selectedDeliveryPersonId, setSelectedDeliveryPersonId] = useState<string>('');
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
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

  // Calculate stats: total from pagination, status counts from current page orders
  const stats = useMemo(() => {
    const all = pagination.total ?? 0;
    const list = orders ?? [];
    const pending = list.filter((o: any) => {
      const status = o.status || o.order_status || 'pending';
      return status === 'pending';
    }).length;
    const confirmed = list.filter((o: any) => {
      const status = o.status || o.order_status || 'pending';
      return status === 'confirmed' || status === 'processing';
    }).length;
    const shipped = list.filter((o: any) => {
      const status = o.status || o.order_status || 'pending';
      return status === 'shipped' || status === 'out_for_delivery';
    }).length;
    const delivered = list.filter((o: any) => {
      const status = o.status || o.order_status || 'pending';
      return status === 'delivered' || status === 'completed';
    }).length;
    const cancelled = list.filter((o: any) => {
      const status = o.status || o.order_status || 'pending';
      return status === 'cancelled' || status === 'canceled';
    }).length;

    return { all, pending, confirmed, shipped, delivered, cancelled };
  }, [orders, pagination.total]);

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

  // Fetch delivery persons for assignment (available + online)
  const { data: deliveryPersonsResp, isLoading: isLoadingDeliveryPersons } = useQuery({
    queryKey: ['delivery-persons-assign'],
    queryFn: async () => {
      const resp = await adminDeliveryAPI.getDeliveryPersons({
        page: 1,
        limit: 200,
        is_online: true,
      });
      return resp.data;
    },
    enabled: isAssignDialogOpen,
  });

  const deliveryPersons = deliveryPersonsResp?.items || [];

  const assignMutation = useMutation({
    mutationFn: async () => {
      if (!assignOrderId || !selectedDeliveryPersonId) {
        throw new Error('Select a delivery person');
      }
      return await adminDeliveryAPI.assignOrder({
        orderId: assignOrderId,
        deliveryPersonId: selectedDeliveryPersonId,
      });
    },
    onSuccess: () => {
      toast({ title: 'Assigned', description: 'Order assigned to delivery person' });
      setIsAssignDialogOpen(false);
      setAssignOrderId(null);
      setSelectedDeliveryPersonId('');
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (e: any) => {
      toast({
        title: 'Error',
        description: e?.response?.data?.message || e.message || 'Failed to assign order',
        variant: 'destructive',
      });
    },
  });

  const openAssignDialog = (orderId: string) => {
    setAssignOrderId(orderId);
    setSelectedDeliveryPersonId('');
    setIsAssignDialogOpen(true);
  };

  const handleViewInvoice = async (order: any) => {
    const orderId = order?.id || order?.order_id;
    if (!orderId) {
      toast({
        title: 'Error',
        description: 'Order ID is required to view invoice',
        variant: 'destructive',
      });
      return;
    }
    try {
      setIsInvoiceLoading(true);
      const response = await ordersAPI.getInvoiceData(orderId);
      setInvoiceOrder(response?.data || order);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to load invoice data',
        variant: 'destructive',
      });
      setInvoiceOrder(order);
    } finally {
      setIsInvoiceLoading(false);
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
                      {(orders ?? []).map((order: any) => {
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
                                  <DropdownMenuItem onClick={() => handleViewInvoice(order)} disabled={isInvoiceLoading}>
                              <Printer className="h-4 w-4 mr-2" />
                                    View Invoice
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handlePrintInvoice(orderId)}>
                                    <Download className="h-4 w-4 mr-2" />
                                    Download Invoice PDF
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => openAssignDialog(orderId)}>
                                    <Truck className="h-4 w-4 mr-2" />
                                    Assign Delivery Person
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

      {/* Invoice Dialog */}
      <Dialog open={!!invoiceOrder} onOpenChange={(open) => !open && setInvoiceOrder(null)}>
        <DialogContent className="max-w-5xl p-0 bg-white text-black">
          <DialogHeader className="px-6 pt-4 pb-2 border-b">
            <DialogTitle className="text-lg font-semibold">Invoice</DialogTitle>
          </DialogHeader>
          {/* Udaan-style invoice layout */}
          <div className="p-6 space-y-4 text-xs leading-relaxed">
            {/* Extract order data - Standardized format handler */}
            {(() => {
              const order = invoiceOrder || {};
              
              // Helper function to safely extract nested values with fallbacks
              const getValue = (obj: any, ...paths: string[]) => {
                for (const path of paths) {
                  const keys = path.split('.');
                  let value = obj;
                  for (const key of keys) {
                    if (value && typeof value === 'object' && key in value) {
                      value = value[key];
                    } else {
                      value = undefined;
                      break;
                    }
                  }
                  if (value !== undefined && value !== null) return value;
                }
                return undefined;
              };
              
              // Extract order metadata
              const orderNumber = order.orderNumber || order.order_number || order.id || 'ODAG79ZY2WMXK7';
              const shipmentNumber = order.shipmentNumber || order.shipment_number || order.trackingNumber || order.tracking_number || 'SGHA175KPR4FYJ';
              const invoiceDate = order.invoiceDate 
                ? new Date(order.invoiceDate).toISOString().split('T')[0]
                : order.invoice_date
                ? new Date(order.invoice_date).toISOString().split('T')[0]
                : order.createdAt 
                ? new Date(order.createdAt).toISOString().split('T')[0]
                : order.created_at
                ? new Date(order.created_at).toISOString().split('T')[0]
                : order.deliveryDate 
                ? new Date(order.deliveryDate).toISOString().split('T')[0]
                : '2024-04-01';
              
              // Extract customer info with multiple fallback paths
              const customerName = getValue(order, 'customerName', 'customer.name', 'user.name', 'customerName') || 'MANISH JAISWAL';
              const customerAddress = getValue(order, 'customerAddress', 'customer.address', 'shippingAddress.address', 'shipping_address.address') || 'mudarkpur, Purani basti Road ways';
              const customerCity = getValue(order, 'customerCity', 'customer.city', 'shippingCity', 'shipping_city', 'shippingAddress.city', 'shipping_address.city') || 'Azamgarh';
              const customerState = getValue(order, 'customerState', 'customer.state', 'shippingState', 'shipping_state', 'shippingAddress.state', 'shipping_address.state') || 'Uttar Pradesh';
              const customerPincode = getValue(order, 'customerPincode', 'customer.pincode', 'shippingPincode', 'shipping_pincode', 'shippingAddress.pincode', 'shipping_address.pincode') || '276404';
              const customerMobile = getValue(order, 'customerMobile', 'customer.mobile', 'customer.phone', 'shippingPhone', 'shipping_phone', 'shippingAddress.phone', 'shipping_address.phone') || '+91 9876543210';
              const customerStateCode = getValue(order, 'customerStateCode', 'customer.stateCode', 'customer.state_code', 'stateCode', 'state_code', 'shippingAddress.stateCode', 'shipping_address.state_code') || '09';
              
              // Extract order items - support multiple array names
              const orderItems = order.items || order.orderItems || order.products || [];
              const hasItems = orderItems.length > 0;
              
              // Calculate totals with fallbacks
              const totalAmount = order.totalAmount || order.total_amount || order.total || order.grandTotal || order.grand_total || 2197.32;
              const totalQty = hasItems 
                ? orderItems.reduce((sum: number, item: any) => sum + (item.quantity || item.qty || 1), 0)
                : 1;
              
              return (
                <>
                  {/* Top section with QR + meta */}
                  <div className="flex justify-between gap-6">
                    <div className="w-32 h-32 border border-gray-300 flex items-center justify-center bg-white p-1">
                      <img 
                        src="/qr.png" 
                        alt="QR Code" 
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-x-6 gap-y-1 text-[11px]">
                      <div>
                        <p className="font-semibold uppercase">Bill of Supply</p>
                        <p>Order No : {orderNumber}</p>
                        <p>Shipment No : {shipmentNumber}</p>
                        <p>Invoice Date : {invoiceDate}</p>
                        <p>Place of Supply : {customerState.toUpperCase()}</p>
                        <p>Supply Type : INTRASTATE</p>
                        <p>Page No : 1 / 1</p>
                      </div>
                      <div>
                        <p className="font-semibold">Bill From:</p>
                        <p>GRANARY WHOLESALE PRIVATE LIMITED</p>
                        <p>No 331, Sarai Jagarnath, pargana - Nizamabad, Tehsil</p>
                        <p>- Sadar, Janpad & Dist - Azamgarh, purwanchal</p>
                        <p>paudhshala</p>
                        <p>Azamgarh, Uttar Pradesh - 276207</p>
                        <p>GSTIN: 09AAHCG7552R1ZP</p>
                        <p>FSSAI: 10019043002791</p>
                        <p className="text-[10px]">https://foscos.fssai.gov.in/</p>
                      </div>
                    </div>
                    <div className="w-60 text-[11px]">
                      <p className="font-semibold">Bill To:</p>
                      <p>{customerName.toUpperCase()}</p>
                      <p>{customerAddress}</p>
                      <p>{customerCity}</p>
                      <p>{customerCity}, {customerState} - {customerPincode}</p>
                      <p className="mt-1">Mobile: {customerMobile}</p>
                      <p>State Code: {customerStateCode}</p>
                    </div>
                  </div>

                  {/* Items table */}
                  <div className="border border-black mt-2">
                    <div className="border-b border-black bg-gray-100 px-3 py-2 font-semibold text-[11px]">
                      Description
                    </div>
                    <div className="grid grid-cols-[2fr,0.7fr,0.7fr,0.7fr,0.4fr,0.8fr,0.5fr,0.5fr,0.8fr] text-[10px] border-b border-black bg-gray-100">
                      <div className="px-2 py-1 border-r border-black"> </div>
                      <div className="px-2 py-1 border-r border-black text-right">Original Rate</div>
                      <div className="px-2 py-1 border-r border-black text-right">Unit Discount</div>
                      <div className="px-2 py-1 border-r border-black text-right">Rate</div>
                      <div className="px-2 py-1 border-r border-black text-right">Qty</div>
                      <div className="px-2 py-1 border-r border-black text-right">Taxable Amt.</div>
                      <div className="px-2 py-1 border-r border-black text-right">SGST</div>
                      <div className="px-2 py-1 border-r border-black text-right">CGST</div>
                      <div className="px-2 py-1 text-right">Total Amt.</div>
                    </div>
                    {hasItems ? (
                      orderItems.map((item: any, index: number) => {
                        // Extract product information with comprehensive fallbacks
                        const productName = item.productName || item.product_name || item.product?.name || item.name || 'Product';
                        const productDescription = item.productDescription || item.product_description || item.product?.description || '';
                        
                        // HSN Code extraction - CRITICAL: Must be present (priority order)
                        const hsnCode = item.hsnCode || item.hsn_code || 
                                       item.product?.hsnCode || item.product?.hsn_code || 
                                       item.variant?.hsnCode || item.variant?.hsn_code || 
                                       '07139090'; // Fallback only if absolutely not found
                        
                        // Pricing information
                        const mrp = item.mrp || item.originalPrice || item.original_price || item.product?.mrp || 0;
                        const sellingPrice = item.sellingPrice || item.selling_price || item.price || item.product?.sellingPrice || item.product?.selling_price || 0;
                        const discount = Math.max(0, mrp - sellingPrice);
                        
                        // Quantity and unit information
                        const quantity = item.quantity || item.qty || 1;
                        const unit = item.unit || item.product?.unit || 'EACH';
                        const setPieces = item.setPieces || item.set_pieces || item.variant?.setPieces || item.variant?.set_pieces || item.product?.piecesPerSet || item.product?.pieces_per_set || 1;
                        
                        // Tax calculation (use provided amounts or calculate)
                        const taxableAmount = item.taxableAmount || item.taxable_amount || (sellingPrice * quantity);
                        const cgstRate = item.cgstRate || item.cgst_rate || item.product?.cgstRate || item.product?.cgst_rate || 0;
                        const sgstRate = item.sgstRate || item.sgst_rate || item.product?.sgstRate || item.product?.sgst_rate || 0;
                        const cgstAmount = item.cgstAmount || item.cgst_amount || (taxableAmount * cgstRate) / 100;
                        const sgstAmount = item.sgstAmount || item.sgst_amount || (taxableAmount * sgstRate) / 100;
                        const itemTotalAmount = item.totalAmount || item.total_amount || (taxableAmount + cgstAmount + sgstAmount);
                        
                        return (
                          <div key={index} className="grid grid-cols-[2fr,0.7fr,0.7fr,0.7fr,0.4fr,0.8fr,0.5fr,0.5fr,0.8fr] text-[10px] border-b border-black">
                            <div className="px-2 py-2 border-r border-black">
                              {productName}
                              {productDescription && `: ${productDescription}`}
                              <br />
                              {unit} (Set of {setPieces}), HSN: {hsnCode}, CGST@ {cgstRate.toFixed(1)}%, SGST@ {sgstRate.toFixed(1)}%
                              <br />
                              <span className="font-semibold">HSN Code: {hsnCode}</span>
                            </div>
                            <div className="px-2 py-2 border-r border-black text-right">{mrp.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                            <div className="px-2 py-2 border-r border-black text-right">{discount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                            <div className="px-2 py-2 border-r border-black text-right">{sellingPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                            <div className="px-2 py-2 border-r border-black text-right">{quantity.toFixed(1)}</div>
                            <div className="px-2 py-2 border-r border-black text-right">{taxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                            <div className="px-2 py-2 border-r border-black text-right">{sgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                            <div className="px-2 py-2 border-r border-black text-right">{cgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                            <div className="px-2 py-2 text-right">{itemTotalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="grid grid-cols-[2fr,0.7fr,0.7fr,0.7fr,0.4fr,0.8fr,0.5fr,0.5fr,0.8fr] text-[10px] border-b border-black">
                        <div className="px-2 py-2 border-r border-black">
                          4G Premium Quality Pulses Sortex Clean (Masoor Black Whole) 30 kg India Bopp Bag:
                          EACH (Set of 1), HSN: 07139090, CGST@ 0.0%, SGST@ 0.0%
                          <br />
                          <span className="font-semibold">HSN Code: 07139090</span>
                        </div>
                        <div className="px-2 py-2 border-r border-black text-right">2,197.32</div>
                        <div className="px-2 py-2 border-r border-black text-right">0.00</div>
                        <div className="px-2 py-2 border-r border-black text-right">2,197.32</div>
                        <div className="px-2 py-2 border-r border-black text-right">1.0</div>
                        <div className="px-2 py-2 border-r border-black text-right">2,197.32</div>
                        <div className="px-2 py-2 border-r border-black text-right">0.00</div>
                        <div className="px-2 py-2 border-r border-black text-right">0.00</div>
                        <div className="px-2 py-2 text-right">2,197.32</div>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-[10px] px-2 py-1 border-b border-black">
                      <span>Page Total</span>
                      <span>Qty {totalQty.toFixed(1)}</span>
                      <span>{totalAmount.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Grand total section */}
                  <div className="flex justify-between items-center mt-2 text-[11px]">
                    <div>
                      <p className="font-semibold">FOR GRANARY WHOLESALE PRIVATE LIMITED</p>
                    </div>
                    <div className="text-right">
                      <p>Grand Total:</p>
                      <p className="font-semibold text-base">₹ {totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs">To Pay:</p>
                      <p className="font-bold text-xl">₹ {totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                </>
              );
            })()}

            {/* Footer */}
            <div className="mt-6 flex justify-between items-start text-[9px]">
              <div className="max-w-md">
                <p className="font-semibold mb-1">Authorised Signatory</p>
                <div className="mb-2 mt-1">
                  <img 
                    src="/sign.png" 
                    alt="Signature" 
                    className="h-12 object-contain"
                  />
                </div>
                <p className="mt-1">Is tax payable on reverse charge basis - NO</p>
                <p className="mt-1">
                  DECLARATION: We declare that the invoice shows the actual price of the goods described and that the particulars are true and correct.
                </p>
                <p className="mt-1">
                  Note:- This transaction/sale is subject to TDS U/s 194-O hence TDS U/s 194Q is not applicable. This is a computer-generated invoice.
                </p>
                <p className="mt-1">
                  For any issues, please contact DelyCart Customer Care team at 08045744101 or go to Your Biz &gt; Support section on Delycart app.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 mr-4">
                <div className="w-10 h-10 rounded-full border border-red-500 flex items-center justify-center text-[10px] text-red-600">
                  logo
                </div>
                <p className="text-[10px] font-semibold">Ordered Through</p>
                <p className="text-[11px] font-bold text-red-600">Delycart</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Delivery Person Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Assign Delivery Person</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label>Select Delivery Person</Label>
            <AssignSelect value={selectedDeliveryPersonId} onValueChange={setSelectedDeliveryPersonId}>
              <AssignSelectTrigger>
                <AssignSelectValue placeholder={isLoadingDeliveryPersons ? 'Loading...' : 'Select person'} />
              </AssignSelectTrigger>
              <AssignSelectContent>
                {deliveryPersons.map((p: any) => (
                  <AssignSelectItem key={p.id} value={p.id}>
                    {p.name} • {p.phone}
                  </AssignSelectItem>
                ))}
              </AssignSelectContent>
            </AssignSelect>
            <p className="text-xs text-muted-foreground">
              Showing online delivery persons. Availability is controlled by backend (`is_available`).
            </p>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)} disabled={assignMutation.isPending}>
              Cancel
            </Button>
            <Button
              variant="gradient"
              onClick={() => assignMutation.mutate()}
              disabled={assignMutation.isPending || !selectedDeliveryPersonId}
            >
              {assignMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Assigning...
                </>
              ) : (
                'Assign'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
