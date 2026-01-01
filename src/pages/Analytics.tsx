import { useState } from 'react';
import { 
  Download,
  Calendar,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// Mock data
const revenueData = [
  { month: 'Jan', revenue: 420000, orders: 234 },
  { month: 'Feb', revenue: 580000, orders: 298 },
  { month: 'Mar', revenue: 350000, orders: 189 },
  { month: 'Apr', revenue: 720000, orders: 456 },
  { month: 'May', revenue: 680000, orders: 412 },
  { month: 'Jun', revenue: 890000, orders: 567 },
];

const productPerformance = [
  { name: 'Basmati Rice 25kg', sales: 245, revenue: 269500 },
  { name: 'Sunflower Oil 15L', sales: 189, revenue: 31185 },
  { name: 'Wheat Flour 50kg', sales: 156, revenue: 65520 },
  { name: 'Sugar 25kg', sales: 134, revenue: 6432 },
  { name: 'Toor Dal 10kg', sales: 112, revenue: 18480 },
];

const categoryPerformance = [
  { name: 'Rice & Grains', sales: 1245, revenue: 1245000 },
  { name: 'Cooking Oil', sales: 890, revenue: 146850 },
  { name: 'Flour & Atta', sales: 567, revenue: 238140 },
  { name: 'Pulses & Lentils', sales: 456, revenue: 75240 },
  { name: 'Sugar & Sweeteners', sales: 234, revenue: 11232 },
  { name: 'Beverages', sales: 189, revenue: 91665 },
];

const companyPerformance = [
  { name: 'KRBL Limited', revenue: 495000, orders: 234 },
  { name: 'Adani Wilmar', revenue: 412000, orders: 189 },
  { name: 'ITC Limited', revenue: 378000, orders: 156 },
  { name: 'Tata Consumer', revenue: 345000, orders: 134 },
];

const paymentMethodData = [
  { name: 'Credit', value: 45, color: '#1E6DD8' },
  { name: 'UPI', value: 30, color: '#10B981' },
  { name: 'Bank Transfer', value: 15, color: '#F59E0B' },
  { name: 'Cash', value: 10, color: '#EF4444' },
];

const orderStatusData = [
  { name: 'Delivered', value: 1087, color: '#10B981' },
  { name: 'Shipped', value: 67, color: '#06b6d4' },
  { name: 'Confirmed', value: 45, color: '#3b82f6' },
  { name: 'Pending', value: 23, color: '#F59E0B' },
  { name: 'Cancelled', value: 12, color: '#EF4444' },
];

const userGrowthData = [
  { month: 'Jan', users: 120, newUsers: 15 },
  { month: 'Feb', users: 145, newUsers: 25 },
  { month: 'Mar', users: 178, newUsers: 33 },
  { month: 'Apr', users: 210, newUsers: 32 },
  { month: 'May', users: 245, newUsers: 35 },
  { month: 'Jun', users: 289, newUsers: 44 },
];

export default function Analytics() {
  const [dateRange, setDateRange] = useState('month');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics & Reports</h1>
          <p className="text-muted-foreground">Comprehensive insights and performance metrics</p>
        </div>
        <div className="flex gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {formatCurrency(3640000)}
                </p>
                <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  +12.5% vs last period
                </p>
              </div>
              <div className="p-3 rounded-lg bg-blue-100">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold text-foreground mt-1">1,234</p>
                <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  +8.2% vs last period
                </p>
              </div>
              <div className="p-3 rounded-lg bg-purple-100">
                <ShoppingCart className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold text-foreground mt-1">456</p>
                <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  +15.3% vs last period
                </p>
              </div>
              <div className="p-3 rounded-lg bg-emerald-100">
                <Users className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Order Value</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {formatCurrency(2950)}
                </p>
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 rotate-180" />
                  -2.1% vs last period
                </p>
              </div>
              <div className="p-3 rounded-lg bg-amber-100">
                <BarChart3 className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Tabs */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="companies">Companies</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
        </TabsList>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Revenue Overview</CardTitle>
              <CardDescription>Monthly revenue and order trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1E6DD8" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#1E6DD8" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="month" stroke="#6B7280" />
                    <YAxis stroke="#6B7280" tickFormatter={(value) => `₹${value/1000}k`} />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ 
                        backgroundColor: '#fff',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#1E6DD8" 
                      strokeWidth={2}
                      fill="url(#revenueGradient)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Top Selling Products</CardTitle>
              <CardDescription>Best performing products by sales</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={productPerformance}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="name" stroke="#6B7280" angle={-45} textAnchor="end" height={100} />
                    <YAxis stroke="#6B7280" />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ 
                        backgroundColor: '#fff',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="revenue" fill="#1E6DD8" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Category Performance</CardTitle>
              <CardDescription>Sales by product category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryPerformance} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis type="number" stroke="#6B7280" tickFormatter={(value) => `₹${value/1000}k`} />
                    <YAxis dataKey="name" type="category" stroke="#6B7280" width={120} />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ 
                        backgroundColor: '#fff',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="revenue" fill="#1E6DD8" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Companies Tab */}
        <TabsContent value="companies" className="space-y-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Company Performance</CardTitle>
              <CardDescription>Revenue by company</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={companyPerformance}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="name" stroke="#6B7280" angle={-45} textAnchor="end" height={100} />
                    <YAxis stroke="#6B7280" tickFormatter={(value) => `₹${value/1000}k`} />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ 
                        backgroundColor: '#fff',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="revenue" fill="#1E6DD8" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>User Growth</CardTitle>
              <CardDescription>User registration trends over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={userGrowthData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="month" stroke="#6B7280" />
                    <YAxis stroke="#6B7280" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="users" 
                      stroke="#1E6DD8" 
                      strokeWidth={2}
                      name="Total Users"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="newUsers" 
                      stroke="#10B981" 
                      strokeWidth={2}
                      name="New Users"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Order Status Distribution</CardTitle>
                <CardDescription>Orders by status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={orderStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {orderStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#fff',
                          border: '1px solid #E5E7EB',
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
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Payment Method Distribution</CardTitle>
                <CardDescription>Orders by payment method</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentMethodData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {paymentMethodData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#fff',
                          border: '1px solid #E5E7EB',
                          borderRadius: '8px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

