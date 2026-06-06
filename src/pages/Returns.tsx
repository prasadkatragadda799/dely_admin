import { useMemo, useState } from 'react';
import {
  Loader2, RotateCcw, Check, X, Truck, PackageCheck, Eye, Phone,
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { returnsAPI, adminDeliveryAPI, type OrderReturn, type ReturnStatus } from '@/lib/api';
import { resolveMediaUrl } from '@/lib/mediaUrl';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

const errMsg = (e: any, fallback: string) =>
  e?.response?.data?.error?.message || e?.response?.data?.detail || e?.message || fallback;

const STATUS_META: Record<ReturnStatus, { label: string; tone: string; dot: string }> = {
  requested: { label: 'Requested', tone: 'bg-amber-500/15 text-amber-700 border-amber-500/30', dot: 'bg-amber-500' },
  approved: { label: 'Approved', tone: 'bg-blue-500/15 text-blue-700 border-blue-500/30', dot: 'bg-blue-500' },
  pickup_assigned: { label: 'Pickup assigned', tone: 'bg-violet-500/15 text-violet-700 border-violet-500/30', dot: 'bg-violet-500' },
  picked_up: { label: 'Picked up', tone: 'bg-cyan-500/15 text-cyan-700 border-cyan-500/30', dot: 'bg-cyan-500' },
  received_at_hub: { label: 'Received at hub', tone: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30', dot: 'bg-emerald-500' },
  rejected: { label: 'Rejected', tone: 'bg-rose-500/15 text-rose-700 border-rose-500/30', dot: 'bg-rose-500' },
};

const JOURNEY: { key: ReturnStatus; label: string }[] = [
  { key: 'requested', label: 'Requested' },
  { key: 'approved', label: 'Approved' },
  { key: 'pickup_assigned', label: 'Pickup assigned' },
  { key: 'picked_up', label: 'Picked up' },
  { key: 'received_at_hub', label: 'Received at hub' },
];
const stepIndex = (s: ReturnStatus) => JOURNEY.findIndex((j) => j.key === s);

function StatusBadge({ status }: { status: ReturnStatus }) {
  const m = STATUS_META[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-xs ${m.tone}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}

const FILTERS: { value: string; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'requested', label: 'Requested' },
  { value: 'approved', label: 'Approved' },
  { value: 'pickup_assigned', label: 'Pickup' },
  { value: 'picked_up', label: 'Picked up' },
  { value: 'received_at_hub', label: 'Received' },
  { value: 'rejected', label: 'Rejected' },
];

export default function Returns() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('all');
  const [selected, setSelected] = useState<OrderReturn | null>(null);
  const [rejectNotes, setRejectNotes] = useState('');
  const [approveNotes, setApproveNotes] = useState('');
  const [pickupPerson, setPickupPerson] = useState('');

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['returns', tab],
    queryFn: async () =>
      (await returnsAPI.listReturns(tab === 'all' ? { page_size: 100 } : { status: tab, page_size: 100 })).data,
    retry: 1,
  });
  const returns = data?.returns ?? [];

  const { data: dpData } = useQuery({
    queryKey: ['delivery-persons-for-returns'],
    queryFn: async () => (await adminDeliveryAPI.getDeliveryPersons({ page: 1, limit: 100 })).data,
    enabled: !!selected && selected.status === 'approved',
  });
  const deliveryPersons: any[] = (dpData as any)?.items ?? (Array.isArray(dpData) ? dpData : []);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['returns'] });

  const approve = useMutation({
    mutationFn: async () => returnsAPI.approveReturn(selected!.returnId, approveNotes.trim() || undefined),
    onSuccess: () => { toast({ title: 'Return approved' }); setSelected(null); setApproveNotes(''); invalidate(); },
    onError: (e) => toast({ title: 'Error', description: errMsg(e, 'Could not approve'), variant: 'destructive' }),
  });
  const reject = useMutation({
    mutationFn: async () => {
      if (!rejectNotes.trim()) throw new Error('A rejection reason is required');
      return returnsAPI.rejectReturn(selected!.returnId, rejectNotes.trim());
    },
    onSuccess: () => { toast({ title: 'Return rejected' }); setSelected(null); setRejectNotes(''); invalidate(); },
    onError: (e) => toast({ title: 'Error', description: errMsg(e, 'Could not reject'), variant: 'destructive' }),
  });
  const assign = useMutation({
    mutationFn: async () => {
      if (!pickupPerson) throw new Error('Select a delivery person');
      return returnsAPI.assignPickup(selected!.returnId, pickupPerson);
    },
    onSuccess: () => { toast({ title: 'Pickup assigned' }); setSelected(null); setPickupPerson(''); invalidate(); },
    onError: (e) => toast({ title: 'Error', description: errMsg(e, 'Could not assign pickup'), variant: 'destructive' }),
  });

  const counts = useMemo(() => ({
    pending: returns.filter((r) => r.status === 'requested').length,
    inProgress: returns.filter((r) => ['approved', 'pickup_assigned', 'picked_up'].includes(r.status)).length,
    done: returns.filter((r) => r.status === 'received_at_hub').length,
  }), [returns]);

  const openManage = (r: OrderReturn) => {
    setSelected(r);
    setRejectNotes(''); setApproveNotes(''); setPickupPerson('');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Order Returns</h1>
        <p className="text-muted-foreground">
          Review return requests, approve or reject them, and assign a delivery partner to collect the item.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Awaiting review', value: counts.pending, tone: 'text-amber-700 bg-amber-100', icon: RotateCcw },
          { label: 'In progress', value: counts.inProgress, tone: 'text-blue-700 bg-blue-100', icon: Truck },
          { label: 'Received at hub', value: counts.done, tone: 'text-emerald-700 bg-emerald-100', icon: PackageCheck },
        ].map((s) => (
          <Card key={s.label} className="shadow-card">
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`p-3 rounded-xl ${s.tone}`}><s.icon className="h-5 w-5" /></div>
              <div><p className="text-2xl font-bold">{s.value}</p><p className="text-sm text-muted-foreground">{s.label}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-card">
        <CardHeader className="pb-2 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <CardTitle className="text-lg font-semibold">Return requests</CardTitle>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="bg-secondary/40 flex-wrap h-auto">
              {FILTERS.map((f) => <TabsTrigger key={f.value} value={f.value}>{f.label}</TabsTrigger>)}
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="p-4">
          {isLoading ? (
            <div className="py-10 flex items-center justify-center text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading returns…
            </div>
          ) : isError ? (
            <div className="py-10 text-center">
              <p className="text-destructive font-medium">Failed to load returns</p>
              <p className="text-sm text-muted-foreground mt-2">{errMsg(error, 'Server error')}</p>
            </div>
          ) : returns.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">No return requests in this view.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {returns.map((r) => (
                  <TableRow key={r.returnId}>
                    <TableCell>
                      <div className="font-mono text-xs">#{(r.orderNumber || r.orderId).slice(-12)}</div>
                      {r.orderTotal != null ? <div className="text-xs text-muted-foreground">Rs {r.orderTotal}</div> : null}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{r.customerName || 'Customer'}</div>
                      {r.customerPhone ? <div className="text-xs text-muted-foreground">{r.customerPhone}</div> : null}
                    </TableCell>
                    <TableCell className="max-w-[220px]">
                      <p className="text-sm line-clamp-2">{r.reason}</p>
                    </TableCell>
                    <TableCell><StatusBadge status={r.status} /></TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => openManage(r)}>
                        <Eye className="h-4 w-4 mr-1.5" /> Manage
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Manage / detail dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {selected ? (
            <>
              <DialogHeader>
                <DialogTitle>Return · #{(selected.orderNumber || selected.orderId).slice(-12)}</DialogTitle>
                <DialogDescription>{STATUS_META[selected.status].label}</DialogDescription>
              </DialogHeader>

              {/* Journey timeline */}
              {selected.status !== 'rejected' ? (
                <div className="flex items-center justify-between px-1 py-3">
                  {JOURNEY.map((j, i) => {
                    const done = stepIndex(selected.status) >= i;
                    return (
                      <div key={j.key} className="flex-1 flex flex-col items-center text-center relative">
                        {i < JOURNEY.length - 1 ? (
                          <div className={`absolute top-2 left-1/2 w-full h-0.5 ${stepIndex(selected.status) > i ? 'bg-emerald-500' : 'bg-border'}`} />
                        ) : null}
                        <div className={`h-4 w-4 rounded-full z-10 ${done ? 'bg-emerald-500' : 'bg-muted border border-border'}`} />
                        <span className={`mt-1.5 text-[10px] leading-tight ${done ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>{j.label}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                  This return was rejected.{selected.adminNotes ? ` Reason: ${selected.adminNotes}` : ''}
                </div>
              )}

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Customer</span>
                  <span className="font-medium flex items-center gap-1.5">
                    {selected.customerName}
                    {selected.customerPhone ? <span className="text-muted-foreground inline-flex items-center gap-1"><Phone className="h-3 w-3" />{selected.customerPhone}</span> : null}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Payment</span>
                  <span className="font-medium uppercase">{selected.paymentMethod || '—'}</span>
                </div>
                {selected.deliveryPersonName ? (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Pickup partner</span>
                    <span className="font-medium">{selected.deliveryPersonName}</span>
                  </div>
                ) : null}
                <div>
                  <span className="text-muted-foreground">Reason</span>
                  <p className="mt-1 rounded-lg bg-secondary/40 border border-border p-2.5">{selected.reason}</p>
                </div>
                {selected.mediaUrls && selected.mediaUrls.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selected.mediaUrls.map((m, i) => (
                      <a key={i} href={resolveMediaUrl(m.url)} target="_blank" rel="noreferrer">
                        <img src={resolveMediaUrl(m.url)} alt="return evidence" className="h-16 w-16 rounded-lg object-cover border border-border" />
                      </a>
                    ))}
                  </div>
                ) : null}
                {selected.bankAccountNumber ? (
                  <div className="rounded-lg border border-border p-2.5 space-y-0.5 text-xs">
                    <p className="font-semibold text-foreground mb-1">COD refund bank details</p>
                    <p>{selected.bankAccountHolder} · {selected.bankName}</p>
                    <p className="font-mono">A/C {selected.bankAccountNumber} · IFSC {selected.bankIfscCode}</p>
                  </div>
                ) : null}
              </div>

              {/* Actions per status */}
              {selected.status === 'requested' ? (
                <div className="space-y-3 border-t border-border pt-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Notes (optional for approve, required for reject)</Label>
                    <Textarea value={rejectNotes} onChange={(e) => { setRejectNotes(e.target.value); setApproveNotes(e.target.value); }} rows={2} placeholder="e.g. Approved — pickup will be arranged / or rejection reason" />
                  </div>
                  <div className="flex gap-2">
                    <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => approve.mutate()} disabled={approve.isPending}>
                      {approve.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />} Approve
                    </Button>
                    <Button variant="outline" className="flex-1 text-rose-600 border-rose-200 hover:bg-rose-50" onClick={() => reject.mutate()} disabled={reject.isPending}>
                      {reject.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <X className="h-4 w-4 mr-2" />} Reject
                    </Button>
                  </div>
                </div>
              ) : selected.status === 'approved' ? (
                <div className="space-y-3 border-t border-border pt-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Assign delivery partner for pickup</Label>
                    <Select value={pickupPerson} onValueChange={setPickupPerson}>
                      <SelectTrigger><SelectValue placeholder="Select delivery person" /></SelectTrigger>
                      <SelectContent>
                        {deliveryPersons.map((dp) => (
                          <SelectItem key={dp.id} value={dp.id}>{dp.name}{dp.phone ? ` · ${dp.phone}` : ''}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="w-full" onClick={() => assign.mutate()} disabled={assign.isPending}>
                    {assign.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Truck className="h-4 w-4 mr-2" />} Assign pickup
                  </Button>
                </div>
              ) : (
                <div className="border-t border-border pt-3 text-xs text-muted-foreground">
                  {selected.status === 'received_at_hub'
                    ? 'Item received at hub — process the refund as per your policy.'
                    : 'Pickup is in progress and handled by the delivery partner app.'}
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setSelected(null)}>Close</Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
