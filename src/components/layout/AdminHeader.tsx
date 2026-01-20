import { Bell, Search, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { SidebarTrigger } from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export function AdminHeader() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    const confirmed = window.confirm('Are you sure you want to logout?');
    if (confirmed) {
      logout();
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const getRoleBadge = (role: string) => {
    const roleLabels: Record<string, string> = {
      super_admin: 'Super Admin',
      admin: 'Admin',
      manager: 'Manager',
      seller: 'Seller',
      support: 'Support',
    };
    return roleLabels[role] || role;
  };

  return (
    <header className="h-16 border-b border-border bg-card px-4 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="h-9 w-9">
          <Menu className="h-5 w-5" />
        </SidebarTrigger>

        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products, orders, users..."
            className="w-80 pl-10 bg-secondary/50 border-0 focus-visible:ring-primary"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                5
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 bg-popover">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
              <span className="font-medium">New order received</span>
              <span className="text-xs text-muted-foreground">Order #ORD-2024-001 - ₹12,500</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
              <span className="font-medium">KYC verification pending</span>
              <span className="text-xs text-muted-foreground">3 new submissions awaiting review</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
              <span className="font-medium">Low stock alert</span>
              <span className="text-xs text-muted-foreground">5 products are running low on stock</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-3 h-auto py-2 px-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {user ? getInitials(user.name) : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:flex flex-col items-start">
                <span className="text-sm font-medium">{user?.name}</span>
                <span className="text-xs text-muted-foreground">{getRoleBadge(user?.role || '')}</span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-popover">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile Settings</DropdownMenuItem>
            <DropdownMenuItem>Activity Log</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
