import { useState } from 'react';
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
  Phone
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

// Mock data
const users = [
  {
    id: 1,
    name: 'Rajesh Sharma',
    email: 'rajesh@sharmatraders.com',
    phone: '+91 98765 43210',
    business: 'Sharma Trading Co.',
    gstNumber: '27AABCS1234A1ZE',
    kycStatus: 'verified',
    status: 'active',
    totalOrders: 45,
    totalSpent: 245000,
    registeredDate: '2023-06-15',
  },
  {
    id: 2,
    name: 'Priya Kumar',
    email: 'priya@kumarenterprises.in',
    phone: '+91 87654 32109',
    business: 'Kumar Enterprises',
    gstNumber: '27AABCK5678B2ZF',
    kycStatus: 'verified',
    status: 'active',
    totalOrders: 32,
    totalSpent: 189000,
    registeredDate: '2023-08-20',
  },
  {
    id: 3,
    name: 'Amit Patel',
    email: 'amit@patelsons.com',
    phone: '+91 76543 21098',
    business: 'Patel & Sons',
    gstNumber: 'Pending',
    kycStatus: 'pending',
    status: 'active',
    totalOrders: 12,
    totalSpent: 67000,
    registeredDate: '2024-01-05',
  },
  {
    id: 4,
    name: 'Suresh Gupta',
    email: 'suresh@guptastore.in',
    phone: '+91 65432 10987',
    business: 'Gupta Store',
    gstNumber: '27AABCG9012C3ZG',
    kycStatus: 'verified',
    status: 'inactive',
    totalOrders: 8,
    totalSpent: 34000,
    registeredDate: '2023-11-10',
  },
  {
    id: 5,
    name: 'Harpreet Singh',
    email: 'harpreet@singhretail.com',
    phone: '+91 54321 09876',
    business: 'Singh Retail',
    gstNumber: 'Rejected',
    kycStatus: 'rejected',
    status: 'active',
    totalOrders: 0,
    totalSpent: 0,
    registeredDate: '2024-01-10',
  },
  {
    id: 6,
    name: 'Vikram Mehta',
    email: 'vikram@mehtatrading.in',
    phone: '+91 43210 98765',
    business: 'Mehta Trading',
    gstNumber: '27AABCM3456D4ZH',
    kycStatus: 'verified',
    status: 'active',
    totalOrders: 67,
    totalSpent: 456000,
    registeredDate: '2023-04-22',
  },
];

const userStats = [
  { label: 'Total Users', value: 456, icon: Users, color: 'bg-blue-100 text-blue-600' },
  { label: 'Active Users', value: 398, icon: UserCheck, color: 'bg-emerald-100 text-emerald-600' },
  { label: 'KYC Verified', value: 312, icon: Shield, color: 'bg-indigo-100 text-indigo-600' },
  { label: 'Pending KYC', value: 23, icon: UserX, color: 'bg-amber-100 text-amber-600' },
];

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState('');

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
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    return <Badge variant={status === 'active' ? 'active' : 'inactive'}>{status}</Badge>;
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
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
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
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
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <Select defaultValue="all">
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
              <Select defaultValue="all">
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="User Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="shadow-card">
        <CardContent className="p-0">
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
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                            {getInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">{user.name}</p>
                          <p className="text-xs text-muted-foreground">ID: #{user.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        <p className="text-sm text-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          {user.email}
                        </p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {user.phone}
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-medium text-foreground">{user.business}</p>
                      <p className="text-xs text-muted-foreground">{user.gstNumber}</p>
                    </td>
                    <td className="py-4 px-4">
                      {getKycBadge(user.kycStatus)}
                    </td>
                    <td className="py-4 px-4">
                      {getStatusBadge(user.status)}
                    </td>
                    <td className="py-4 px-4 text-foreground font-medium">{user.totalOrders}</td>
                    <td className="py-4 px-4 text-foreground font-medium">{formatCurrency(user.totalSpent)}</td>
                    <td className="py-4 px-4 text-muted-foreground text-sm">{formatDate(user.registeredDate)}</td>
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
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Shield className="h-4 w-4 mr-2" />
                            Verify KYC
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive">
                            <UserX className="h-4 w-4 mr-2" />
                            Block User
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
              Showing <strong>1-6</strong> of <strong>456</strong> users
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
      </Card>
    </div>
  );
}
