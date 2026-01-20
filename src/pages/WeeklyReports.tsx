import { useState, useMemo } from 'react';
import { 
  Download,
  Calendar,
  MapPin,
  Users,
  UserCheck,
  UserX,
  TrendingUp,
  FileText,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { reportsAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart,
  Bar,
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

const COLORS = ['#1E6DD8', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export default function WeeklyReports() {
  const [selectedWeek, setSelectedWeek] = useState<string>('current');
  const { toast } = useToast();

  // Calculate week range
  const getWeekRange = (weekType: string) => {
    const now = new Date();
    const currentDay = now.getDay();
    const diff = now.getDate() - currentDay + (currentDay === 0 ? -6 : 1); // Adjust to Monday
    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    
    if (weekType === 'current') {
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);
      return { start: monday.toISOString().split('T')[0], end: sunday.toISOString().split('T')[0] };
    } else if (weekType === 'last') {
      const lastMonday = new Date(monday);
      lastMonday.setDate(monday.getDate() - 7);
      const lastSunday = new Date(lastMonday);
      lastSunday.setDate(lastMonday.getDate() + 6);
      lastSunday.setHours(23, 59, 59, 999);
      return { start: lastMonday.toISOString().split('T')[0], end: lastSunday.toISOString().split('T')[0] };
    }
    return { start: monday.toISOString().split('T')[0], end: new Date().toISOString().split('T')[0] };
  };

  const weekRange = getWeekRange(selectedWeek);

  // Fetch weekly user location report
  const {
    data: locationReport,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['weeklyReports', 'userLocation', weekRange],
    queryFn: async () => {
      const response = await reportsAPI.getWeeklyUserLocationReport(weekRange.start, weekRange.end);
      return response.data || { locations: [], summary: { totalActive: 0, totalInactive: 0, totalUsers: 0 } };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const locations = locationReport?.locations || [];
  const summary = locationReport?.summary || { totalActive: 0, totalInactive: 0, totalUsers: 0 };

  // Prepare chart data
  const locationChartData = useMemo(() => {
    return locations.map((loc: any) => ({
      name: loc.city || loc.state || 'Unknown',
      active: loc.activeUsers || 0,
      inactive: loc.inactiveUsers || 0,
      total: (loc.activeUsers || 0) + (loc.inactiveUsers || 0),
    }));
  }, [locations]);

  const statusPieData = [
    { name: 'Active Users', value: summary.totalActive },
    { name: 'Inactive Users', value: summary.totalInactive },
  ];

  const handleExport = async () => {
    try {
      const blob = await reportsAPI.exportWeeklyUserLocationReport(weekRange.start, weekRange.end);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `weekly-user-location-report-${weekRange.start}-to-${weekRange.end}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast({
        title: 'Report exported',
        description: 'Weekly user location report has been downloaded successfully',
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
          <h1 className="text-2xl font-bold text-foreground">Weekly Reports</h1>
          <p className="text-muted-foreground">User location and activity insights</p>
        </div>
        <div className="flex gap-3">
          <Select value={selectedWeek} onValueChange={setSelectedWeek}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Week" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current">This Week</SelectItem>
              <SelectItem value="last">Last Week</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">{summary.totalUsers}</p>
                )}
                <p className="text-xs text-muted-foreground">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100">
                <UserCheck className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">{summary.totalActive}</p>
                )}
                <p className="text-xs text-muted-foreground">Active Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100">
                <UserX className="h-5 w-5 text-red-600" />
              </div>
              <div>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">{summary.totalInactive}</p>
                )}
                <p className="text-xs text-muted-foreground">Inactive Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-100">
                <MapPin className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">{locations.length}</p>
                )}
                <p className="text-xs text-muted-foreground">Locations</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Location Bar Chart */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Users by Location</CardTitle>
            <CardDescription>Active and inactive users across different locations</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[400px] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : isError ? (
              <div className="h-[400px] flex items-center justify-center text-destructive">
                <p>Error loading data: {error instanceof Error ? error.message : 'Unknown error'}</p>
              </div>
            ) : locationChartData.length === 0 ? (
              <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                <p>No data available for this week</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={locationChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    interval={0}
                  />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="active" fill="#10B981" name="Active Users" />
                  <Bar dataKey="inactive" fill="#EF4444" name="Inactive Users" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Status Pie Chart */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>User Status Distribution</CardTitle>
            <CardDescription>Active vs inactive users</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-[400px] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : isError ? (
              <div className="h-[400px] flex items-center justify-center text-destructive">
                <p>Error loading data</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={statusPieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Location Details Table */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Location Details</CardTitle>
          <CardDescription>
            Week: {new Date(weekRange.start).toLocaleDateString()} - {new Date(weekRange.end).toLocaleDateString()}
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
            <div className="p-8 text-center text-destructive">
              <p>Error loading location data: {error instanceof Error ? error.message : 'Unknown error'}</p>
            </div>
          ) : locations.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <p>No location data available for this week</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary/50">
                  <tr className="border-b border-border">
                    <th className="py-4 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Location
                    </th>
                    <th className="py-4 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      State
                    </th>
                    <th className="py-4 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      City
                    </th>
                    <th className="py-4 px-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Active Users
                    </th>
                    <th className="py-4 px-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Inactive Users
                    </th>
                    <th className="py-4 px-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Total Users
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {locations.map((location: any, index: number) => (
                    <tr
                      key={index}
                      className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-foreground">
                            {location.city && location.state
                              ? `${location.city}, ${location.state}`
                              : location.city || location.state || 'Unknown'}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-muted-foreground">
                        {location.state || '-'}
                      </td>
                      <td className="py-4 px-4 text-muted-foreground">
                        {location.city || '-'}
                      </td>
                      <td className="py-4 px-4 text-right font-semibold text-emerald-600">
                        {location.activeUsers || 0}
                      </td>
                      <td className="py-4 px-4 text-right font-semibold text-red-600">
                        {location.inactiveUsers || 0}
                      </td>
                      <td className="py-4 px-4 text-right font-semibold text-foreground">
                        {(location.activeUsers || 0) + (location.inactiveUsers || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
