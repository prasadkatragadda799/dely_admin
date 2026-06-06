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
import { adminDeliveryAPI, ordersAPI, returnsAPI } from '@/lib/api';
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
  const [detailOrderId, setDetailOrderId] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<string>('');
  const [statusNotes, setStatusNotes] = useState('');
  const [invoiceOrder, setInvoiceOrder] = useState<any | null>(null);
  const [isInvoiceLoading, setIsInvoiceLoading] = useState(false);
  const [assignOrderId, setAssignOrderId] = useState<string | null>(null);
  const [selectedDeliveryPersonId, setSelectedDeliveryPersonId] = useState<string>('');
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const limit = 20;

  // Returns tab state
  const [returnsStatusFilter, setReturnsStatusFilter] = useState('requested');
  const [rejectReturnId, setRejectReturnId] = useState<string | null>(null);
  const [rejectNotes, setRejectNotes] = useState('');
  const [assignReturnId, setAssignReturnId] = useState<string | null>(null);
  const [assignReturnDeliveryPersonId, setAssignReturnDeliveryPersonId] = useState('');
  const [isAssignReturnDialogOpen, setIsAssignReturnDialogOpen] = useState(false);

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

  // Full order detail for the view-details modal.
  const { data: orderDetailRes, isFetching: isOrderDetailLoading } = useQuery({
    queryKey: ['admin-order-detail', detailOrderId],
    queryFn: async () => (await ordersAPI.getOrder(detailOrderId as string)).data,
    enabled: !!detailOrderId,
  });
  const orderDetail: any = orderDetailRes ?? null;

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

  // Returns query & mutations
  const { data: returnsData, isLoading: isReturnsLoading, refetch: refetchReturns } = useQuery({
    queryKey: ['admin-returns', returnsStatusFilter],
    queryFn: () => returnsAPI.getReturns({ status: returnsStatusFilter === 'all' ? undefined : returnsStatusFilter, page_size: 50 }),
  });
  const returnsList: any[] = returnsData?.data?.returns ?? [];

  const approveReturnMutation = useMutation({
    mutationFn: ({ returnId, notes }: { returnId: string; notes?: string }) =>
      returnsAPI.approveReturn(returnId, notes),
    onSuccess: () => { refetchReturns(); toast({ title: 'Return approved' }); },
    onError: (e: any) => toast({ title: 'Error', description: e.response?.data?.detail ?? 'Failed', variant: 'destructive' }),
  });

  const rejectReturnMutation = useMutation({
    mutationFn: ({ returnId, notes }: { returnId: string; notes: string }) =>
      returnsAPI.rejectReturn(returnId, notes),
    onSuccess: () => { refetchReturns(); setRejectReturnId(null); setRejectNotes(''); toast({ title: 'Return rejected' }); },
    onError: (e: any) => toast({ title: 'Error', description: e.response?.data?.detail ?? 'Failed', variant: 'destructive' }),
  });

  const assignReturnPickupMutation = useMutation({
    mutationFn: ({ returnId, deliveryPersonId }: { returnId: string; deliveryPersonId: string }) =>
      returnsAPI.assignPickup(returnId, deliveryPersonId),
    onSuccess: () => { refetchReturns(); setIsAssignReturnDialogOpen(false); setAssignReturnId(null); setAssignReturnDeliveryPersonId(''); toast({ title: 'Pickup assigned' }); },
    onError: (e: any) => toast({ title: 'Error', description: e.response?.data?.detail ?? 'Failed', variant: 'destructive' }),
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

  const formatPaymentMethod = (rawMethod: string | undefined) => {
    const method = String(rawMethod || '').trim().toLowerCase();
    if (method === 'cod' || method === 'cash' || method === 'cash_on_delivery') {
      return 'Cash on Delivery';
    }
    return rawMethod || 'Unknown';
  };

  const handleViewDetails = (orderId: string) => {
    setDetailOrderId(orderId);
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
      const raw = response as { data?: any; seller?: any } | null | undefined;
      const payload =
        raw && typeof raw === 'object' && raw.data && typeof raw.data === 'object' && raw.data.seller
          ? raw.data
          : raw && typeof raw === 'object' && 'seller' in raw && raw.seller
            ? raw
            : raw?.data ?? raw;
      setInvoiceOrder(payload || order);
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

  const escapeCsv = (val: string | number): string => {
    const s = String(val ?? '');
    if (s.includes('"') || s.includes(',') || s.includes('\n') || s.includes('\r')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const buildExportFilters = (): Record<string, any> => {
    const params: any = { page: 1, limit: 5000 };
    if (searchQuery) params.search = searchQuery;
    if (activeTab !== 'all') params.status = activeTab;
    if (selectedPaymentMethod && selectedPaymentMethod !== 'all') {
      params.paymentMethod = selectedPaymentMethod;
    }
    if (selectedDateRange !== 'all') {
      const now = new Date();
      let dateFrom: Date;
      switch (selectedDateRange) {
        case 'today':
          dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          dateFrom = new Date(now);
          dateFrom.setDate(dateFrom.getDate() - 7);
          break;
        case 'month':
          dateFrom = new Date(now);
          dateFrom.setMonth(dateFrom.getMonth() - 1);
          break;
        default:
          dateFrom = new Date(0);
      }
      params.dateFrom = dateFrom.toISOString().split('T')[0];
      params.dateTo = new Date().toISOString().split('T')[0];
    }
    return params;
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const exportParams = buildExportFilters();
      const response = await ordersAPI.getOrders(exportParams);
      const responseData = (response as any)?.data ?? response;
      let items: any[] = [];
      if (responseData?.items && Array.isArray(responseData.items)) items = responseData.items;
      else if (Array.isArray(responseData)) items = responseData;
      else if (responseData?.orders && Array.isArray(responseData.orders)) items = responseData.orders;

      const headers = ['Order ID', 'Customer', 'Business', 'Items', 'Amount (₹)', 'Payment', 'Status', 'Order Date', 'Delivery Date'];
      const rows = items.map((order: any) => {
        const orderNumber = order.orderNumber || order.order_number || order.id || order.order_id || '';
        const customerName = order.customer?.name || order.customerName || order.customer_name || 'Unknown';
        const businessName = order.customer?.businessName || order.businessName || order.business_name || order.customer?.companyName || '-';
        const itemsCount = order.itemsCount ?? order.items_count ?? order.items?.length ?? 0;
        const totalAmount = order.totalAmount ?? order.total_amount ?? order.total ?? order.amount ?? 0;
        const paymentMethod = formatPaymentMethod(
          order.paymentMethod || order.payment_method || order.payment?.method || 'Unknown',
        );
        const status = order.status || order.order_status || 'pending';
        const orderDate = order.createdAt || order.created_at || order.orderDate || order.order_date || '';
        const deliveryDate = order.deliveryDate || order.delivery_date || order.expectedDeliveryDate || order.expected_delivery_date || '';
        const orderDateStr = orderDate ? new Date(orderDate).toLocaleDateString('en-CA') : '';
        const deliveryDateStr = deliveryDate ? new Date(deliveryDate).toLocaleDateString('en-CA') : '';
        return [
          escapeCsv(orderNumber),
          escapeCsv(customerName),
          escapeCsv(businessName),
          escapeCsv(itemsCount),
          escapeCsv(totalAmount),
          escapeCsv(paymentMethod),
          escapeCsv(status),
          escapeCsv(orderDateStr),
          escapeCsv(deliveryDateStr),
        ].join(',');
      });
      const csv = [headers.join(','), ...rows].join('\r\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orders-export-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: 'Export done', description: `${items.length} orders exported.` });
    } catch (err: any) {
      toast({
        title: 'Export failed',
        description: err?.response?.data?.message || err?.message || 'Could not export orders.',
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
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
                  <SelectItem value="cod">Cash on Delivery</SelectItem>
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
              <TabsTrigger
                value="returns"
                className="data-[state=active]:bg-transparent data-[state=active]:text-violet-600 data-[state=active]:border-b-2 data-[state=active]:border-violet-600 rounded-none px-0"
              >
                Returns
              </TabsTrigger>
            </TabsList>
          </div>

          <CardContent className="p-0">
            {/* ── Returns Tab ── */}
            {activeTab === 'returns' && (
              <div className="p-4 space-y-4">
                <div className="flex gap-2 flex-wrap">
                  {['requested', 'approved', 'rejected', 'pickup_assigned', 'picked_up', 'received_at_hub', 'all'].map(s => (
                    <button
                      key={s}
                      onClick={() => setReturnsStatusFilter(s)}
                      className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
                        returnsStatusFilter === s
                          ? 'bg-violet-600 text-white border-violet-600'
                          : 'bg-white text-violet-700 border-violet-300 hover:bg-violet-50'
                      }`}
                    >
                      {s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </button>
                  ))}
                </div>

                {isReturnsLoading ? (
                  <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
                ) : returnsList.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground">No return requests found.</div>
                ) : (
                  <div className="space-y-3">
                    {returnsList.map((ret: any) => (
                      <div key={ret.returnId} className="border border-violet-200 rounded-xl p-4 bg-violet-50/40 space-y-2">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div>
                            <span className="font-bold text-sm text-violet-900">Order #{(ret.orderNumber ?? ret.orderId ?? '').slice(-12)}</span>
                            <span className="ml-2 text-xs text-muted-foreground">{ret.customerName} · {ret.customerPhone ?? ''}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                            ret.status === 'requested' ? 'bg-amber-100 text-amber-700' :
                            ret.status === 'approved' || ret.status === 'pickup_assigned' ? 'bg-blue-100 text-blue-700' :
                            ret.status === 'rejected' ? 'bg-red-100 text-red-700' :
                            ret.status === 'picked_up' ? 'bg-indigo-100 text-indigo-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {ret.status.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700"><span className="font-semibold">Reason:</span> {ret.reason}</p>
                        {ret.adminNotes && <p className="text-xs text-gray-500"><span className="font-semibold">Admin notes:</span> {ret.adminNotes}</p>}
                        {ret.bankAccountNumber && (
                          <p className="text-xs text-gray-600">
                            <span className="font-semibold">Bank:</span> {ret.bankAccountHolder} · {ret.bankName} · A/C {ret.bankAccountNumber} · IFSC {ret.bankIfscCode}
                          </p>
                        )}
                        {ret.mediaUrls?.length > 0 && (
                          <div className="flex gap-2 flex-wrap">
                            {ret.mediaUrls.map((m: any, idx: number) => (
                              <a key={idx} href={m.url} target="_blank" rel="noopener noreferrer" className="text-xs text-violet-600 underline">
                                {m.type === 'video' ? '▶ Video' : `📷 Image ${idx + 1}`}
                              </a>
                            ))}
                          </div>
                        )}
                        {ret.status === 'requested' && (
                          <div className="flex gap-2 pt-1">
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                              disabled={approveReturnMutation.isPending}
                              onClick={() => approveReturnMutation.mutate({ returnId: ret.returnId })}
                            >
                              {approveReturnMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Approve'}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => { setRejectReturnId(ret.returnId); setRejectNotes(''); }}
                            >
                              Reject
                            </Button>
                          </div>
                        )}
                        {ret.status === 'approved' && (
                          <Button
                            size="sm"
                            className="bg-violet-600 hover:bg-violet-700 text-white"
                            onClick={() => { setAssignReturnId(ret.returnId); setAssignReturnDeliveryPersonId(''); setIsAssignReturnDialogOpen(true); }}
                          >
                            Assign Pickup
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Regular Orders Table (hidden when Returns tab active) ── */}
            {activeTab !== 'returns' && (isLoading && !ordersResponse ? (
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
                        const paymentMethod = formatPaymentMethod(
                          order.paymentMethod || order.payment_method || order.payment?.method || 'Unknown',
                        );
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
            ))}
          </CardContent>
        </Tabs>
      </Card>

      {/* Order detail modal */}
      <Dialog open={!!detailOrderId} onOpenChange={(o) => !o && setDetailOrderId(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Order #{String(orderDetail?.order_number ?? orderDetail?.orderNumber ?? detailOrderId ?? '').slice(-12)}
            </DialogTitle>
          </DialogHeader>
          {isOrderDetailLoading ? (
            <div className="py-10 flex items-center justify-center text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading order…
            </div>
          ) : !orderDetail ? (
            <div className="py-10 text-center text-muted-foreground">Could not load this order.</div>
          ) : (
            <div className="space-y-4 text-sm">
              <div className="flex items-center justify-between">
                {getStatusBadge(orderDetail.status || orderDetail.order_status || 'pending')}
                <span className="text-muted-foreground">
                  {formatDate(orderDetail.created_at || orderDetail.createdAt || '')}
                </span>
              </div>

              <div className="rounded-lg border border-border p-3 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customer</span>
                  <span className="font-medium">{orderDetail.customer?.name || orderDetail.customer_name || orderDetail.customerName || 'Unknown'}</span>
                </div>
                {(orderDetail.customer?.phone || orderDetail.customer_phone) ? (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phone</span>
                    <span className="font-medium">{orderDetail.customer?.phone || orderDetail.customer_phone}</span>
                  </div>
                ) : null}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment</span>
                  <span className="font-medium">{formatPaymentMethod(orderDetail.payment_method || orderDetail.paymentMethod)}</span>
                </div>
              </div>

              {(() => {
                const addr = orderDetail.delivery_address || orderDetail.deliveryAddress;
                const addrText = typeof addr === 'string'
                  ? addr
                  : addr
                    ? [addr.address_line1 || addr.addressLine1, addr.address_line2 || addr.addressLine2, [addr.city, addr.state, addr.pincode].filter(Boolean).join(', ')].filter(Boolean).join(', ')
                    : '';
                return addrText ? (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Delivery address</p>
                    <p className="rounded-lg bg-secondary/40 border border-border p-2.5">{addrText}</p>
                  </div>
                ) : null;
              })()}

              {(() => {
                const items = orderDetail.items || orderDetail.order_items || [];
                return Array.isArray(items) && items.length > 0 ? (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Items ({items.length})</p>
                    <div className="rounded-lg border border-border divide-y divide-border">
                      {items.map((it: any, i: number) => {
                        const name = it.product?.name || it.product_name || it.productName || it.name || 'Item';
                        const qty = it.quantity ?? it.qty ?? 1;
                        const price = it.total ?? it.total_amount ?? it.price ?? it.unit_price ?? 0;
                        return (
                          <div key={i} className="flex items-center justify-between p-2.5">
                            <span className="flex-1">{name} <span className="text-muted-foreground">× {qty}</span></span>
                            <span className="font-medium">{formatCurrency(parseFloat(String(price)) || 0)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null;
              })()}

              <div className="flex items-center justify-between border-t border-border pt-3">
                <span className="font-semibold">Total</span>
                <span className="text-lg font-bold">
                  {formatCurrency(parseFloat(String(orderDetail.total_amount ?? orderDetail.total ?? orderDetail.amount ?? 0)) || 0)}
                </span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailOrderId(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              const inv =
                order && typeof order === 'object' && (order as any).data?.seller
                  ? (order as any).data
                  : order;

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

              const seller = inv.seller as Record<string, string | undefined> | undefined;
              const buyer = inv.buyer as Record<string, string | undefined> | undefined;

              // Extract order metadata (canonical invoice API + legacy list-order fallbacks)
              const orderNumber =
                inv.order_number || inv.orderNumber || inv.id || order.orderNumber || order.order_number || order.id || '—';
              const shipmentNumber =
                inv.shipment_number ||
                inv.shipmentNumber ||
                inv.tracking_number ||
                inv.trackingNumber ||
                '—';
              const rawInvoiceDate =
                inv.invoice_date ||
                inv.invoiceDate ||
                inv.created_at ||
                inv.createdAt ||
                order.created_at ||
                order.createdAt;
              let invoiceDate = '—';
              if (rawInvoiceDate) {
                try {
                  invoiceDate = new Date(rawInvoiceDate as string).toISOString().split('T')[0];
                } catch {
                  invoiceDate = String(rawInvoiceDate);
                }
              }
              const placeOfSupply =
                (inv.place_of_supply as string) ||
                (buyer?.state as string) ||
                (getValue(order, 'customerState', 'customer.state', 'shipping_state') as string) ||
                '—';
              const supplyType =
                (inv.supply_type as string) ||
                (inv.supplyType as string) ||
                'INTRASTATE';
              const pageNumber = (inv.page_number as string) || (inv.pageNumber as string) || '1/1';

              // Bill From: backend invoice.seller (env SELLER_* / defaults)
              const billFromName =
                seller?.company_name || seller?.name || seller?.companyName || 'Seller not configured';
              const billFromLine1 = seller?.address_line1 || seller?.addressLine1 || '';
              const billFromLine2 = seller?.address_line2 || seller?.addressLine2 || '';
              const billFromCityLine = [seller?.city, seller?.state, seller?.pincode].filter(Boolean).join(', ');
              const billFromGst = seller?.gstin || seller?.gst_number || '—';

              // Bill To: canonical buyer from API, else legacy order shape
              const customerName =
                buyer?.name ||
                (getValue(order, 'customerName', 'customer.name', 'user.name') as string) ||
                '—';
              const customerAddress =
                buyer?.address_line1 ||
                buyer?.addressLine1 ||
                (getValue(order, 'customerAddress', 'customer.address', 'shipping_address.address') as string) ||
                '—';
              const customerAddress2 =
                buyer?.address_line2 || buyer?.addressLine2 || '';
              const customerCity =
                buyer?.city ||
                (getValue(order, 'customerCity', 'customer.city', 'shipping_city') as string) ||
                '';
              const customerState =
                buyer?.state ||
                (getValue(order, 'customerState', 'customer.state', 'shipping_state') as string) ||
                '';
              const customerPincode =
                buyer?.pincode ||
                (getValue(order, 'customerPincode', 'customer.pincode', 'shipping_pincode') as string) ||
                '';
              const customerMobile =
                buyer?.phone ||
                (getValue(order, 'customerMobile', 'customer.phone', 'shipping_phone') as string) ||
                '—';
              const customerGstin = buyer?.gstin || buyer?.gst_number || '';
              const customerStateCode =
                (getValue(order, 'customerStateCode', 'state_code') as string) || '—';

              const orderItems = inv.items || order.items || order.orderItems || order.products || [];
              const hasItems = orderItems.length > 0;

              const totalAmount = Number(
                inv.grand_total ??
                  inv.grandTotal ??
                  inv.total ??
                  order.totalAmount ??
                  order.total_amount ??
                  order.total ??
                  0,
              );
              const totalQty = hasItems
                ? orderItems.reduce((sum: number, item: any) => sum + Number(item.quantity || item.qty || 1), 0)
                : 0;

              const isCanonicalItem = (item: any) =>
                item &&
                typeof item === 'object' &&
                item.product &&
                typeof item.product === 'object' &&
                (item.taxable_amount !== undefined || item.taxableAmount !== undefined);

              return (
                <>
                  {/* Top section: meta + addresses */}
                  <div className="flex justify-between gap-6">
                    <div className="flex-1 grid grid-cols-2 gap-x-6 gap-y-1 text-[11px]">
                      <div className="flex gap-2.5">
                        <img
                          src="/dely-logo.png"
                          alt="Delycart"
                          className="h-[42px] w-[42px] shrink-0 rounded-lg object-contain"
                        />
                        <div>
                        <p className="font-semibold uppercase">Bill of Supply</p>
                        <p>Invoice No : {(inv.invoice_number as string) || (inv.reference_number as string) || '—'}</p>
                        <p>Order No : {orderNumber}</p>
                        <p>Shipment No : {shipmentNumber}</p>
                        <p>Invoice Date : {invoiceDate}</p>
                        <p>Place of Supply : {String(placeOfSupply).toUpperCase()}</p>
                        <p>Supply Type : {supplyType}</p>
                        <p>Page No : {pageNumber}</p>
                        </div>
                      </div>
                      <div>
                        <p className="font-semibold">Bill From:</p>
                        <p>{billFromName}</p>
                        {billFromLine1 ? <p>{billFromLine1}</p> : null}
                        {billFromLine2 ? <p>{billFromLine2}</p> : null}
                        {billFromCityLine ? <p>{billFromCityLine}</p> : null}
                        <p>GSTIN: {billFromGst}</p>
                        {seller?.phone ? <p>Phone: {seller.phone}</p> : null}
                        {seller?.email ? <p className="break-all">{seller.email}</p> : null}
                      </div>
                    </div>
                    <div className="w-60 text-[11px]">
                      <p className="font-semibold">Bill To:</p>
                      <p>{String(customerName).toUpperCase()}</p>
                      <p>{customerAddress}</p>
                      {customerAddress2 ? <p>{customerAddress2}</p> : null}
                      <p>
                        {[customerCity, customerState].filter(Boolean).join(', ')}
                        {customerPincode ? ` - ${customerPincode}` : ''}
                      </p>
                      <p className="mt-1">Mobile: {customerMobile}</p>
                      {customerGstin ? <p>GSTIN: {customerGstin}</p> : null}
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
                        if (isCanonicalItem(item)) {
                          const productName = item.product?.name || 'Product';
                          const productDescription = item.product?.description || '';
                          const hsnCode = item.product?.hsn || item.product?.hsnCode || '07139090';
                          const variantLabel = item.product?.variant || item.product?.unit || '';
                          const mrp = Number(item.mrp ?? item.original_rate ?? item.originalPrice ?? 0);
                          const sellingPrice = Number(item.rate ?? item.selling_price ?? item.sellingPrice ?? item.price ?? 0);
                          const unitDiscount = Number(item.unit_discount ?? 0);
                          const discountTotal = Number(item.discount ?? unitDiscount * Number(item.quantity ?? 1));
                          const quantity = Number(item.quantity ?? item.qty ?? 1);
                          const taxableAmount = Number(item.taxable_amount ?? item.taxableAmount ?? sellingPrice * quantity);
                          const sgstAmount = Number(item.sgst ?? item.tax_details?.sgst ?? 0);
                          const cgstAmount = Number(item.cgst ?? item.tax_details?.cgst ?? 0);
                          const igstAmount = Number(item.tax_details?.igst ?? item.igst ?? 0);
                          const taxRate = Number(item.tax_details?.rate ?? 0);
                          const halfRate = taxRate > 0 ? taxRate / 2 : 0;
                          const itemTotalAmount = Number(
                            item.total_amount ?? item.totalAmount ?? taxableAmount + sgstAmount + cgstAmount + igstAmount,
                          );
                          const taxLabel =
                            supplyType === 'INTERSTATE' && igstAmount > 0
                              ? `IGST@ ${taxRate.toFixed(1)}%`
                              : `CGST@ ${halfRate.toFixed(1)}%, SGST@ ${halfRate.toFixed(1)}%`;
                          return (
                            <div
                              key={item.id || index}
                              className="grid grid-cols-[2fr,0.7fr,0.7fr,0.7fr,0.4fr,0.8fr,0.5fr,0.5fr,0.8fr] text-[10px] border-b border-black">
                              <div className="px-2 py-2 border-r border-black">
                                {productName}
                                {productDescription ? `: ${productDescription}` : ''}
                                <br />
                                {variantLabel ? `${variantLabel}, ` : ''}HSN: {hsnCode}, {taxLabel}
                                <br />
                                <span className="font-semibold">HSN Code: {hsnCode}</span>
                              </div>
                              <div className="px-2 py-2 border-r border-black text-right">
                                {mrp.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </div>
                              <div className="px-2 py-2 border-r border-black text-right">
                                {discountTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </div>
                              <div className="px-2 py-2 border-r border-black text-right">
                                {sellingPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </div>
                              <div className="px-2 py-2 border-r border-black text-right">{quantity.toFixed(1)}</div>
                              <div className="px-2 py-2 border-r border-black text-right">
                                {taxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </div>
                              <div className="px-2 py-2 border-r border-black text-right">
                                {sgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </div>
                              <div className="px-2 py-2 border-r border-black text-right">
                                {cgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </div>
                              <div className="px-2 py-2 text-right">
                                {itemTotalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </div>
                            </div>
                          );
                        }

                        const productName =
                          item.productName || item.product_name || item.product?.name || item.name || 'Product';
                        const productDescription =
                          item.productDescription || item.product_description || item.product?.description || '';

                        const hsnCode =
                          item.hsnCode ||
                          item.hsn_code ||
                          item.product?.hsnCode ||
                          item.product?.hsn_code ||
                          item.variant?.hsnCode ||
                          item.variant?.hsn_code ||
                          '07139090';

                        const mrp = item.mrp || item.originalPrice || item.original_price || item.product?.mrp || 0;
                        const sellingPrice =
                          item.sellingPrice ||
                          item.selling_price ||
                          item.price ||
                          item.product?.sellingPrice ||
                          item.product?.selling_price ||
                          0;
                        const discount = Math.max(0, Number(mrp) - Number(sellingPrice));

                        const quantity = item.quantity || item.qty || 1;
                        const unit = item.unit || item.product?.unit || 'EACH';
                        const setPieces =
                          item.setPieces ||
                          item.set_pieces ||
                          item.variant?.setPieces ||
                          item.variant?.set_pieces ||
                          item.product?.piecesPerSet ||
                          item.product?.pieces_per_set ||
                          1;

                        const taxableAmount =
                          item.taxableAmount || item.taxable_amount || Number(sellingPrice) * Number(quantity);
                        const cgstRate =
                          item.cgstRate || item.cgst_rate || item.product?.cgstRate || item.product?.cgst_rate || 0;
                        const sgstRate =
                          item.sgstRate || item.sgst_rate || item.product?.sgstRate || item.product?.sgst_rate || 0;
                        const cgstAmount = item.cgstAmount || item.cgst_amount || (taxableAmount * cgstRate) / 100;
                        const sgstAmount = item.sgstAmount || item.sgst_amount || (taxableAmount * sgstRate) / 100;
                        const itemTotalAmount =
                          item.totalAmount || item.total_amount || taxableAmount + cgstAmount + sgstAmount;

                        return (
                          <div
                            key={index}
                            className="grid grid-cols-[2fr,0.7fr,0.7fr,0.7fr,0.4fr,0.8fr,0.5fr,0.5fr,0.8fr] text-[10px] border-b border-black">
                            <div className="px-2 py-2 border-r border-black">
                              {productName}
                              {productDescription && `: ${productDescription}`}
                              <br />
                              {unit} (Set of {setPieces}), HSN: {hsnCode}, CGST@ {Number(cgstRate).toFixed(1)}%, SGST@{' '}
                              {Number(sgstRate).toFixed(1)}%
                              <br />
                              <span className="font-semibold">HSN Code: {hsnCode}</span>
                            </div>
                            <div className="px-2 py-2 border-r border-black text-right">
                              {Number(mrp).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <div className="px-2 py-2 border-r border-black text-right">
                              {Number(discount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <div className="px-2 py-2 border-r border-black text-right">
                              {Number(sellingPrice).toLocaleString('en-IN', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </div>
                            <div className="px-2 py-2 border-r border-black text-right">{Number(quantity).toFixed(1)}</div>
                            <div className="px-2 py-2 border-r border-black text-right">
                              {Number(taxableAmount).toLocaleString('en-IN', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </div>
                            <div className="px-2 py-2 border-r border-black text-right">
                              {Number(sgstAmount).toLocaleString('en-IN', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </div>
                            <div className="px-2 py-2 border-r border-black text-right">
                              {Number(cgstAmount).toLocaleString('en-IN', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </div>
                            <div className="px-2 py-2 text-right">
                              {Number(itemTotalAmount).toLocaleString('en-IN', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </div>
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
                      <p className="font-semibold">FOR {billFromName.toUpperCase()}</p>
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

                  {/* Footer */}
                  <div className="mt-6 flex justify-between items-start text-[9px]">
                    <div className="max-w-md">
                      <p className="font-semibold mb-1">Authorised Signatory</p>
                      <div className="mb-2 mt-1">
                        <img src="/sign.png" alt="Signature" className="h-12 object-contain" />
                      </div>
                      <p className="mt-1">
                        Is tax payable on reverse charge basis -{' '}
                        {inv.tax_payable_reverse_charge === true ? 'YES' : 'NO'}
                      </p>
                      <p className="mt-1">
                        DECLARATION: We declare that the invoice shows the actual price of the goods described and that the
                        particulars are true and correct.
                      </p>
                      <p className="mt-1">
                        {inv.terms ||
                          'Note:- This transaction/sale is subject to TDS U/s 194-O hence TDS U/s 194Q is not applicable. This is a computer-generated invoice.'}
                      </p>
                      <p className="mt-1">
                        For any issues, please contact DelyCart Customer Care team at 08045744101 or go to Your Biz &gt;
                        Support section on Delycart app.
                      </p>
                    </div>
                    <div className="flex flex-col items-center space-y-2 mr-4">
                      <img
                        src="/dely-logo.png"
                        alt="Delycart"
                        className="h-11 w-11 rounded-lg object-contain"
                      />
                      <p className="text-[10px] font-semibold">Ordered Through</p>
                      <p className="text-[11px] font-bold text-red-600">Delycart</p>
                    </div>
                  </div>
                </>
              );
            })()}
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
      {/* Reject Return Dialog */}
      <AlertDialog open={!!rejectReturnId} onOpenChange={() => { if (!rejectReturnMutation.isPending) setRejectReturnId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Return</AlertDialogTitle>
            <AlertDialogDescription>Provide a reason for rejecting this return request.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <textarea
              className="w-full border rounded-lg p-2 text-sm min-h-[80px]"
              placeholder="Reason for rejection (required)"
              value={rejectNotes}
              onChange={e => setRejectNotes(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={rejectReturnMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={rejectReturnMutation.isPending || !rejectNotes.trim()}
              onClick={() => rejectReturnId && rejectReturnMutation.mutate({ returnId: rejectReturnId, notes: rejectNotes })}
            >
              {rejectReturnMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Reject'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Assign Pickup Dialog */}
      <Dialog open={isAssignReturnDialogOpen} onOpenChange={setIsAssignReturnDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Assign Return Pickup</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label>Select Delivery Person</Label>
            <AssignSelect value={assignReturnDeliveryPersonId} onValueChange={setAssignReturnDeliveryPersonId}>
              <AssignSelectTrigger>
                <AssignSelectValue placeholder={isLoadingDeliveryPersons ? 'Loading...' : 'Select person'} />
              </AssignSelectTrigger>
              <AssignSelectContent>
                {deliveryPersons.map((p: any) => (
                  <AssignSelectItem key={p.id} value={p.id}>{p.name} · {p.phone}</AssignSelectItem>
                ))}
              </AssignSelectContent>
            </AssignSelect>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsAssignReturnDialogOpen(false)} disabled={assignReturnPickupMutation.isPending}>Cancel</Button>
            <Button
              className="bg-violet-600 hover:bg-violet-700 text-white"
              disabled={assignReturnPickupMutation.isPending || !assignReturnDeliveryPersonId}
              onClick={() => assignReturnId && assignReturnPickupMutation.mutate({ returnId: assignReturnId, deliveryPersonId: assignReturnDeliveryPersonId })}
            >
              {assignReturnPickupMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Assign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
