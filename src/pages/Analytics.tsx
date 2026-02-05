import { useState, useMemo } from 'react';
import { 
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  BarChart3,
  Loader2
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
import { useQuery } from '@tanstack/react-query';
import { analyticsAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

export default function Analytics() {
  const [dateRange, setDateRange] = useState('month');
  const { toast } = useToast();

  // Calculate date range
  const getDateRange = (period: string) => {
    const now = new Date();
    let startDate: Date;
    let endDate = new Date(now);

    switch (period) {
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate = new Date(now);
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate = new Date(0);
    }

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    };
  };

  const dateRangeParams = getDateRange(dateRange);

  // Fetch dashboard metrics from API
  const { data: dashboardMetricsResponse, isLoading: isLoadingMetrics, isError: isDashboardError } = useQuery({
    queryKey: ['analytics', 'dashboard', dateRange, dateRangeParams],
    queryFn: async () => {
      try {
        const response = await analyticsAPI.getDashboardMetrics({
          period: dateRange,
          ...dateRangeParams,
        });
        return response.data;
      } catch (error) {
        console.error('Error fetching dashboard metrics:', error);
        return null;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });

  // Fetch revenue data from API
  const { data: revenueDataResponse, isLoading: isLoadingRevenue, isError: isRevenueError } = useQuery({
    queryKey: ['analytics', 'revenue', dateRange, dateRangeParams],
    queryFn: async () => {
      try {
        const response = await analyticsAPI.getRevenueData({
          period: dateRange,
          ...dateRangeParams,
        });
        return response.data || [];
      } catch (error) {
        console.error('Error fetching revenue data:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  // Fetch product analytics from API
  const { data: productDataResponse, isLoading: isLoadingProducts, isError: isProductError } = useQuery({
    queryKey: ['analytics', 'products', dateRange, dateRangeParams],
    queryFn: async () => {
      try {
        const response = await analyticsAPI.getProductAnalytics({
          period: dateRange,
          ...dateRangeParams,
          limit: 10,
        });
        return response.data || [];
      } catch (error) {
        console.error('Error fetching product analytics:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  // Fetch category analytics from API
  const { data: categoryDataResponse, isLoading: isLoadingCategories, isError: isCategoryError } = useQuery({
    queryKey: ['analytics', 'categories', dateRange, dateRangeParams],
    queryFn: async () => {
      try {
        const response = await analyticsAPI.getCategoryAnalytics({
          period: dateRange,
          ...dateRangeParams,
        });
        return response.data || [];
      } catch (error) {
        console.error('Error fetching category analytics:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  // Fetch company analytics from API
  const { data: companyDataResponse, isLoading: isLoadingCompanies, isError: isCompanyError } = useQuery({
    queryKey: ['analytics', 'companies', dateRange, dateRangeParams],
    queryFn: async () => {
      try {
        const response = await analyticsAPI.getCompanyAnalytics({
          period: dateRange,
          ...dateRangeParams,
        });
        return response.data || [];
      } catch (error) {
        console.error('Error fetching company analytics:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  // Fetch user analytics from API
  const { data: userDataResponse, isLoading: isLoadingUsers, isError: isUserError } = useQuery({
    queryKey: ['analytics', 'users', dateRange, dateRangeParams],
    queryFn: async () => {
      try {
        const response = await analyticsAPI.getUserAnalytics({
          period: dateRange,
          ...dateRangeParams,
        });
        return response.data || [];
      } catch (error) {
        console.error('Error fetching user analytics:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  // Fetch order analytics from API
  const { data: orderDataResponse, isLoading: isLoadingOrders, isError: isOrderError } = useQuery({
    queryKey: ['analytics', 'orders', dateRange, dateRangeParams],
    queryFn: async () => {
      try {
        const response = await analyticsAPI.getOrderAnalytics({
          period: dateRange,
          ...dateRangeParams,
        });
        return response.data || {};
      } catch (error) {
        console.error('Error fetching order analytics:', error);
        return {};
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  // Extract metrics from response with safe defaults
  const metrics = {
    totalRevenue: dashboardMetricsResponse?.totalRevenue ?? 0,
    totalOrders: dashboardMetricsResponse?.totalOrders ?? 0,
    activeUsers: dashboardMetricsResponse?.activeUsers ?? 0,
    avgOrderValue: dashboardMetricsResponse?.avgOrderValue ?? 0,
    revenueChange: dashboardMetricsResponse?.revenueChange ?? 0,
    ordersChange: dashboardMetricsResponse?.ordersChange ?? 0,
    usersChange: dashboardMetricsResponse?.usersChange ?? 0,
    avgOrderValueChange: dashboardMetricsResponse?.avgOrderValueChange ?? 0,
  };

  // Prepare chart data from API responses only; empty arrays when no data
  const chartData = useMemo(() => {
    const revenueData = Array.isArray(revenueDataResponse)
      ? revenueDataResponse.map((item: any) => ({
          period: item.period || '',
          revenue: item.revenue || 0,
          orders: item.orders || 0,
        }))
      : [];

    const productPerformance = Array.isArray(productDataResponse)
      ? productDataResponse.map((item: any) => ({
          name: item.name || 'Unknown',
          sales: item.sales || 0,
          revenue: item.revenue || 0,
        }))
      : [];

    const categoryPerformance = Array.isArray(categoryDataResponse)
      ? categoryDataResponse.map((item: any) => ({
          name: item.name || 'Unknown',
          sales: item.sales || 0,
          revenue: item.revenue || 0,
        }))
      : [];

    const companyPerformance = Array.isArray(companyDataResponse)
      ? companyDataResponse.map((item: any) => ({
          name: item.name || 'Unknown',
          revenue: item.revenue || 0,
          orders: item.orders || 0,
        }))
      : [];

    const userGrowthData = Array.isArray(userDataResponse)
      ? userDataResponse.map((item: any) => ({
          period: item.period || '',
          users: item.users || 0,
          newUsers: item.newUsers || 0,
        }))
      : [];

    const orderAnalytics = orderDataResponse || {};
    const orderStatusData = Array.isArray(orderAnalytics.statusDistribution)
      ? orderAnalytics.statusDistribution.map((item: any) => ({
          name: item.name || '',
          value: item.value || 0,
          color: item.color || '#1E6DD8',
        }))
      : [];
    const paymentMethodData = Array.isArray(orderAnalytics.paymentMethodDistribution)
      ? orderAnalytics.paymentMethodDistribution.map((item: any) => ({
          name: item.name || '',
          value: item.value || 0,
          color: item.color || '#1E6DD8',
        }))
      : [];

    return {
      revenueData,
      productPerformance,
      categoryPerformance,
      companyPerformance,
      userGrowthData,
      orderStatusData,
      paymentMethodData,
    };
  }, [
    revenueDataResponse,
    productDataResponse,
    categoryDataResponse,
    companyDataResponse,
    userDataResponse,
    orderDataResponse,
  ]);

  const isLoadingData = isLoadingRevenue || isLoadingProducts || isLoadingCategories ||
    isLoadingCompanies || isLoadingUsers || isLoadingOrders;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleExport = async () => {
    try {
      const blob = await analyticsAPI.exportAnalyticsReport({
        period: dateRange,
        ...dateRangeParams,
        format: 'csv',
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `analytics-report-${dateRange}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: 'Report exported',
        description: 'Analytics report has been downloaded successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error?.message || 'Failed to export report',
        variant: 'destructive',
      });
    }
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
          <Button variant="outline" onClick={handleExport}>
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
                {isLoadingMetrics ? (
                  <Skeleton className="h-8 w-32 mt-1" />
                ) : (
                  <>
                    <p className="text-2xl font-bold text-foreground mt-1">
                      {formatCurrency(metrics.totalRevenue)}
                    </p>
                    <p className={`text-xs mt-1 flex items-center gap-1 ${
                      metrics.revenueChange >= 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {metrics.revenueChange >= 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {metrics.revenueChange >= 0 ? '+' : ''}{(metrics.revenueChange ?? 0).toFixed(1)}% vs last period
                    </p>
                  </>
                )}
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
                {isLoadingMetrics ? (
                  <Skeleton className="h-8 w-32 mt-1" />
                ) : (
                  <>
                    <p className="text-2xl font-bold text-foreground mt-1">
                      {metrics.totalOrders.toLocaleString()}
                    </p>
                    <p className={`text-xs mt-1 flex items-center gap-1 ${
                      metrics.ordersChange >= 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {metrics.ordersChange >= 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {metrics.ordersChange >= 0 ? '+' : ''}{(metrics.ordersChange ?? 0).toFixed(1)}% vs last period
                    </p>
                  </>
                )}
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
                {isLoadingMetrics ? (
                  <Skeleton className="h-8 w-32 mt-1" />
                ) : (
                  <>
                    <p className="text-2xl font-bold text-foreground mt-1">
                      {metrics.activeUsers.toLocaleString()}
                    </p>
                    <p className={`text-xs mt-1 flex items-center gap-1 ${
                      metrics.usersChange >= 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {metrics.usersChange >= 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {metrics.usersChange >= 0 ? '+' : ''}{(metrics.usersChange ?? 0).toFixed(1)}% vs last period
                    </p>
                  </>
                )}
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
                {isLoadingMetrics ? (
                  <Skeleton className="h-8 w-32 mt-1" />
                ) : (
                  <>
                    <p className="text-2xl font-bold text-foreground mt-1">
                      {formatCurrency(metrics.avgOrderValue)}
                    </p>
                    <p className={`text-xs mt-1 flex items-center gap-1 ${
                      metrics.avgOrderValueChange >= 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {metrics.avgOrderValueChange >= 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {metrics.avgOrderValueChange >= 0 ? '+' : ''}{(metrics.avgOrderValueChange ?? 0).toFixed(1)}% vs last period
                    </p>
                  </>
                )}
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
                {isLoadingData ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData.revenueData}>
                      <defs>
                        <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1E6DD8" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#1E6DD8" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="period" stroke="#6B7280" />
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
                )}
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
                {isLoadingData ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData.productPerformance}>
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
                )}
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
                {isLoadingData ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData.categoryPerformance} layout="vertical">
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
                )}
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
                {isLoadingData ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData.companyPerformance}>
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
                )}
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
                {isLoadingData ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData.userGrowthData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="period" stroke="#6B7280" />
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
                )}
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
                  {isLoadingData ? (
                    <div className="h-full flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData.orderStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                      >
                          {chartData.orderStatusData.map((entry, index) => (
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
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {chartData.orderStatusData.map((item) => (
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
                  {isLoadingData ? (
                    <div className="h-full flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData.paymentMethodData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                          {chartData.paymentMethodData.map((entry, index) => (
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
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

