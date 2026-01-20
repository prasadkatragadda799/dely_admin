import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Building2,
  FolderTree,
  Tag,
  FileCheck,
  BarChart3,
  Settings,
  LogOut,
  ChevronDown,
  FileText,
  Truck,
  MapPin,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useState } from 'react';

const mainNavItems = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Products', url: '/products', icon: Package },
  { title: 'Orders', url: '/orders', icon: ShoppingCart },
  { title: 'Users', url: '/users', icon: Users },
];

const managementItems = [
  { title: 'Delivery Persons', url: '/delivery/persons', icon: Truck },
  { title: 'Delivery Tracking', url: '/delivery/tracking', icon: MapPin },
  { title: 'Companies & Brands', url: '/companies', icon: Building2 },
  { title: 'Categories', url: '/categories', icon: FolderTree },
  { title: 'Offers', url: '/offers', icon: Tag },
  { title: 'KYC Verification', url: '/kyc', icon: FileCheck },
  { title: 'Inventory Management', url: '/inventory', icon: Package },
];

const systemItems = [
  { title: 'Analytics', url: '/analytics', icon: BarChart3 },
  { title: 'Weekly Reports', url: '/reports', icon: FileText },
  { title: 'Settings', url: '/settings', icon: Settings },
];

export function AdminSidebar() {
  const location = useLocation();
  const { logout, user } = useAuth();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';
  const [managementOpen, setManagementOpen] = useState(true);
  const [systemOpen, setSystemOpen] = useState(true);

  const isActive = (url: string) => location.pathname === url;

  const role = user?.role;
  const isSeller = role === 'seller';
  const isSupport = role === 'support';
  const isManager = role === 'manager';
  const isAdmin = role === 'admin' || role === 'super_admin';

  const visibleMainItems = (() => {
    if (isSeller) {
      return [
        { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
        { title: 'Products', url: '/products', icon: Package },
        { title: 'Profile', url: '/profile', icon: Settings },
      ];
    }
    if (isManager) {
      return [
        { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
        { title: 'Analytics', url: '/analytics', icon: BarChart3 },
        { title: 'Weekly Reports', url: '/reports', icon: FileText },
      ];
    }
    if (isSupport) {
      // Support can view but backend should enforce read-only
      return mainNavItems;
    }
    return mainNavItems;
  })();

  const visibleManagementItems = (() => {
    if (isSeller || isManager) return [];
    const items = [...managementItems];
    if (isAdmin) {
      items.unshift({ title: 'Sellers', url: '/sellers', icon: Users });
    }
    return items;
  })();

  const visibleSystemItems = (() => {
    if (isSeller) return [];
    if (isManager) return [];
    return systemItems;
  })();

  const handleLogout = () => {
    const confirmed = window.confirm('Are you sure you want to logout?');
    if (confirmed) {
      logout();
    }
  };

  const NavItem = ({ item }: { item: { title: string; url: string; icon: React.ElementType } }) => (
    <SidebarMenuItem>
      <SidebarMenuButton asChild>
        <NavLink
          to={item.url}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
            isActive(item.url)
              ? 'bg-secondary text-primary border-l-4 border-primary'
              : 'text-sidebar-foreground hover:bg-secondary/50 hover:text-primary'
          )}
        >
          <item.icon className="h-5 w-5 shrink-0" />
          {!isCollapsed && <span>{item.title}</span>}
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-blue">
            <span className="text-primary-foreground font-bold text-lg">D</span>
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="text-xl font-bold text-foreground">Dely</h1>
              <p className="text-xs text-muted-foreground">Admin Panel</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4 scrollbar-thin">
        {/* Main Navigation */}
        <SidebarGroup>
          {!isCollapsed && (
            <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
              Main
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {visibleMainItems.map((item) => (
                <NavItem key={item.url} item={item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Management */}
        {visibleManagementItems.length > 0 && (
          <SidebarGroup className="mt-6">
          <Collapsible open={managementOpen} onOpenChange={setManagementOpen}>
            {!isCollapsed && (
              <CollapsibleTrigger className="flex items-center justify-between w-full px-3 mb-2 group">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Management
                </span>
                <ChevronDown
                  className={cn(
                    'h-4 w-4 text-muted-foreground transition-transform duration-200',
                    managementOpen ? 'rotate-0' : '-rotate-90'
                  )}
                />
              </CollapsibleTrigger>
            )}
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {visibleManagementItems.map((item) => (
                    <NavItem key={item.url} item={item} />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
          </SidebarGroup>
        )}

        {/* System */}
        {visibleSystemItems.length > 0 && (
          <SidebarGroup className="mt-6">
          <Collapsible open={systemOpen} onOpenChange={setSystemOpen}>
            {!isCollapsed && (
              <CollapsibleTrigger className="flex items-center justify-between w-full px-3 mb-2 group">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  System
                </span>
                <ChevronDown
                  className={cn(
                    'h-4 w-4 text-muted-foreground transition-transform duration-200',
                    systemOpen ? 'rotate-0' : '-rotate-90'
                  )}
                />
              </CollapsibleTrigger>
            )}
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {visibleSystemItems.map((item) => (
                    <NavItem key={item.url} item={item} />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-3 border-t border-sidebar-border">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-all duration-200"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
