import { useState } from 'react';
import { 
  Save,
  Upload,
  Building2,
  CreditCard,
  Truck,
  Receipt,
  Users,
  Mail,
  MessageSquare,
  Bell,
  Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';

// Mock admin users
const adminUsers = [
  {
    id: 1,
    name: 'Rajesh Kumar',
    email: 'admin@dely.com',
    role: 'super_admin',
    status: 'active',
    lastLogin: '2024-01-15 10:30 AM',
  },
  {
    id: 2,
    name: 'Priya Sharma',
    email: 'manager@dely.com',
    role: 'manager',
    status: 'active',
    lastLogin: '2024-01-15 09:15 AM',
  },
  {
    id: 3,
    name: 'Amit Patel',
    email: 'support@dely.com',
    role: 'support',
    status: 'active',
    lastLogin: '2024-01-14 04:20 PM',
  },
];

export default function Settings() {
  const [isAdminDialogOpen, setIsAdminDialogOpen] = useState(false);

  const getRoleBadge = (role: string) => {
    const variants: Record<string, any> = {
      super_admin: { label: 'Super Admin', variant: 'delivered' },
      admin: { label: 'Admin', variant: 'confirmed' },
      manager: { label: 'Manager', variant: 'pending' },
      support: { label: 'Support', variant: 'secondary' },
    };
    const roleInfo = variants[role] || { label: role, variant: 'secondary' };
    return <Badge variant={roleInfo.variant}>{roleInfo.label}</Badge>;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Configure system settings and preferences</p>
        </div>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="payment">Payment</TabsTrigger>
          <TabsTrigger value="delivery">Delivery</TabsTrigger>
          <TabsTrigger value="tax">Tax</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="admins">Admins</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Configure basic application settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="app-name">App Name</Label>
                <Input id="app-name" defaultValue="Dely B2B" />
              </div>
              <div className="space-y-2">
                <Label>App Logo</Label>
                <div className="flex items-center gap-4">
                  <div className="h-20 w-20 rounded-lg bg-secondary border-2 border-dashed border-border flex items-center justify-center">
                    <Globe className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Logo
                  </Button>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="contact-email">Contact Email</Label>
                <Input id="contact-email" type="email" defaultValue="support@dely.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-phone">Contact Phone</Label>
                <Input id="contact-phone" defaultValue="+91 1800 123 4567" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Business Address</Label>
                <Textarea 
                  id="address" 
                  rows={3}
                  defaultValue="123 Business Park, Mumbai, Maharashtra 400001"
                />
              </div>
              <Button variant="gradient">
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Settings */}
        <TabsContent value="payment" className="space-y-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Payment Settings</CardTitle>
              <CardDescription>Configure payment gateways and methods</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="credit-enabled">Credit Payment</Label>
                    <p className="text-xs text-muted-foreground">
                      Allow customers to pay on credit
                    </p>
                  </div>
                  <Switch id="credit-enabled" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="upi-enabled">UPI Payment</Label>
                    <p className="text-xs text-muted-foreground">
                      Enable UPI payment gateway
                    </p>
                  </div>
                  <Switch id="upi-enabled" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="bank-enabled">Bank Transfer</Label>
                    <p className="text-xs text-muted-foreground">
                      Allow bank transfer payments
                    </p>
                  </div>
                  <Switch id="bank-enabled" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="cash-enabled">Cash on Delivery</Label>
                    <p className="text-xs text-muted-foreground">
                      Enable cash on delivery option
                    </p>
                  </div>
                  <Switch id="cash-enabled" />
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="credit-limit">Default Credit Limit (₹)</Label>
                <Input id="credit-limit" type="number" defaultValue="50000" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment-terms">Payment Terms (Days)</Label>
                <Input id="payment-terms" type="number" defaultValue="30" />
              </div>
              <Button variant="gradient">
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Delivery Settings */}
        <TabsContent value="delivery" className="space-y-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Delivery Settings</CardTitle>
              <CardDescription>Configure delivery charges and service areas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="delivery-charge">Standard Delivery Charge (₹)</Label>
                <Input id="delivery-charge" type="number" defaultValue="100" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="free-delivery-threshold">Free Delivery Threshold (₹)</Label>
                <Input id="free-delivery-threshold" type="number" defaultValue="5000" />
                <p className="text-xs text-muted-foreground">
                  Orders above this amount qualify for free delivery
                </p>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="delivery-time-slots">Delivery Time Slots</Label>
                <Textarea 
                  id="delivery-time-slots" 
                  rows={4}
                  defaultValue="Morning: 9 AM - 12 PM&#10;Afternoon: 12 PM - 4 PM&#10;Evening: 4 PM - 8 PM"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="serviceable-pincodes">Serviceable Pincodes</Label>
                <Textarea 
                  id="serviceable-pincodes" 
                  rows={4}
                  placeholder="Enter pincodes separated by commas (e.g., 400001, 400002, 400003)"
                />
              </div>
              <Button variant="gradient">
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tax Settings */}
        <TabsContent value="tax" className="space-y-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Tax Settings</CardTitle>
              <CardDescription>Configure GST and tax rates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="default-gst">Default GST Rate (%)</Label>
                <Input id="default-gst" type="number" defaultValue="18" />
              </div>
              <Separator />
              <div className="space-y-4">
                <Label>GST Rates by Category</Label>
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <Input placeholder="Category" className="flex-1" defaultValue="Rice & Grains" />
                    <Input placeholder="GST %" type="number" className="w-32" defaultValue="5" />
                    <Button variant="ghost" size="icon">×</Button>
                  </div>
                  <div className="flex items-center gap-4">
                    <Input placeholder="Category" className="flex-1" defaultValue="Cooking Oil" />
                    <Input placeholder="GST %" type="number" className="w-32" defaultValue="12" />
                    <Button variant="ghost" size="icon">×</Button>
                  </div>
                  <div className="flex items-center gap-4">
                    <Input placeholder="Category" className="flex-1" defaultValue="General" />
                    <Input placeholder="GST %" type="number" className="w-32" defaultValue="18" />
                    <Button variant="ghost" size="icon">×</Button>
                  </div>
                </div>
                <Button variant="outline" size="sm">+ Add Category</Button>
              </div>
              <Button variant="gradient">
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications" className="space-y-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Configure email and SMS templates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Tabs defaultValue="email" className="w-full">
                <TabsList>
                  <TabsTrigger value="email">Email Templates</TabsTrigger>
                  <TabsTrigger value="sms">SMS Templates</TabsTrigger>
                </TabsList>
                <TabsContent value="email" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="order-confirmation-email">Order Confirmation Email</Label>
                    <Textarea 
                      id="order-confirmation-email" 
                      rows={6}
                      defaultValue="Dear {customer_name},&#10;&#10;Your order #{order_number} has been confirmed.&#10;Total Amount: ₹{total_amount}&#10;&#10;Thank you for your business!"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="order-shipped-email">Order Shipped Email</Label>
                    <Textarea 
                      id="order-shipped-email" 
                      rows={6}
                      defaultValue="Dear {customer_name},&#10;&#10;Your order #{order_number} has been shipped.&#10;Tracking Number: {tracking_number}&#10;&#10;Expected delivery: {delivery_date}"
                    />
                  </div>
                </TabsContent>
                <TabsContent value="sms" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="order-confirmation-sms">Order Confirmation SMS</Label>
                    <Textarea 
                      id="order-confirmation-sms" 
                      rows={4}
                      defaultValue="Your order #{order_number} for ₹{total_amount} has been confirmed. Thank you!"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="order-shipped-sms">Order Shipped SMS</Label>
                    <Textarea 
                      id="order-shipped-sms" 
                      rows={4}
                      defaultValue="Your order #{order_number} has been shipped. Track: {tracking_number}"
                    />
                  </div>
                </TabsContent>
              </Tabs>
              <Button variant="gradient">
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Admin Users */}
        <TabsContent value="admins" className="space-y-4">
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Admin Users</CardTitle>
                <CardDescription>Manage admin users and their roles</CardDescription>
              </div>
              <Dialog open={isAdminDialogOpen} onOpenChange={setIsAdminDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="gradient">
                    <Users className="h-4 w-4 mr-2" />
                    Add Admin
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Admin User</DialogTitle>
                    <DialogDescription>
                      Create a new admin user account
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="admin-name">Name *</Label>
                      <Input id="admin-name" placeholder="Enter admin name" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="admin-email">Email *</Label>
                      <Input id="admin-email" type="email" placeholder="Enter email address" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="admin-role">Role *</Label>
                      <Select>
                        <SelectTrigger id="admin-role">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="super_admin">Super Admin</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="support">Support</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="admin-password">Password *</Label>
                      <Input id="admin-password" type="password" placeholder="Enter password" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAdminDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button variant="gradient">Create Admin</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary/50">
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adminUsers.map((admin) => (
                      <TableRow key={admin.id} className="hover:bg-secondary/30">
                        <TableCell className="font-medium">{admin.name}</TableCell>
                        <TableCell>{admin.email}</TableCell>
                        <TableCell>{getRoleBadge(admin.role)}</TableCell>
                        <TableCell>
                          <Badge variant={admin.status === 'active' ? 'delivered' : 'cancelled'}>
                            {admin.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {admin.lastLogin}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm">Edit</Button>
                            <Button variant="ghost" size="sm" className="text-destructive">
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

