import { useState } from 'react';
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
  XCircle
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

// Mock data
const orders = [
  {
    id: 'ORD-2024-0156',
    customer: 'Sharma Traders',
    business: 'Sharma Trading Co.',
    items: 12,
    amount: 24500,
    paymentMethod: 'Credit',
    status: 'pending',
    date: '2024-01-15',
    deliveryDate: '2024-01-18',
  },
  {
    id: 'ORD-2024-0155',
    customer: 'Rajesh Kumar',
    business: 'Kumar Enterprises',
    items: 8,
    amount: 18900,
    paymentMethod: 'UPI',
    status: 'confirmed',
    date: '2024-01-15',
    deliveryDate: '2024-01-17',
  },
  {
    id: 'ORD-2024-0154',
    customer: 'Amit Patel',
    business: 'Patel & Sons',
    items: 15,
    amount: 32100,
    paymentMethod: 'Credit',
    status: 'shipped',
    date: '2024-01-14',
    deliveryDate: '2024-01-16',
  },
  {
    id: 'ORD-2024-0153',
    customer: 'Suresh Gupta',
    business: 'Gupta Store',
    items: 6,
    amount: 15600,
    paymentMethod: 'Cash',
    status: 'delivered',
    date: '2024-01-14',
    deliveryDate: '2024-01-15',
  },
  {
    id: 'ORD-2024-0152',
    customer: 'Harpreet Singh',
    business: 'Singh Retail',
    items: 20,
    amount: 28700,
    paymentMethod: 'Credit',
    status: 'pending',
    date: '2024-01-13',
    deliveryDate: '2024-01-17',
  },
  {
    id: 'ORD-2024-0151',
    customer: 'Vikram Mehta',
    business: 'Mehta Trading',
    items: 10,
    amount: 45200,
    paymentMethod: 'Bank Transfer',
    status: 'cancelled',
    date: '2024-01-13',
    deliveryDate: '-',
  },
  {
    id: 'ORD-2024-0150',
    customer: 'Priya Sharma',
    business: 'Sharma Mart',
    items: 25,
    amount: 67800,
    paymentMethod: 'Credit',
    status: 'delivered',
    date: '2024-01-12',
    deliveryDate: '2024-01-14',
  },
];

const orderStats = [
  { label: 'All Orders', value: 1234, icon: Package, color: 'bg-blue-100 text-blue-600' },
  { label: 'Pending', value: 23, icon: Clock, color: 'bg-amber-100 text-amber-600' },
  { label: 'Confirmed', value: 45, icon: CheckCircle2, color: 'bg-indigo-100 text-indigo-600' },
  { label: 'Shipped', value: 67, icon: Truck, color: 'bg-cyan-100 text-cyan-600' },
  { label: 'Delivered', value: 1087, icon: CheckCircle2, color: 'bg-emerald-100 text-emerald-600' },
  { label: 'Cancelled', value: 12, icon: XCircle, color: 'bg-red-100 text-red-600' },
];

export default function Orders() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

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
      delivered: 'delivered',
      cancelled: 'cancelled',
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const formatDate = (dateString: string) => {
    if (dateString === '-') return '-';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const filteredOrders = activeTab === 'all' 
    ? orders 
    : orders.filter(order => order.status === activeTab);

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
                  <p className="text-xl font-bold text-foreground">{stat.value}</p>
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
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <Select defaultValue="all">
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
              <Select defaultValue="all">
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Payment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payments</SelectItem>
                  <SelectItem value="credit">Credit</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table with Tabs */}
      <Card className="shadow-card">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
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
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                      <td className="py-4 px-4">
                        <span className="font-semibold text-primary">{order.id}</span>
                      </td>
                      <td className="py-4 px-4">
                        <p className="font-medium text-foreground">{order.customer}</p>
                        <p className="text-sm text-muted-foreground">{order.business}</p>
                      </td>
                      <td className="py-4 px-4 text-foreground">{order.items} items</td>
                      <td className="py-4 px-4 font-semibold text-foreground">{formatCurrency(order.amount)}</td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-muted-foreground">{order.paymentMethod}</span>
                      </td>
                      <td className="py-4 px-4">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="py-4 px-4 text-muted-foreground text-sm">{formatDate(order.date)}</td>
                      <td className="py-4 px-4 text-muted-foreground text-sm">{formatDate(order.deliveryDate)}</td>
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
                            <DropdownMenuItem>
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Update Status
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Printer className="h-4 w-4 mr-2" />
                              Print Invoice
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive focus:text-destructive">
                              <XCircle className="h-4 w-4 mr-2" />
                              Cancel Order
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Showing <strong>1-7</strong> of <strong>1,234</strong> orders
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled>Previous</Button>
                <Button variant="outline" size="sm">1</Button>
                <Button variant="secondary" size="sm">2</Button>
                <Button variant="outline" size="sm">3</Button>
                <Button variant="outline" size="sm">Next</Button>
              </div>
            </div>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
}
