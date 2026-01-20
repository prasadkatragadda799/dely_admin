import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Save,
  Upload,
  Users,
  Globe,
  Loader2,
  Trash2,
  Edit,
  X,
  Plus
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
} from '@/components/ui/dialog';
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
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { settingsAPI } from '@/lib/api';
import { categoriesAPI } from '@/lib/api';

// Form Schemas
const generalSettingsSchema = z.object({
  appName: z.string().min(1, 'App name is required'),
  contactEmail: z.string().email('Invalid email address'),
  contactPhone: z.string().min(1, 'Contact phone is required'),
  businessAddress: z.string().min(1, 'Business address is required'),
});

const paymentSettingsSchema = z.object({
  creditEnabled: z.boolean(),
  upiEnabled: z.boolean(),
  bankTransferEnabled: z.boolean(),
  cashOnDeliveryEnabled: z.boolean(),
  defaultCreditLimit: z.number().min(0),
  paymentTermsDays: z.number().min(1),
});

const deliverySettingsSchema = z.object({
  standardDeliveryCharge: z.number().min(0),
  freeDeliveryThreshold: z.number().min(0),
  deliveryTimeSlots: z.string().min(1, 'Delivery time slots are required'),
  serviceablePincodes: z.string().min(1, 'Serviceable pincodes are required'),
});

const taxSettingsSchema = z.object({
  defaultGstRate: z.number().min(0).max(100),
  categoryGstRates: z.array(z.object({
    categoryId: z.string(),
    categoryName: z.string(),
    gstRate: z.number().min(0).max(100),
  })),
});

const notificationSettingsSchema = z.object({
  emailTemplates: z.object({
    orderConfirmation: z.string().optional(),
    orderShipped: z.string().optional(),
    orderDelivered: z.string().optional(),
    orderCancelled: z.string().optional(),
  }),
  smsTemplates: z.object({
    orderConfirmation: z.string().optional(),
    orderShipped: z.string().optional(),
    orderDelivered: z.string().optional(),
    orderCancelled: z.string().optional(),
  }),
});

const adminUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  role: z.enum(['super_admin', 'admin', 'manager', 'support']),
});

