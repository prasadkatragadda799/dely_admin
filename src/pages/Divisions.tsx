import { useMemo, useState } from 'react';
import { Plus, Edit, MoreHorizontal, Layers, Loader2 } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { divisionsAPI, type Division } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DivisionForm } from '@/components/admin/DivisionForm';

const divisionTone = (slug?: string) => {
  if (slug === 'kitchen') return { chip: 'bg-amber-500/15 text-amber-700 border-amber-500/30', dot: 'bg-amber-500' };
  if (slug === 'default') return { chip: 'bg-blue-500/15 text-blue-700 border-blue-500/30', dot: 'bg-blue-500' };
  return { chip: 'bg-muted text-foreground border-border', dot: 'bg-muted-foreground' };
};

export default function Divisions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'all' | 'default' | 'kitchen'>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDivisionId, setEditingDivisionId] = useState<string | undefined>();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['divisions'],
    queryFn: async () => {
      const res = await divisionsAPI.getDivisions();
      return (res.data || []) as Division[];
    },
    retry: 1,
  });

  const divisions = data ?? [];

  const filtered = useMemo(() => {
    if (tab === 'all') return divisions;
    return divisions.filter((d) => d.slug === tab);
  }, [divisions, tab]);

  const pinned = useMemo(() => {
    const bySlug: Record<string, Division | undefined> = {};
    for (const d of divisions) bySlug[d.slug] = d;
    return {
      grocery: bySlug.default,
      kitchen: bySlug.kitchen,
    };
  }, [divisions]);

  const openCreate = () => {
    setEditingDivisionId(undefined);
    setIsFormOpen(true);
  };

  const openEdit = (id: string) => {
    setEditingDivisionId(id);
    setIsFormOpen(true);
  };

  const toggleActive = useMutation({
    mutationFn: async (division: Division) => {
      return divisionsAPI.updateDivision(division.id, { isActive: !(division.isActive !== false) });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['divisions'] }),
    onError: (e: any) => {
      toast({
        title: 'Error',
        description: e.response?.data?.error?.message || 'Failed to update division',
        variant: 'destructive',
      });
    },
  });

  const HeaderCard = ({ d, fallbackTitle, fallbackSlug }: { d?: Division; fallbackTitle: string; fallbackSlug: 'default' | 'kitchen' }) => {
    const tone = divisionTone(d?.slug ?? fallbackSlug);
    return (
      <Card className="shadow-card overflow-hidden relative">
        <div className="absolute inset-0 opacity-60 bg-gradient-to-br from-transparent via-transparent to-secondary/40" />
        <CardContent className="p-5 relative">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="h-11 w-11 rounded-xl bg-background border border-border flex items-center justify-center shadow-sm">
                <span className="text-2xl">{d?.icon ?? (fallbackSlug === 'kitchen' ? '🍳' : '🛒')}</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-semibold">{d?.name ?? fallbackTitle}</p>
                  <span className={`inline-flex items-center gap-2 px-2 py-0.5 rounded-full border text-xs ${tone.chip}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
                    {fallbackSlug === 'default' ? 'Grocery' : 'Kitchen'} tab
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {d?.description ?? (fallbackSlug === 'kitchen'
                    ? 'Kitchen vertical: cookware, storage, utensils, appliances.'
                    : 'Default division for existing data when division_id is NULL.')}
                </p>
                <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                  <span>slug: <span className="font-mono text-foreground">{d?.slug ?? fallbackSlug}</span></span>
                  <span>order: <span className="font-mono text-foreground">{d?.displayOrder ?? 0}</span></span>
                  <span className={d?.isActive === false ? 'text-destructive' : 'text-emerald-700'}>
                    {d?.isActive === false ? 'inactive' : 'active'}
                  </span>
                </div>
              </div>
            </div>
            {d?.id ? (
              <Button variant="outline" onClick={() => openEdit(d.id)} className="shrink-0">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Divisions</h1>
          <p className="text-muted-foreground">
            Instamart-style verticals for the app (tabs) and cart separation.
          </p>
        </div>
        <Button variant="gradient" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Create Division
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <HeaderCard d={pinned.grocery} fallbackTitle="Grocery" fallbackSlug="default" />
        <HeaderCard d={pinned.kitchen} fallbackTitle="Kitchen" fallbackSlug="kitchen" />
      </div>

      <Card className="shadow-card">
        <CardHeader className="pb-2 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-100">
              <Layers className="h-5 w-5 text-indigo-700" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">All divisions</CardTitle>
              <p className="text-xs text-muted-foreground">Sorted by display order</p>
            </div>
          </div>

          <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
            <TabsList className="bg-secondary/40">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="default">Grocery</TabsTrigger>
              <TabsTrigger value="kitchen">Kitchen</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="p-4">
          {isLoading ? (
            <div className="py-10 flex items-center justify-center text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Loading divisions…
            </div>
          ) : isError ? (
            <div className="py-10 text-center">
              <p className="text-destructive font-medium">Failed to load divisions</p>
              <p className="text-sm text-muted-foreground mt-2">
                {(error as any)?.response?.data?.error?.message || (error as any)?.message || 'Server returned an error.'}
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">No divisions found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Division</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Display order</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((d) => {
                  const tone = divisionTone(d.slug);
                  return (
                    <TableRow key={d.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-secondary/30 border border-border flex items-center justify-center">
                            <span className="text-lg">{d.icon || '🧩'}</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{d.name}</span>
                              {(d.slug === 'default' || d.slug === 'kitchen') && (
                                <span className={`inline-flex items-center gap-2 px-2 py-0.5 rounded-full border text-xs ${tone.chip}`}>
                                  <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
                                  {d.slug === 'default' ? 'Grocery' : 'Kitchen'}
                                </span>
                              )}
                            </div>
                            {d.description ? (
                              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{d.description}</p>
                            ) : null}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs">{d.slug}</span>
                      </TableCell>
                      <TableCell>{d.displayOrder ?? 0}</TableCell>
                      <TableCell>
                        {d.isActive === false ? (
                          <Badge variant="secondary">Inactive</Badge>
                        ) : (
                          <Badge variant="delivered">Active</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-popover">
                            <DropdownMenuItem onClick={() => openEdit(d.id)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toggleActive.mutate(d)} disabled={toggleActive.isPending}>
                              {toggleActive.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                              {d.isActive === false ? 'Set Active' : 'Set Inactive'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <DivisionForm open={isFormOpen} onOpenChange={setIsFormOpen} divisionId={editingDivisionId} />
    </div>
  );
}

