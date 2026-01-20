import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Loader2, Edit, Trash2, Truck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { adminDeliveryAPI } from '@/lib/api';

type Mode = 'create' | 'edit';

export default function DeliveryPersons() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterOnline, setFilterOnline] = useState<'all' | 'online' | 'offline'>('all');
  const [filterAvailable, setFilterAvailable] = useState<'all' | 'available' | 'busy'>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [mode, setMode] = useState<Mode>('create');
  const [editing, setEditing] = useState<any | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleType, setVehicleType] = useState<'bike' | 'car' | 'van'>('bike');

  const params = useMemo(() => {
    const p: any = { page: 1, limit: 50 };
    if (searchQuery) p.search = searchQuery;
    if (filterOnline === 'online') p.is_online = true;
    if (filterOnline === 'offline') p.is_online = false;
    if (filterAvailable === 'available') p.is_available = true;
    if (filterAvailable === 'busy') p.is_available = false;
    return p;
  }, [searchQuery, filterOnline, filterAvailable]);

  const { data: personsResp, isLoading } = useQuery({
    queryKey: ['delivery-persons', params],
    queryFn: async () => {
      const resp = await adminDeliveryAPI.getDeliveryPersons(params);
      return resp.data;
    },
  });

  const persons = personsResp?.items || personsResp?.data?.items || personsResp || [];

  const openCreate = () => {
    setMode('create');
    setEditing(null);
    setName('');
    setPhone('');
    setEmail('');
    setPassword('');
    setEmployeeId('');
    setLicenseNumber('');
    setVehicleNumber('');
    setVehicleType('bike');
    setIsDialogOpen(true);
  };

  const openEdit = (p: any) => {
    setMode('edit');
    setEditing(p);
    setName(p.name || '');
    setPhone(p.phone || '');
    setEmail(p.email || '');
    setPassword('');
    setEmployeeId(p.employeeId || p.employee_id || '');
    setLicenseNumber(p.licenseNumber || p.license_number || '');
    setVehicleNumber(p.vehicleNumber || p.vehicle_number || '');
    setVehicleType((p.vehicleType || p.vehicle_type || 'bike') as any);
    setIsDialogOpen(true);
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!name || !phone || !password) throw new Error('Name, phone and password are required');
      return await adminDeliveryAPI.createDeliveryPerson({
        name,
        phone,
        email: email || undefined,
        password,
        employeeId: employeeId || undefined,
        licenseNumber: licenseNumber || undefined,
        vehicleNumber: vehicleNumber || undefined,
        vehicleType,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-persons'] });
      setIsDialogOpen(false);
      toast({ title: 'Created', description: 'Delivery person created successfully' });
    },
    onError: (e: any) => {
      toast({ title: 'Error', description: e?.response?.data?.message || e.message || 'Failed', variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editing?.id) throw new Error('Missing delivery person id');
      return await adminDeliveryAPI.updateDeliveryPerson(editing.id, {
        name: name || undefined,
        phone: phone || undefined,
        email: email || undefined,
        password: password || undefined,
        employeeId: employeeId || undefined,
        licenseNumber: licenseNumber || undefined,
        vehicleNumber: vehicleNumber || undefined,
        vehicleType,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-persons'] });
      setIsDialogOpen(false);
      toast({ title: 'Updated', description: 'Delivery person updated successfully' });
    },
    onError: (e: any) => {
      toast({ title: 'Error', description: e?.response?.data?.message || e.message || 'Failed', variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => adminDeliveryAPI.deactivateDeliveryPerson(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery-persons'] });
      setDeleteId(null);
      toast({ title: 'Deactivated', description: 'Delivery person deactivated' });
    },
    onError: (e: any) => {
      toast({ title: 'Error', description: e?.response?.data?.message || 'Failed', variant: 'destructive' });
    },
  });

  const handleSubmit = () => {
    if (mode === 'create') createMutation.mutate();
    else updateMutation.mutate();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Delivery Personnel</h1>
          <p className="text-muted-foreground">Manage delivery persons and assign orders</p>
        </div>
        <Button variant="gradient" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Delivery Person
        </Button>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Delivery Persons
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-10"
                placeholder="Search name/phone/employee ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={filterOnline} onValueChange={(v) => setFilterOnline(v as any)}>
              <SelectTrigger className="w-full md:w-44">
                <SelectValue placeholder="Online" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterAvailable} onValueChange={(v) => setFilterAvailable(v as any)}>
              <SelectTrigger className="w-full md:w-44">
                <SelectValue placeholder="Availability" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="busy">Busy</SelectItem>
              </SelectContent>
            </Select>
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
                    <TableHead>Phone</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Online</TableHead>
                    <TableHead>Availability</TableHead>
                    <TableHead>Active Orders</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {persons.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No delivery persons found
                      </TableCell>
                    </TableRow>
                  ) : (
                    persons.map((p: any) => {
                      const isOnline = p.isOnline ?? p.is_online ?? false;
                      const isAvailable = p.isAvailable ?? p.is_available ?? false;
                      const activeOrders = p.activeOrders ?? p.active_orders ?? 0;
                      const vNo = p.vehicleNumber || p.vehicle_number || '—';
                      const vType = p.vehicleType || p.vehicle_type || '—';
                      return (
                        <TableRow key={p.id} className="hover:bg-secondary/30">
                          <TableCell className="font-medium">{p.name}</TableCell>
                          <TableCell>{p.phone}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {vType} • {vNo}
                          </TableCell>
                          <TableCell>
                            <Badge variant={isOnline ? 'delivered' : 'secondary'}>
                              {isOnline ? 'Online' : 'Offline'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={isAvailable ? 'confirmed' : 'pending'}>
                              {isAvailable ? 'Available' : 'Busy'}
                            </Badge>
                          </TableCell>
                          <TableCell>{activeOrders}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm" onClick={() => openEdit(p)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive"
                                onClick={() => setDeleteId(p.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{mode === 'create' ? 'Add Delivery Person' : 'Edit Delivery Person'}</DialogTitle>
            <DialogDescription>
              {mode === 'create' ? 'Create a new delivery person account' : 'Update delivery person details'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Phone *</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91..." />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{mode === 'create' ? 'Password *' : 'Password (optional)'}</Label>
              <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" />
            </div>
            <div className="space-y-2">
              <Label>Employee ID</Label>
              <Input value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>License Number</Label>
              <Input value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Vehicle Number</Label>
              <Input value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Vehicle Type</Label>
              <Select value={vehicleType} onValueChange={(v) => setVehicleType(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bike">Bike</SelectItem>
                  <SelectItem value="car">Car</SelectItem>
                  <SelectItem value="van">Van</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Delivery Person</AlertDialogTitle>
            <AlertDialogDescription>This will deactivate the delivery person account.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
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
    </div>
  );
}

