import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Loader2, Edit, Trash2, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { companiesAPI, sellersAPI } from '@/lib/api';

type SellerFormMode = 'create' | 'edit';

export default function Sellers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [mode, setMode] = useState<SellerFormMode>('create');
  const [editingSeller, setEditingSeller] = useState<any>(null);
  const [deleteSellerId, setDeleteSellerId] = useState<string | null>(null);
  const [resetPasswordSellerId, setResetPasswordSellerId] = useState<string | null>(null);

  // form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [password, setPassword] = useState('');
  const [isActive, setIsActive] = useState(true);

  const { data: companiesData } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const response = await companiesAPI.getCompanies();
      return response.data || [];
    },
  });

  const companies = companiesData || [];

  const { data: sellersResponse, isLoading } = useQuery({
    queryKey: ['sellers', searchQuery],
    queryFn: async () => {
      const response = await sellersAPI.getSellers({
        page: 1,
        limit: 50,
        search: searchQuery || undefined,
      });
      return response.data;
    },
  });

  const sellers = useMemo(() => {
    // Support both paginated and array response
    if (!sellersResponse) return [];
    if (Array.isArray(sellersResponse)) return sellersResponse;
    return sellersResponse.items || [];
  }, [sellersResponse]);

  const openCreate = () => {
    setMode('create');
    setEditingSeller(null);
    setName('');
    setEmail('');
    setCompanyId('');
    setPassword('');
    setIsActive(true);
    setIsDialogOpen(true);
  };

  const openEdit = (seller: any) => {
    setMode('edit');
    setEditingSeller(seller);
    setName(seller.name || '');
    setEmail(seller.email || '');
    setCompanyId(seller.company?.id || seller.company_id || '');
    setPassword('');
    setIsActive(seller.is_active ?? seller.isActive ?? true);
    setIsDialogOpen(true);
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      return await sellersAPI.createSeller({
        name,
        email,
        company_id: companyId,
        password: password || undefined,
      });
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['sellers'] });
      setIsDialogOpen(false);
      toast({
        title: 'Seller created',
        description:
          response?.data?.temporary_password
            ? `Temporary password: ${response.data.temporary_password}`
            : 'Seller created successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create seller',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      return await sellersAPI.updateSeller(editingSeller.id, {
        name,
        email,
        company_id: companyId || undefined,
        is_active: isActive,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sellers'] });
      setIsDialogOpen(false);
      toast({ title: 'Seller updated', description: 'Seller updated successfully' });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update seller',
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => sellersAPI.deleteSeller(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sellers'] });
      setDeleteSellerId(null);
      toast({ title: 'Seller deactivated', description: 'Seller deactivated successfully' });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to deactivate seller',
        variant: 'destructive',
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (id: string) => sellersAPI.resetSellerPassword(id),
    onSuccess: (response) => {
      setResetPasswordSellerId(null);
      toast({
        title: 'Password reset',
        description: response?.data?.temporary_password
          ? `Temporary password: ${response.data.temporary_password}`
          : 'Password reset successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to reset password',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = () => {
    if (!name || !email || !companyId) {
      toast({ title: 'Error', description: 'Name, email, and company are required', variant: 'destructive' });
      return;
    }
    if (mode === 'create') createMutation.mutate();
    else updateMutation.mutate();
  };

  const formatDate = (value: string) => {
    if (!value) return '—';
    try {
      return new Date(value).toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return value;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sellers</h1>
          <p className="text-muted-foreground">Create and manage seller accounts</p>
        </div>
        <Button variant="gradient" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Create Seller
        </Button>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Seller Accounts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search sellers by name/email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-secondary/50">
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sellers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No sellers found
                      </TableCell>
                    </TableRow>
                  ) : (
                    sellers.map((seller: any) => (
                      <TableRow key={seller.id} className="hover:bg-secondary/30">
                        <TableCell className="font-medium">{seller.name}</TableCell>
                        <TableCell>{seller.email}</TableCell>
                        <TableCell>{seller.company?.name || '—'}</TableCell>
                        <TableCell>
                          <Badge variant={(seller.is_active ?? seller.isActive) ? 'delivered' : 'cancelled'}>
                            {(seller.is_active ?? seller.isActive) ? 'active' : 'inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDate(seller.last_login || seller.lastLogin)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => openEdit(seller)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setResetPasswordSellerId(seller.id)}>
                              <KeyRound className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive"
                              onClick={() => setDeleteSellerId(seller.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{mode === 'create' ? 'Create Seller' : 'Edit Seller'}</DialogTitle>
            <DialogDescription>
              {mode === 'create'
                ? 'Create a seller tied to a company. Share the temporary password with the seller.'
                : 'Update seller details.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="seller-name">Name *</Label>
              <Input id="seller-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="seller-email">Email *</Label>
              <Input id="seller-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Company *</Label>
              <Select value={companyId} onValueChange={setCompanyId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {mode === 'create' && (
              <div className="space-y-2">
                <Label htmlFor="seller-password">Password (optional)</Label>
                <Input
                  id="seller-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Leave blank to auto-generate"
                />
              </div>
            )}

            {mode === 'edit' && (
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={isActive ? 'active' : 'inactive'} onValueChange={(v) => setIsActive(v === 'active')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="gradient"
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <AlertDialog open={!!deleteSellerId} onOpenChange={() => setDeleteSellerId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Seller</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate the seller account (soft delete). The seller will not be able to login.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
              onClick={() => deleteSellerId && deleteMutation.mutate(deleteSellerId)}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deactivating...
                </>
              ) : (
                'Deactivate'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset password */}
      <AlertDialog open={!!resetPasswordSellerId} onOpenChange={() => setResetPasswordSellerId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Seller Password</AlertDialogTitle>
            <AlertDialogDescription>
              This will generate a new temporary password. You must share it with the seller.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={resetPasswordMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={resetPasswordMutation.isPending}
              onClick={() => resetPasswordSellerId && resetPasswordMutation.mutate(resetPasswordSellerId)}
            >
              {resetPasswordMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Resetting...
                </>
              ) : (
                'Reset Password'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