type GeneralSettingsForm = z.infer<typeof generalSettingsSchema>;
type PaymentSettingsForm = z.infer<typeof paymentSettingsSchema>;
type DeliverySettingsForm = z.infer<typeof deliverySettingsSchema>;
type TaxSettingsForm = z.infer<typeof taxSettingsSchema>;
type NotificationSettingsForm = z.infer<typeof notificationSettingsSchema>;
type AdminUserForm = z.infer<typeof adminUserSchema>;

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isAdminDialogOpen, setIsAdminDialogOpen] = useState(false);
  const [editingAdminId, setEditingAdminId] = useState<string | null>(null);
  const [deleteAdminId, setDeleteAdminId] = useState<string | null>(null);
  const [notificationTab, setNotificationTab] = useState<'email' | 'sms'>('email');

  // Fetch all settings
  const { data: generalSettingsData, isLoading: isLoadingGeneral } = useQuery({
    queryKey: ['settings', 'general'],
    queryFn: async () => {
      try {
        const response = await settingsAPI.getGeneralSettings();
        return response.data;
      } catch (error) {
        // Return defaults if API fails
        return {
          appName: 'Dely B2B',
          contactEmail: 'support@dely.com',
          contactPhone: '+91 1800 123 4567',
          businessAddress: '123 Business Park, Mumbai, Maharashtra 400001',
          appLogoUrl: null,
        };
      }
    },
  });

  const { data: paymentSettingsData, isLoading: isLoadingPayment } = useQuery({
    queryKey: ['settings', 'payment'],
    queryFn: async () => {
      try {
        const response = await settingsAPI.getPaymentSettings();
        return response.data;
      } catch (error) {
        return {
          creditEnabled: true,
          upiEnabled: true,
          bankTransferEnabled: true,
          cashOnDeliveryEnabled: false,
          defaultCreditLimit: 50000,
          paymentTermsDays: 30,
        };
      }
    },
  });

  const { data: deliverySettingsData, isLoading: isLoadingDelivery } = useQuery({
    queryKey: ['settings', 'delivery'],
    queryFn: async () => {
      try {
        const response = await settingsAPI.getDeliverySettings();
        return response.data;
      } catch (error) {
        return {
          standardDeliveryCharge: 100,
          freeDeliveryThreshold: 5000,
          deliveryTimeSlots: 'Morning: 9 AM - 12 PM\nAfternoon: 12 PM - 4 PM\nEvening: 4 PM - 8 PM',
          serviceablePincodes: [],
        };
      }
    },
  });

  const { data: taxSettingsData, isLoading: isLoadingTax } = useQuery({
    queryKey: ['settings', 'tax'],
    queryFn: async () => {
      try {
        const response = await settingsAPI.getTaxSettings();
        return response.data;
      } catch (error) {
        return {
          defaultGstRate: 18,
          categoryGstRates: [],
        };
      }
    },
  });

  const { data: notificationSettingsData, isLoading: isLoadingNotifications } = useQuery({
    queryKey: ['settings', 'notifications'],
    queryFn: async () => {
      try {
        const response = await settingsAPI.getNotificationSettings();
        return response.data;
      } catch (error) {
        return {
          emailTemplates: {
            orderConfirmation: 'Dear {customer_name},\n\nYour order #{order_number} has been confirmed.\nTotal Amount: ₹{total_amount}\n\nThank you for your business!',
            orderShipped: 'Dear {customer_name},\n\nYour order #{order_number} has been shipped.\nTracking Number: {tracking_number}\n\nExpected delivery: {delivery_date}',
          },
          smsTemplates: {
            orderConfirmation: 'Your order #{order_number} for ₹{total_amount} has been confirmed. Thank you!',
            orderShipped: 'Your order #{order_number} has been shipped. Track: {tracking_number}',
          },
        };
      }
    },
  });

  // Fetch categories for tax settings
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      try {
        const response = await categoriesAPI.getCategories();
        return response.data || [];
      } catch (error) {
        return [];
      }
    },
  });

  // Fetch admin users
  const { data: adminsData, isLoading: isLoadingAdmins } = useQuery({
    queryKey: ['admins'],
    queryFn: async () => {
      try {
        const response = await settingsAPI.getAdmins();
        return response.data || [];
      } catch (error) {
        return [];
      }
    },
  });

  // Set logo preview when data loads
  useEffect(() => {
    if (generalSettingsData?.appLogoUrl && !selectedLogoFile) {
      setLogoPreview(generalSettingsData.appLogoUrl);
    }
  }, [generalSettingsData, selectedLogoFile]);

  // Form hooks
  const generalForm = useForm<GeneralSettingsForm>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: generalSettingsData || {},
  });

  const paymentForm = useForm<PaymentSettingsForm>({
    resolver: zodResolver(paymentSettingsSchema),
    defaultValues: paymentSettingsData || {},
  });

  const deliveryForm = useForm<DeliverySettingsForm>({
    resolver: zodResolver(deliverySettingsSchema),
    defaultValues: deliverySettingsData || {},
  });

  const taxForm = useForm<TaxSettingsForm>({
    resolver: zodResolver(taxSettingsSchema),
    defaultValues: taxSettingsData || {},
  });

  const notificationForm = useForm<NotificationSettingsForm>({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues: notificationSettingsData || {},
  });

  const adminForm = useForm<AdminUserForm>({
    resolver: zodResolver(adminUserSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'admin',
    },
  });

  // Update forms when data loads
  useEffect(() => {
    if (generalSettingsData) {
      generalForm.reset(generalSettingsData);
      if (generalSettingsData.appLogoUrl) {
        setLogoPreview(generalSettingsData.appLogoUrl);
      }
    }
  }, [generalSettingsData, generalForm]);

  useEffect(() => {
    if (paymentSettingsData) {
      paymentForm.reset(paymentSettingsData);
    }
  }, [paymentSettingsData, paymentForm]);

  useEffect(() => {
    if (deliverySettingsData) {
      deliveryForm.reset({
        ...deliverySettingsData,
        serviceablePincodes: Array.isArray(deliverySettingsData.serviceablePincodes)
          ? deliverySettingsData.serviceablePincodes.join(', ')
          : deliverySettingsData.serviceablePincodes || '',
      });
    }
  }, [deliverySettingsData, deliveryForm]);

  useEffect(() => {
    if (taxSettingsData) {
      taxForm.reset({
        defaultGstRate: taxSettingsData.defaultGstRate || 18,
        categoryGstRates: (taxSettingsData.categoryGstRates || []).map((rate: any) => ({
          categoryId: rate.categoryId || '',
          categoryName: rate.categoryName || '',
          gstRate: rate.gstRate || 18,
        })),
      });
    }
  }, [taxSettingsData, taxForm]);

  useEffect(() => {
    if (notificationSettingsData) {
      notificationForm.reset(notificationSettingsData);
    }
  }, [notificationSettingsData, notificationForm]);

  // Mutations
  const generalMutation = useMutation({
    mutationFn: async (data: GeneralSettingsForm & { logoFile?: File }) => {
      return await settingsAPI.updateGeneralSettings({
        appName: data.appName,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        businessAddress: data.businessAddress,
        appLogo: data.logoFile || logoPreview || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'general'] });
      toast({
        title: 'Success',
        description: 'General settings saved successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to save general settings',
        variant: 'destructive',
      });
    },
  });

  const paymentMutation = useMutation({
    mutationFn: async (data: PaymentSettingsForm) => {
      return await settingsAPI.updatePaymentSettings(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'payment'] });
      toast({
        title: 'Success',
        description: 'Payment settings saved successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to save payment settings',
        variant: 'destructive',
      });
    },
  });

  const deliveryMutation = useMutation({
    mutationFn: async (data: DeliverySettingsForm) => {
      const pincodes = data.serviceablePincodes
        .split(',')
        .map(p => p.trim())
        .filter(p => p.length > 0);
      return await settingsAPI.updateDeliverySettings({
        ...data,
        serviceablePincodes: pincodes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'delivery'] });
      toast({
        title: 'Success',
        description: 'Delivery settings saved successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to save delivery settings',
        variant: 'destructive',
      });
    },
  });

  const taxMutation = useMutation({
    mutationFn: async (data: TaxSettingsForm) => {
      // Ensure all category GST rates have required fields
      const validCategoryRates = (data.categoryGstRates || []).filter(
        (rate) => rate.categoryId && rate.categoryName && typeof rate.gstRate === 'number'
      ).map((rate) => ({
        categoryId: rate.categoryId!,
        categoryName: rate.categoryName!,
        gstRate: rate.gstRate!,
      }));
      
      return await settingsAPI.updateTaxSettings({
        defaultGstRate: data.defaultGstRate,
        categoryGstRates: validCategoryRates,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'tax'] });
      toast({
        title: 'Success',
        description: 'Tax settings saved successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to save tax settings',
        variant: 'destructive',
      });
    },
  });

  const notificationMutation = useMutation({
    mutationFn: async (data: NotificationSettingsForm) => {
      return await settingsAPI.updateNotificationSettings(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'notifications'] });
      toast({
        title: 'Success',
        description: 'Notification settings saved successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to save notification settings',
        variant: 'destructive',
      });
    },
  });

  const createAdminMutation = useMutation({
    mutationFn: async (data: AdminUserForm) => {
      return await settingsAPI.createAdmin({
        name: data.name,
        email: data.email,
        password: data.password!,
        role: data.role,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] });
      setIsAdminDialogOpen(false);
      adminForm.reset();
      toast({
        title: 'Success',
        description: 'Admin user created successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create admin user',
        variant: 'destructive',
      });
    },
  });

  const updateAdminMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<AdminUserForm> }) => {
      return await settingsAPI.updateAdmin(id, {
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] });
      setIsAdminDialogOpen(false);
      setEditingAdminId(null);
      adminForm.reset();
      toast({
        title: 'Success',
        description: 'Admin user updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update admin user',
        variant: 'destructive',
      });
    },
  });

  const deleteAdminMutation = useMutation({
    mutationFn: async (id: string) => {
      return await settingsAPI.deleteAdmin(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] });
      setDeleteAdminId(null);
      toast({
        title: 'Success',
        description: 'Admin user deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete admin user',
        variant: 'destructive',
      });
    },
  });

  // Handlers
  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGeneralSubmit = (data: GeneralSettingsForm) => {
    generalMutation.mutate({
      ...data,
      logoFile: selectedLogoFile || undefined,
    });
  };

  const handlePaymentSubmit = (data: PaymentSettingsForm) => {
    paymentMutation.mutate(data);
  };

  const handleDeliverySubmit = (data: DeliverySettingsForm) => {
    deliveryMutation.mutate(data);
  };

  const handleTaxSubmit = (data: TaxSettingsForm) => {
    // Filter out empty category GST rates
    const validCategoryRates = (data.categoryGstRates || []).filter(
      (rate) => rate.categoryId && rate.categoryName && rate.gstRate >= 0
    );
    taxMutation.mutate({
      ...data,
      categoryGstRates: validCategoryRates,
    });
  };

  const handleNotificationSubmit = (data: NotificationSettingsForm) => {
    notificationMutation.mutate(data);
  };

  const handleAddAdmin = () => {
    setEditingAdminId(null);
    adminForm.reset({
      name: '',
      email: '',
      password: '',
      role: 'admin',
    });
    setIsAdminDialogOpen(true);
  };

  const handleEditAdmin = (admin: any) => {
    setEditingAdminId(admin.id);
    adminForm.reset({
      name: admin.name,
      email: admin.email,
      password: '',
      role: admin.role,
    });
    setIsAdminDialogOpen(true);
  };

  const handleAdminSubmit = (data: AdminUserForm) => {
    if (editingAdminId) {
      updateAdminMutation.mutate({ id: editingAdminId, data });
    } else {
      if (!data.password) {
        toast({
          title: 'Error',
          description: 'Password is required for new admin users',
          variant: 'destructive',
        });
        return;
      }
      createAdminMutation.mutate(data);
    }
  };

  const handleDeleteAdmin = () => {
    if (deleteAdminId) {
      deleteAdminMutation.mutate(deleteAdminId);
    }
  };

  const handleAddCategoryGst = () => {
    const currentRates = taxForm.getValues('categoryGstRates') || [];
    taxForm.setValue('categoryGstRates', [
      ...currentRates,
      { categoryId: '', categoryName: '', gstRate: 18 },
    ]);
  };

  const handleRemoveCategoryGst = (index: number) => {
    const currentRates = taxForm.getValues('categoryGstRates') || [];
    taxForm.setValue('categoryGstRates', currentRates.filter((_, i) => i !== index));
  };

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

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Never';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const isLoading = isLoadingGeneral || isLoadingPayment || isLoadingDelivery || 
                    isLoadingTax || isLoadingNotifications || isLoadingAdmins;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Configure system settings and preferences</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
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
              <CardContent>
                <form onSubmit={generalForm.handleSubmit(handleGeneralSubmit)} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="app-name">App Name</Label>
                    <Input
                      id="app-name"
                      {...generalForm.register('appName')}
                      disabled={generalMutation.isPending}
                    />
                    {generalForm.formState.errors.appName && (
                      <p className="text-sm text-destructive">
                        {generalForm.formState.errors.appName.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>App Logo</Label>
                    <div className="flex items-center gap-4">
                      <div className="h-20 w-20 rounded-lg bg-secondary border-2 border-dashed border-border flex items-center justify-center overflow-hidden">
                        {logoPreview ? (
                          <img src={logoPreview} alt="Logo" className="h-full w-full object-contain" />
                        ) : (
                          <Globe className="h-8 w-8 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <input
                          ref={logoFileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleLogoSelect}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => logoFileInputRef.current?.click()}
                          disabled={generalMutation.isPending}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Logo
                        </Button>
                      </div>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Label htmlFor="contact-email">Contact Email</Label>
                    <Input
                      id="contact-email"
                      type="email"
                      {...generalForm.register('contactEmail')}
                      disabled={generalMutation.isPending}
                    />
                    {generalForm.formState.errors.contactEmail && (
                      <p className="text-sm text-destructive">
                        {generalForm.formState.errors.contactEmail.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact-phone">Contact Phone</Label>
                    <Input
                      id="contact-phone"
                      {...generalForm.register('contactPhone')}
                      disabled={generalMutation.isPending}
                    />
                    {generalForm.formState.errors.contactPhone && (
                      <p className="text-sm text-destructive">
                        {generalForm.formState.errors.contactPhone.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Business Address</Label>
                    <Textarea
                      id="address"
                      rows={3}
                      {...generalForm.register('businessAddress')}
                      disabled={generalMutation.isPending}
                    />
                    {generalForm.formState.errors.businessAddress && (
                      <p className="text-sm text-destructive">
                        {generalForm.formState.errors.businessAddress.message}
                      </p>
                    )}
                  </div>
                  <Button
                    type="submit"
                    variant="gradient"
                    disabled={generalMutation.isPending}
                  >
                    {generalMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </form>
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
              <CardContent>
                <form onSubmit={paymentForm.handleSubmit(handlePaymentSubmit)} className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="credit-enabled">Credit Payment</Label>
                        <p className="text-xs text-muted-foreground">
                          Allow customers to pay on credit
                        </p>
                      </div>
                      <Switch
                        id="credit-enabled"
                        checked={paymentForm.watch('creditEnabled')}
                        onCheckedChange={(checked) => paymentForm.setValue('creditEnabled', checked)}
                        disabled={paymentMutation.isPending}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="upi-enabled">UPI Payment</Label>
                        <p className="text-xs text-muted-foreground">
                          Enable UPI payment gateway
                        </p>
                      </div>
                      <Switch
                        id="upi-enabled"
                        checked={paymentForm.watch('upiEnabled')}
                        onCheckedChange={(checked) => paymentForm.setValue('upiEnabled', checked)}
                        disabled={paymentMutation.isPending}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="bank-enabled">Bank Transfer</Label>
                        <p className="text-xs text-muted-foreground">
                          Allow bank transfer payments
                        </p>
                      </div>
                      <Switch
                        id="bank-enabled"
                        checked={paymentForm.watch('bankTransferEnabled')}
                        onCheckedChange={(checked) => paymentForm.setValue('bankTransferEnabled', checked)}
                        disabled={paymentMutation.isPending}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="cash-enabled">Cash on Delivery</Label>
                        <p className="text-xs text-muted-foreground">
                          Enable cash on delivery option
                        </p>
                      </div>
                      <Switch
                        id="cash-enabled"
                        checked={paymentForm.watch('cashOnDeliveryEnabled')}
                        onCheckedChange={(checked) => paymentForm.setValue('cashOnDeliveryEnabled', checked)}
                        disabled={paymentMutation.isPending}
                      />
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <Label htmlFor="credit-limit">Default Credit Limit (₹)</Label>
                    <Input
                      id="credit-limit"
                      type="number"
                      {...paymentForm.register('defaultCreditLimit', { valueAsNumber: true })}
                      disabled={paymentMutation.isPending}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payment-terms">Payment Terms (Days)</Label>
                    <Input
                      id="payment-terms"
                      type="number"
                      {...paymentForm.register('paymentTermsDays', { valueAsNumber: true })}
                      disabled={paymentMutation.isPending}
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="gradient"
                    disabled={paymentMutation.isPending}
                  >
                    {paymentMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </form>
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
              <CardContent>
                <form onSubmit={deliveryForm.handleSubmit(handleDeliverySubmit)} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="delivery-charge">Standard Delivery Charge (₹)</Label>
                    <Input
                      id="delivery-charge"
                      type="number"
                      {...deliveryForm.register('standardDeliveryCharge', { valueAsNumber: true })}
                      disabled={deliveryMutation.isPending}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="free-delivery-threshold">Free Delivery Threshold (₹)</Label>
                    <Input
                      id="free-delivery-threshold"
                      type="number"
                      {...deliveryForm.register('freeDeliveryThreshold', { valueAsNumber: true })}
                      disabled={deliveryMutation.isPending}
                    />
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
                      {...deliveryForm.register('deliveryTimeSlots')}
                      disabled={deliveryMutation.isPending}
                      placeholder="Morning: 9 AM - 12 PM&#10;Afternoon: 12 PM - 4 PM&#10;Evening: 4 PM - 8 PM"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="serviceable-pincodes">Serviceable Pincodes</Label>
                    <Textarea
                      id="serviceable-pincodes"
                      rows={4}
                      {...deliveryForm.register('serviceablePincodes')}
                      disabled={deliveryMutation.isPending}
                      placeholder="Enter pincodes separated by commas (e.g., 400001, 400002, 400003)"
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="gradient"
                    disabled={deliveryMutation.isPending}
                  >
                    {deliveryMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </form>
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
              <CardContent>
                <form onSubmit={taxForm.handleSubmit(handleTaxSubmit)} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="default-gst">Default GST Rate (%)</Label>
                    <Input
                      id="default-gst"
                      type="number"
                      {...taxForm.register('defaultGstRate', { valueAsNumber: true })}
                      disabled={taxMutation.isPending}
                    />
                  </div>
                  <Separator />
                  <div className="space-y-4">
                    <Label>GST Rates by Category</Label>
                    <div className="space-y-3">
                      {taxForm.watch('categoryGstRates')?.map((rate, index) => (
                        <div key={index} className="flex items-center gap-4">
                          <Select
                            value={rate.categoryId}
                            onValueChange={(value) => {
                              const category = categoriesData?.find((c: any) => c.id === value);
                              const currentRates = taxForm.getValues('categoryGstRates') || [];
                              currentRates[index] = {
                                categoryId: value,
                                categoryName: category?.name || '',
                                gstRate: currentRates[index]?.gstRate || 18,
                              };
                              taxForm.setValue('categoryGstRates', currentRates);
                            }}
                            disabled={taxMutation.isPending}
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              {categoriesData?.map((category: any) => (
                                <SelectItem key={category.id} value={category.id}>
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            placeholder="GST %"
                            type="number"
                            className="w-32"
                            value={rate.gstRate}
                            onChange={(e) => {
                              const currentRates = taxForm.getValues('categoryGstRates') || [];
                              currentRates[index].gstRate = parseFloat(e.target.value) || 0;
                              taxForm.setValue('categoryGstRates', currentRates);
                            }}
                            disabled={taxMutation.isPending}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveCategoryGst(index)}
                            disabled={taxMutation.isPending}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddCategoryGst}
                      disabled={taxMutation.isPending}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Category
                    </Button>
                  </div>
                  <Button
                    type="submit"
                    variant="gradient"
                    disabled={taxMutation.isPending}
                  >
                    {taxMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </form>
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
              <CardContent>
                <form onSubmit={notificationForm.handleSubmit(handleNotificationSubmit)} className="space-y-6">
                  <Tabs value={notificationTab} onValueChange={(v) => setNotificationTab(v as 'email' | 'sms')} className="w-full">
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
                          {...notificationForm.register('emailTemplates.orderConfirmation')}
                          disabled={notificationMutation.isPending}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="order-shipped-email">Order Shipped Email</Label>
                        <Textarea
                          id="order-shipped-email"
                          rows={6}
                          {...notificationForm.register('emailTemplates.orderShipped')}
                          disabled={notificationMutation.isPending}
                        />
                      </div>
                    </TabsContent>
                    <TabsContent value="sms" className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="order-confirmation-sms">Order Confirmation SMS</Label>
                        <Textarea
                          id="order-confirmation-sms"
                          rows={4}
                          {...notificationForm.register('smsTemplates.orderConfirmation')}
                          disabled={notificationMutation.isPending}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="order-shipped-sms">Order Shipped SMS</Label>
                        <Textarea
                          id="order-shipped-sms"
                          rows={4}
                          {...notificationForm.register('smsTemplates.orderShipped')}
                          disabled={notificationMutation.isPending}
                        />
                      </div>
                    </TabsContent>
                  </Tabs>
                  <Button
                    type="submit"
                    variant="gradient"
                    disabled={notificationMutation.isPending}
                  >
                    {notificationMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </form>
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
                <Button variant="gradient" onClick={handleAddAdmin}>
                  <Users className="h-4 w-4 mr-2" />
                  Add Admin
                </Button>
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
                      {adminsData && adminsData.length > 0 ? (
                        adminsData.map((admin: any) => (
                          <TableRow key={admin.id} className="hover:bg-secondary/30">
                            <TableCell className="font-medium">{admin.name}</TableCell>
                            <TableCell>{admin.email}</TableCell>
                            <TableCell>{getRoleBadge(admin.role)}</TableCell>
                            <TableCell>
                              <Badge variant={admin.status === 'active' ? 'delivered' : 'cancelled'}>
                                {admin.status || 'active'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {formatDate(admin.lastLogin)}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditAdmin(admin)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive"
                                  onClick={() => setDeleteAdminId(admin.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                            No admin users found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Add/Edit Admin Dialog */}
      <Dialog open={isAdminDialogOpen} onOpenChange={setIsAdminDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAdminId ? 'Edit Admin User' : 'Add Admin User'}</DialogTitle>
            <DialogDescription>
              {editingAdminId ? 'Update admin user details' : 'Create a new admin user account'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={adminForm.handleSubmit(handleAdminSubmit)} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="admin-name">Name *</Label>
              <Input
                id="admin-name"
                placeholder="Enter admin name"
                {...adminForm.register('name')}
                disabled={createAdminMutation.isPending || updateAdminMutation.isPending}
              />
              {adminForm.formState.errors.name && (
                <p className="text-sm text-destructive">{adminForm.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-email">Email *</Label>
              <Input
                id="admin-email"
                type="email"
                placeholder="Enter email address"
                {...adminForm.register('email')}
                disabled={createAdminMutation.isPending || updateAdminMutation.isPending}
              />
              {adminForm.formState.errors.email && (
                <p className="text-sm text-destructive">{adminForm.formState.errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-role">Role *</Label>
              <Select
                value={adminForm.watch('role')}
                onValueChange={(value) => adminForm.setValue('role', value as any)}
                disabled={createAdminMutation.isPending || updateAdminMutation.isPending}
              >
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
              <Label htmlFor="admin-password">
                Password {editingAdminId ? '(leave blank to keep current)' : '*'}
              </Label>
              <Input
                id="admin-password"
                type="password"
                placeholder="Enter password"
                {...adminForm.register('password')}
                disabled={createAdminMutation.isPending || updateAdminMutation.isPending}
              />
              {adminForm.formState.errors.password && (
                <p className="text-sm text-destructive">{adminForm.formState.errors.password.message}</p>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAdminDialogOpen(false);
                  setEditingAdminId(null);
                  adminForm.reset();
                }}
                disabled={createAdminMutation.isPending || updateAdminMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="gradient"
                disabled={createAdminMutation.isPending || updateAdminMutation.isPending}
              >
                {createAdminMutation.isPending || updateAdminMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {editingAdminId ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  editingAdminId ? 'Update Admin' : 'Create Admin'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Admin Confirmation */}
      <AlertDialog open={!!deleteAdminId} onOpenChange={() => setDeleteAdminId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Admin User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this admin user? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteAdminMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAdmin}
              disabled={deleteAdminMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteAdminMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
