import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  FileCheck,
  ArrowUpRight,
  MoreHorizontal,
  Clock,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { analyticsAPI, ordersAPI } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';

const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  confirmed: '#3b82f6',
  processing: '#3b82f6',
  shipped: '#06b6d4',
  out_for_delivery: '#06b6d4',
  delivered: '#10b981',
  completed: '#10b981',
  cancelled: '#ef4444',
  canceled: '#ef4444',
};

function formatTimeAgo(dateString: string) {
  try {
    const d = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day ago`;
  } catch {
    return '';
  }
}

export default function Dashboard() {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const { data: dashboardMetrics, isLoading: loadingMetrics } = useQuery({
    queryKey: ['dashboard', 'metrics'],
    queryFn: async () => {
      const res = await analyticsAPI.getDashboardMetrics({ period: 'month' });
      return res.data;
    },
  });

  const { data: revenueList = [], isLoading: loadingRevenue } = useQuery({
    queryKey: ['dashboard', 'revenue'],
    queryFn: async () => {
      const res = await analyticsAPI.getRevenueData({ period: 'week' });
      return Array.isArray(res.data) ? res.data : [];
    },
  });

  const { data: orderAnalytics, isLoading: loadingOrderStats } = useQuery({
    queryKey: ['dashboard', 'orderAnalytics'],
    queryFn: async () => {
      const res = await analyticsAPI.getOrderAnalytics({ period: 'month' });
      return res.data || {};
    },
  });

  const { data: productList = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['dashboard', 'products'],
    queryFn: async () => {
      const res = await analyticsAPI.getProductAnalytics({ period: 'month', limit: 5 });
      const raw = res.data;
      return Array.isArray(raw) ? raw : (raw?.products ? raw.products : []);
    },
  });

  const { data: ordersResponse, isLoading: loadingOrders } = useQuery({
    queryKey: ['dashboard', 'recentOrders'],
    queryFn: () => ordersAPI.getOrders({ page: 1, limit: 5, sort: 'createdAt', order: 'desc' }),
  });

  const revenueData = revenueList.map((item: any) => ({
    name: item.period || item.name || '',
    revenue: item.revenue ?? 0,
  }));

  const orderStatusData = Array.isArray(orderAnalytics?.statusDistribution)
    ? orderAnalytics.statusDistribution.map((item: any) => ({
        name: item.name || '',
        value: item.value ?? 0,
        color: item.color || ORDER_STATUS_COLORS[String(item.name).toLowerCase()] || '#1E6DD8',
      }))
    : [];

  const topProducts = productList.map((item: any) => ({
    name: item.name || 'Unknown',
    sales: item.sales ?? 0,
    amount: item.revenue ?? item.amount ?? 0,
  }));

  const recentOrders = ordersResponse?.data?.items ?? [];
  const recentActivities = recentOrders.slice(0, 5).map((o: any) => {
    const id = o.orderNumber || o.order_number || o.id;
    const status = o.status || o.order_status || 'pending';
    return {
      type: 'order',
      message: `Order #${id} - ${status}`,
      time: formatTimeAgo(o.createdAt || o.created_at || ''),
      icon: ShoppingCart,
    };
  });

  const totalRevenue = dashboardMetrics?.totalRevenue ?? 0;
  const totalOrders = dashboardMetrics?.totalOrders ?? 0;
  const activeUsers = dashboardMetrics?.activeUsers ?? 0;
  const productCount = dashboardMetrics?.totalProducts ?? dashboardMetrics?.products ?? 0;
  const kycPending = dashboardMetrics?.kycPending ?? dashboardMetrics?.pendingKyc ?? 0;
  const revenueChange = dashboardMetrics?.revenueChange ?? 0;
  const ordersChange = dashboardMetrics?.ordersChange ?? 0;
  const usersChange = dashboardMetrics?.usersChange ?? 0;

  const metrics = [
    {
      title: 'Total Revenue',
      value: formatCurrency(totalRevenue),
      change: revenueChange != null ? `${revenueChange >= 0 ? '+' : ''}${revenueChange}%` : '',
      trend: revenueChange > 0 ? 'up' : revenueChange < 0 ? 'down' : 'neutral',
      subtitle: 'vs last month',
      icon: DollarSign,
    },
    {
      title: 'Total Orders',
      value: String(totalOrders),
      change: ordersChange != null ? `${ordersChange >= 0 ? '+' : ''}${ordersChange}%` : '',
      trend: ordersChange > 0 ? 'up' : ordersChange < 0 ? 'down' : 'neutral',
      subtitle: 'vs last month',
      icon: ShoppingCart,
    },
    {
      title: 'Active Users',
      value: String(activeUsers),
      change: usersChange != null ? `${usersChange >= 0 ? '+' : ''}${usersChange}%` : '',
      trend: usersChange > 0 ? 'up' : usersChange < 0 ? 'down' : 'neutral',
      subtitle: 'registered users',
      icon: Users,
    },
    {
      title: 'Products',
      value: String(productCount),
      change: '',
      trend: 'neutral' as const,
      subtitle: 'in catalog',
      icon: Package,
    },
    {
      title: 'KYC Pending',
      value: String(kycPending),
      change: '',
      trend: 'neutral' as const,
      subtitle: 'awaiting verification',
      icon: FileCheck,
    },
  ];

  const isLoading = loadingMetrics || loadingRevenue || loadingOrderStats || loadingProducts || loadingOrders;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's what's happening today.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">Download Report</Button>
          <Button variant="gradient">
            <ShoppingCart className="h-4 w-4 mr-2" />
            New Order
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {loadingMetrics ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="shadow-card">
              <CardContent className="p-5">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))
        ) : (
          metrics.map((metric, index) => (
            <Card key={index} className="shadow-card hover:shadow-card-hover transition-shadow duration-200">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="p-2 rounded-lg bg-secondary">
                    <metric.icon className="h-5 w-5 text-primary" />
                  </div>
                  {metric.change && (
                    <div className={`flex items-center gap-1 text-xs font-medium ${
                      metric.trend === 'up' ? 'text-emerald-600' :
                      metric.trend === 'down' ? 'text-red-500' : 'text-muted-foreground'
                    }`}>
                      {metric.trend === 'up' && <TrendingUp className="h-3 w-3" />}
                      {metric.trend === 'down' && <TrendingDown className="h-3 w-3" />}
                      {metric.change}
                    </div>
                  )}
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-bold text-foreground">{metric.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{metric.title}</p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2 shadow-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg font-semibold">Revenue Overview</CardTitle>
              <CardDescription>Weekly revenue trend</CardDescription>
            </div>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              {loadingRevenue ? (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData.length ? revenueData : [{ name: '-', revenue: 0 }]}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    tickFormatter={(value) => `₹${value/1000}k`}
                  />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    fill="url(#revenueGradient)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Order Status Pie Chart */}
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Order Status</CardTitle>
            <CardDescription>Distribution by status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              {loadingOrderStats ? (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={orderStatusData.length ? orderStatusData : [{ name: 'No data', value: 1, color: '#e5e7eb' }]}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {orderStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {(orderStatusData.length ? orderStatusData : []).map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-muted-foreground">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Products */}
        <Card className="lg:col-span-2 shadow-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg font-semibold">Top Selling Products</CardTitle>
              <CardDescription>Best performers this month</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/analytics">
                View All
                <ArrowUpRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loadingProducts ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : (
            <div className="space-y-4">
              {topProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No product data for this period.</p>
              ) : (
              topProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center text-primary font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.sales} units sold</p>
                    </div>
                  </div>
                  <p className="font-semibold text-foreground">{formatCurrency(product.amount)}</p>
                </div>
              ))
              )}
            </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
            <CardDescription>Latest updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">No recent activity.</p>
              ) : (
                recentActivities.map((activity, index) => (
                  <div key={index} className="flex gap-3">
                    <div className={`p-2 rounded-lg shrink-0 ${
                      activity.type === 'order' ? 'bg-blue-100 text-blue-600' :
                      activity.type === 'user' ? 'bg-purple-100 text-purple-600' :
                      activity.type === 'kyc' ? 'bg-emerald-100 text-emerald-600' :
                      'bg-amber-100 text-amber-600'
                    }`}>
                      <activity.icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground line-clamp-2">{activity.message}</p>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders Table */}
      <Card className="shadow-card">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-lg font-semibold">Recent Orders</CardTitle>
            <CardDescription>Latest orders received</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/orders">
              View All Orders
              <ArrowUpRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {loadingOrders ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Order ID</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Customer</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Amount</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Time</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground text-sm">
                      No recent orders.
                    </td>
                  </tr>
                ) : (
                recentOrders.map((order: any) => {
                  const orderId = order.id || order.order_id;
                  const orderNumber = order.orderNumber || order.order_number || orderId;
                  const customer = order.customer?.name || order.customerName || order.customer_name || 'Unknown';
                  const amount = order.totalAmount ?? order.total_amount ?? order.total ?? order.amount ?? 0;
                  const status = order.status || order.order_status || 'pending';
                  const time = formatTimeAgo(order.createdAt || order.created_at || '');
                  return (
                  <tr key={orderId} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-medium text-primary">{orderNumber}</span>
                    </td>
                    <td className="py-3 px-4 text-foreground">{customer}</td>
                    <td className="py-3 px-4 font-medium text-foreground">{formatCurrency(Number(amount))}</td>
                    <td className="py-3 px-4">
                      <Badge variant={status === 'cancelled' || status === 'canceled' ? 'cancelled' : status === 'delivered' || status === 'completed' ? 'delivered' : 'pending'}>{status}</Badge>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground text-sm">{time}</td>
                    <td className="py-3 px-4">
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/orders`}>View</Link>
                      </Button>
                    </td>
                  </tr>
                  );
                })
                )}
              </tbody>
            </table>
          </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
