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
  CheckCircle2,
  XCircle,
  AlertCircle
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
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// Mock data
const revenueData = [
  { name: 'Mon', revenue: 42000 },
  { name: 'Tue', revenue: 58000 },
  { name: 'Wed', revenue: 35000 },
  { name: 'Thu', revenue: 72000 },
  { name: 'Fri', revenue: 68000 },
  { name: 'Sat', revenue: 89000 },
  { name: 'Sun', revenue: 53000 },
];

const topProducts = [
  { name: 'Basmati Rice 25kg', sales: 245, amount: 122500 },
  { name: 'Sunflower Oil 15L', sales: 189, amount: 151200 },
  { name: 'Wheat Flour 50kg', sales: 156, amount: 78000 },
  { name: 'Sugar 25kg', sales: 134, amount: 53600 },
  { name: 'Toor Dal 10kg', sales: 112, amount: 67200 },
];

const orderStatusData = [
  { name: 'Pending', value: 23, color: '#f59e0b' },
  { name: 'Confirmed', value: 45, color: '#3b82f6' },
  { name: 'Shipped', value: 67, color: '#06b6d4' },
  { name: 'Delivered', value: 156, color: '#10b981' },
  { name: 'Cancelled', value: 12, color: '#ef4444' },
];

const recentOrders = [
  { id: 'ORD-2024-0156', customer: 'Sharma Traders', amount: 24500, status: 'pending', time: '5 min ago' },
  { id: 'ORD-2024-0155', customer: 'Kumar Enterprises', amount: 18900, status: 'confirmed', time: '15 min ago' },
  { id: 'ORD-2024-0154', customer: 'Patel & Sons', amount: 32100, status: 'shipped', time: '1 hour ago' },
  { id: 'ORD-2024-0153', customer: 'Gupta Store', amount: 15600, status: 'delivered', time: '2 hours ago' },
  { id: 'ORD-2024-0152', customer: 'Singh Retail', amount: 28700, status: 'pending', time: '3 hours ago' },
];

const recentActivities = [
  { type: 'order', message: 'New order #ORD-2024-0156 received', time: '5 min ago', icon: ShoppingCart },
  { type: 'user', message: 'New user registered: Mehta Trading Co.', time: '20 min ago', icon: Users },
  { type: 'kyc', message: 'KYC approved for Sharma Traders', time: '1 hour ago', icon: CheckCircle2 },
  { type: 'stock', message: 'Low stock alert: Basmati Rice 25kg', time: '2 hours ago', icon: AlertCircle },
  { type: 'order', message: 'Order #ORD-2024-0150 delivered', time: '3 hours ago', icon: CheckCircle2 },
];

export default function Dashboard() {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const metrics = [
    {
      title: 'Total Revenue',
      value: '₹8,45,230',
      change: '+12.5%',
      trend: 'up',
      subtitle: 'vs last month',
      icon: DollarSign,
    },
    {
      title: 'Total Orders',
      value: '1,234',
      change: '+8.2%',
      trend: 'up',
      subtitle: 'vs last month',
      icon: ShoppingCart,
    },
    {
      title: 'Active Users',
      value: '456',
      change: '+15.3%',
      trend: 'up',
      subtitle: 'registered users',
      icon: Users,
    },
    {
      title: 'Products',
      value: '892',
      change: '-2.4%',
      trend: 'down',
      subtitle: '12 low stock',
      icon: Package,
    },
    {
      title: 'KYC Pending',
      value: '23',
      change: '',
      trend: 'neutral',
      subtitle: 'awaiting verification',
      icon: FileCheck,
    },
  ];

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
        {metrics.map((metric, index) => (
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
        ))}
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
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
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
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={orderStatusData}
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
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {orderStatusData.map((item) => (
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
            <Button variant="ghost" size="sm">
              View All
              <ArrowUpRight className="h-4 w-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.map((product, index) => (
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
              ))}
            </div>
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
              {recentActivities.map((activity, index) => (
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
              ))}
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
          <Button variant="ghost" size="sm">
            View All Orders
            <ArrowUpRight className="h-4 w-4 ml-1" />
          </Button>
        </CardHeader>
        <CardContent>
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
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-medium text-primary">{order.id}</span>
                    </td>
                    <td className="py-3 px-4 text-foreground">{order.customer}</td>
                    <td className="py-3 px-4 font-medium text-foreground">{formatCurrency(order.amount)}</td>
                    <td className="py-3 px-4">
                      <Badge variant={order.status as any}>{order.status}</Badge>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground text-sm">{order.time}</td>
                    <td className="py-3 px-4">
                      <Button variant="ghost" size="sm">View</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
