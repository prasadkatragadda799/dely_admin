import { useEffect, useMemo, useState } from 'react';
import {
  Plus, Edit, Trash2, MapPin, Loader2, MoreHorizontal, X, Building2, Map,
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { zonesAPI, type Zone } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const errMsg = (e: any, fallback: string) =>
  e?.response?.data?.error?.message || e?.response?.data?.detail || e?.message || fallback;

/** Parse a free-text blob of pincodes ("500001, 500002\n500003") into 6-digit codes. */
function parsePincodes(text: string): string[] {
  const found = (text.match(/\d{6}/g) ?? []).map((p) => p.trim());
  return Array.from(new Set(found));
}

export default function Zones() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Zone | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [pincodeZone, setPincodeZone] = useState<Zone | null>(null);
  const [pincodeInput, setPincodeInput] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<Zone | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['zones'],
    queryFn: async () => (await zonesAPI.getZones()).data ?? [],
    retry: 1,
  });
  const zones = data ?? [];

  // Detail (with pincodes) for the "manage pincodes" dialog.
  const { data: zoneDetail, isFetching: loadingDetail } = useQuery({
    queryKey: ['zone', pincodeZone?.id],
    queryFn: async () => (await zonesAPI.getZone(pincodeZone!.id)).data,
    enabled: !!pincodeZone,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['zones'] });
    if (pincodeZone) queryClient.invalidateQueries({ queryKey: ['zone', pincodeZone.id] });
  };

  const openCreate = () => {
    setEditing(null);
    setName('');
    setDescription('');
    setIsActive(true);
    setFormOpen(true);
  };

  const openEdit = (z: Zone) => {
    setEditing(z);
    setName(z.name);
    setDescription(z.description ?? '');
    setIsActive(z.isActive !== false);
    setFormOpen(true);
  };

  const saveZone = useMutation({
    mutationFn: async () => {
      const payload = { name: name.trim(), description: description.trim() || undefined, is_active: isActive };
      if (!payload.name) throw new Error('Zone name is required');
      return editing
        ? zonesAPI.updateZone(editing.id, payload)
        : zonesAPI.createZone(payload);
    },
    onSuccess: () => {
      toast({ title: editing ? 'Zone updated' : 'Zone created' });
      setFormOpen(false);
      invalidate();
    },
    onError: (e) => toast({ title: 'Error', description: errMsg(e, 'Could not save zone'), variant: 'destructive' }),
  });

  const removeZone = useMutation({
    mutationFn: async (id: string) => zonesAPI.deleteZone(id),
    onSuccess: () => {
      toast({ title: 'Zone deleted' });
      setDeleteTarget(null);
      invalidate();
    },
    onError: (e) => toast({ title: 'Error', description: errMsg(e, 'Could not delete zone'), variant: 'destructive' }),
  });

  const addPincodes = useMutation({
    mutationFn: async () => {
      const codes = parsePincodes(pincodeInput);
      if (!pincodeZone || codes.length === 0) throw new Error('Enter at least one 6-digit pincode');
      return zonesAPI.addPincodes(
        pincodeZone.id,
        codes.map((pincode) => ({ pincode, city: city.trim() || undefined, state: state.trim() || undefined })),
      );
    },
    onSuccess: () => {
      setPincodeInput('');
      invalidate();
    },
    onError: (e) => toast({ title: 'Error', description: errMsg(e, 'Could not add pincodes'), variant: 'destructive' }),
  });

  const removePincode = useMutation({
    mutationFn: async (pincode: string) => zonesAPI.deletePincode(pincodeZone!.id, pincode),
    onSuccess: () => invalidate(),
    onError: (e) => toast({ title: 'Error', description: errMsg(e, 'Could not remove pincode'), variant: 'destructive' }),
  });

  // Keep the active flag in sync if zone toggled elsewhere.
  useEffect(() => { if (!formOpen) saveZone.reset(); }, [formOpen]); // eslint-disable-line

  const totals = useMemo(() => ({
    zones: zones.length,
    pincodes: zones.reduce((s, z) => s + (z.totalPincodes ?? 0), 0),
    sellers: zones.reduce((s, z) => s + (z.totalCompanies ?? 0), 0),
  }), [zones]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Delivery Zones</h1>
          <p className="text-muted-foreground">
            Group pincodes into zones, then assign sellers to a zone. Customers only get a seller's
            products delivered if their pincode is in that seller's zone.
          </p>
        </div>
        <Button variant="gradient" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" /> Create Zone
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Zones', value: totals.zones, icon: Map, tone: 'text-indigo-700 bg-indigo-100' },
          { label: 'Pincodes covered', value: totals.pincodes, icon: MapPin, tone: 'text-emerald-700 bg-emerald-100' },
          { label: 'Sellers assigned', value: totals.sellers, icon: Building2, tone: 'text-amber-700 bg-amber-100' },
        ].map((s) => (
          <Card key={s.label} className="shadow-card">
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`p-3 rounded-xl ${s.tone}`}><s.icon className="h-5 w-5" /></div>
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">All zones</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          {isLoading ? (
            <div className="py-10 flex items-center justify-center text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading zones…
            </div>
          ) : isError ? (
            <div className="py-10 text-center">
              <p className="text-destructive font-medium">Failed to load zones</p>
              <p className="text-sm text-muted-foreground mt-2">{errMsg(error, 'Server error')}</p>
            </div>
          ) : zones.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No zones yet. Create one and add the pincodes it serves.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Zone</TableHead>
                  <TableHead>Pincodes</TableHead>
                  <TableHead>Sellers</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {zones.map((z) => (
                  <TableRow key={z.id}>
                    <TableCell>
                      <div className="font-medium">{z.name}</div>
                      {z.description ? (
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{z.description}</p>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <button
                        className="inline-flex items-center gap-1.5 text-sm hover:underline"
                        onClick={() => setPincodeZone(z)}
                      >
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                        {z.totalPincodes ?? 0}
                      </button>
                    </TableCell>
                    <TableCell>{z.totalCompanies ?? 0}</TableCell>
                    <TableCell>
                      {z.isActive === false
                        ? <Badge variant="secondary">Inactive</Badge>
                        : <Badge variant="delivered">Active</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover">
                          <DropdownMenuItem onClick={() => setPincodeZone(z)}>
                            <MapPin className="h-4 w-4 mr-2" /> Manage pincodes
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(z)}>
                            <Edit className="h-4 w-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteTarget(z)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit zone */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit zone' : 'Create zone'}</DialogTitle>
            <DialogDescription>A zone is a named group of delivery pincodes.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="zone-name">Name *</Label>
              <Input id="zone-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Hyderabad Central" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zone-desc">Description</Label>
              <Textarea id="zone-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional notes about this zone" />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="zone-active">Active</Label>
              <Switch id="zone-active" checked={isActive} onCheckedChange={setIsActive} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button onClick={() => saveZone.mutate()} disabled={saveZone.isPending}>
              {saveZone.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {editing ? 'Save changes' : 'Create zone'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage pincodes */}
      <Dialog open={!!pincodeZone} onOpenChange={(o) => !o && setPincodeZone(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Pincodes · {pincodeZone?.name}</DialogTitle>
            <DialogDescription>Customers at these pincodes can receive products from sellers in this zone.</DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-1">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label className="text-xs">City (optional)</Label>
                <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">State (optional)</Label>
                <Input value={state} onChange={(e) => setState(e.target.value)} placeholder="State" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Add pincodes</Label>
              <Textarea
                value={pincodeInput}
                onChange={(e) => setPincodeInput(e.target.value)}
                placeholder="Paste or type 6-digit pincodes, e.g. 500001, 500002 500003"
                rows={2}
              />
              <Button size="sm" onClick={() => addPincodes.mutate()} disabled={addPincodes.isPending}>
                {addPincodes.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                Add {parsePincodes(pincodeInput).length || ''} pincode(s)
              </Button>
            </div>

            <div className="border-t border-border pt-3">
              <p className="text-xs text-muted-foreground mb-2">
                {loadingDetail ? 'Loading…' : `${zoneDetail?.pincodes?.length ?? 0} pincode(s) in this zone`}
              </p>
              <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                {(zoneDetail?.pincodes ?? []).map((p) => (
                  <span key={p.id} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/40 px-2.5 py-1 text-xs">
                    <span className="font-mono">{p.pincode}</span>
                    {p.city ? <span className="text-muted-foreground">· {p.city}</span> : null}
                    <button
                      className="text-muted-foreground hover:text-destructive disabled:opacity-50"
                      onClick={() => removePincode.mutate(p.pincode)}
                      disabled={removePincode.isPending}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                {!loadingDetail && (zoneDetail?.pincodes?.length ?? 0) === 0 ? (
                  <span className="text-sm text-muted-foreground">No pincodes added yet.</span>
                ) : null}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPincodeZone(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete zone “{deleteTarget?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              Sellers assigned to this zone will become unassigned (global). This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && removeZone.mutate(deleteTarget.id)}
            >
              {removeZone.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
