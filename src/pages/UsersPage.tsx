import { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  Eye,
  Download,
  UserPlus,
  Users,
  UserCheck,
  UserX,
  Shield,
  Mail,
  Phone,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import { usersAPI } from '@/lib/api';
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

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKycStatus, setSelectedKycStatus] = useState<string>('all');
  const [selectedUserStatus, setSelectedUserStatus] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [blockingUserId, setBlockingUserId] = useState<string | null>(null);
  const [blockReason, setBlockReason] = useState('');
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

    if (selectedKycStatus && selectedKycStatus !== 'all') {
      filterParams.kycStatus = selectedKycStatus;
    }

    if (selectedUserStatus === 'active') {
      filterParams.isActive = true;
    } else if (selectedUserStatus === 'inactive') {
      filterParams.isActive = false;
    }

    return filterParams;
  }, [searchQuery, selectedKycStatus, selectedUserStatus, page, limit]);

  // Fetch users
  const {
    data: usersResponse,
    isLoading,
    isError,
    error,
    isFetching,
  } = useQuery({
    queryKey: ['users', filters],
    queryFn: async () => {
      const response = await usersAPI.getUsers(filters);
      
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
        
        // Case 3: Response has users array
        if (responseData && responseData.users && Array.isArray(responseData.users)) {
          return {
            items: responseData.users,
            pagination: {
              page: responseData.page || filters.page || 1,
              limit: responseData.limit || filters.limit || 20,
              total: responseData.total || responseData.users.length,
              totalPages: responseData.totalPages || Math.ceil((responseData.total || responseData.users.length) / (responseData.limit || filters.limit || 20)),
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

  const users = usersResponse?.items || [];
  const pagination = usersResponse?.pagination || {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  };

  // Block/Unblock user mutation
  const blockUserMutation = useMutation({
    mutationFn: ({ userId, isActive, reason }: { userId: string; isActive: boolean; reason?: string }) =>
      usersAPI.blockUser(userId, isActive, reason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: variables.isActive ? 'User unblocked' : 'User blocked',
        description: variables.isActive
          ? 'User has been unblocked successfully'
          : 'User has been blocked successfully',
      });
      setBlockingUserId(null);
      setBlockReason('');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error?.message || 'Failed to update user status',
        variant: 'destructive',
      });
      setBlockingUserId(null);
    },
  });

  // Calculate stats from users data
  const stats = useMemo(() => {
    const total = pagination.total || users.length;
    const active = users.filter((u: any) => {
      const isActive = u.isActive !== undefined ? u.isActive : (u.is_active !== undefined ? u.is_active : true);
      return isActive;
    }).length;
    const kycVerified = users.filter((u: any) => {
      const kycStatus = u.kycStatus || u.kyc_status || 'pending';
      return kycStatus === 'verified';
    }).length;
    const kycPending = users.filter((u: any) => {
      const kycStatus = u.kycStatus || u.kyc_status || 'pending';
      return kycStatus === 'pending';
    }).length;

    return { total, active, kycVerified, kycPending };
  }, [users, pagination]);

  const userStats = [
    { label: 'Total Users', value: stats.total, icon: Users, color: 'bg-blue-100 text-blue-600' },
    { label: 'Active Users', value: stats.active, icon: UserCheck, color: 'bg-emerald-100 text-emerald-600' },
    { label: 'KYC Verified', value: stats.kycVerified, icon: Shield, color: 'bg-indigo-100 text-indigo-600' },
    { label: 'Pending KYC', value: stats.kycPending, icon: UserX, color: 'bg-amber-100 text-amber-600' },
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getKycBadge = (status: string) => {
    const variants: Record<string, any> = {
      verified: 'verified',
      pending: 'pending',
      rejected: 'rejected',
    };
    return <Badge variant={variants[status] || 'pending'}>{status || 'pending'}</Badge>;
  };

  const getStatusBadge = (isActive: boolean) => {
    return <Badge variant={isActive ? 'active' : 'inactive'}>{isActive ? 'active' : 'inactive'}</Badge>;
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatDate = (dateString: string | Date) => {
    if (!dateString) return '-';
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleBlockUser = (userId: string, isCurrentlyActive: boolean) => {
    setBlockingUserId(userId);
    if (!isCurrentlyActive) {
      // Unblock immediately without reason
      blockUserMutation.mutate({ userId, isActive: true });
    }
  };

  const confirmBlock = () => {
    if (blockingUserId) {
      const user = users.find((u: any) => u.id === blockingUserId);
      const isCurrentlyActive = user?.isActive !== undefined 
        ? user.isActive 
        : (user?.is_active !== undefined ? user.is_active : true);
      blockUserMutation.mutate({ 
        userId: blockingUserId, 
        isActive: false, 
        reason: blockReason || undefined 
      });
    }
  };

  const handleViewProfile = (userId: string) => {
    // TODO: Implement user detail view/modal
    toast({
      title: 'View Profile',
      description: 'User profile view coming soon',
    });
  };

  const handleVerifyKYC = (userId: string) => {
    // TODO: Navigate to KYC page or open KYC verification modal
    toast({
      title: 'Verify KYC',
      description: 'Redirecting to KYC verification...',
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Users</h1>
          <p className="text-muted-foreground">Manage registered users and KYC verifications</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="gradient">
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {userStats.map((stat, index) => (
          <Card key={index} className="shadow-card hover:shadow-card-hover transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  {isLoading && !usersResponse ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  )}
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="shadow-card">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, phone, or business..."
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
                value={selectedKycStatus} 
                onValueChange={(value) => {
                  setSelectedKycStatus(value);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="KYC Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Select 
                value={selectedUserStatus} 
                onValueChange={(value) => {
                  setSelectedUserStatus(value);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="User Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedKycStatus('all');
                  setSelectedUserStatus('all');
                  setPage(1);
                }}
              >
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="shadow-card">
        <CardContent className="p-0">
          {isLoading && !usersResponse ? (
            <div className="p-8 space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : isError ? (
            <div className="p-8 text-center">
              <p className="text-destructive">
                Error loading users: {error instanceof Error ? error.message : 'Unknown error'}
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => queryClient.invalidateQueries({ queryKey: ['users'] })}
              >
                Retry
              </Button>
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No users found</p>
            </div>
          ) : (
            <>
              {isFetching && usersResponse && (
                <div className="absolute top-0 right-0 p-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-secondary/50">
                    <tr className="border-b border-border">
                      <th className="py-4 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">User</th>
                      <th className="py-4 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contact</th>
                      <th className="py-4 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Business</th>
                      <th className="py-4 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">KYC Status</th>
                      <th className="py-4 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                      <th className="py-4 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Orders</th>
                      <th className="py-4 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Spent</th>
                      <th className="py-4 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Registered</th>
                      <th className="py-4 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user: any) => {
                      // Handle both camelCase and snake_case field names
                      const userId = user.id;
                      const userName = user.name || user.fullName || 'Unknown User';
                      const userEmail = user.email || '';
                      const userPhone = user.phone || user.phoneNumber || '';
                      const businessName = user.businessName || user.business_name || user.companyName || '-';
                      const gstNumber = user.gstNumber || user.gst_number || user.gst || '-';
                      const kycStatus = user.kycStatus || user.kyc_status || 'pending';
                      const isActive = user.isActive !== undefined ? user.isActive : (user.is_active !== undefined ? user.is_active : true);
                      const totalOrders = user.totalOrders || user.total_orders || user.ordersCount || 0;
                      const totalSpent = user.totalSpent || user.total_spent || user.lifetimeValue || 0;
                      const registeredDate = user.createdAt || user.created_at || user.registeredDate || user.registered_date;

                      return (
                        <tr key={userId} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                                  {getInitials(userName)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-foreground">{userName}</p>
                                <p className="text-xs text-muted-foreground">ID: {userId.slice(0, 8)}...</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="space-y-1">
                              {userEmail && (
                                <p className="text-sm text-foreground flex items-center gap-1">
                                  <Mail className="h-3 w-3 text-muted-foreground" />
                                  {userEmail}
                                </p>
                              )}
                              {userPhone && (
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {userPhone}
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <p className="font-medium text-foreground">{businessName}</p>
                            {gstNumber !== '-' && (
                              <p className="text-xs text-muted-foreground">{gstNumber}</p>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            {getKycBadge(kycStatus)}
                          </td>
                          <td className="py-4 px-4">
                            {getStatusBadge(isActive)}
                          </td>
                          <td className="py-4 px-4 text-foreground font-medium">{totalOrders}</td>
                          <td className="py-4 px-4 text-foreground font-medium">{formatCurrency(totalSpent)}</td>
                          <td className="py-4 px-4 text-muted-foreground text-sm">{formatDate(registeredDate)}</td>
                          <td className="py-4 px-4">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-popover">
                                <DropdownMenuItem onClick={() => handleViewProfile(userId)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleVerifyKYC(userId)}>
                                  <Shield className="h-4 w-4 mr-2" />
                                  Verify KYC
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className={isActive ? "text-destructive focus:text-destructive" : ""}
                                  onClick={() => handleBlockUser(userId, isActive)}
                                >
                                  <UserX className="h-4 w-4 mr-2" />
                                  {isActive ? 'Block User' : 'Unblock User'}
                                </DropdownMenuItem>
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
                  <strong>{pagination.total}</strong> users
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
      </Card>

      {/* Block User Confirmation Dialog */}
      <AlertDialog open={!!blockingUserId && blockUserMutation.isPending === false} onOpenChange={() => {
        if (!blockUserMutation.isPending) {
          setBlockingUserId(null);
          setBlockReason('');
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Block User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to block this user? They will not be able to access their account.
              You can optionally provide a reason for blocking.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Reason (Optional)</label>
              <Input
                placeholder="Enter reason for blocking..."
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={blockUserMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBlock}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={blockUserMutation.isPending}
            >
              {blockUserMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Blocking...
                </>
              ) : (
                'Block User'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
