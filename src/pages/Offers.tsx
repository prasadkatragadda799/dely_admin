import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Tag,
  Download,
  Upload,
  Image as ImageIcon,
  FileText,
  Building2,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { offersAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

const offerTypes = [
  { value: 'banner', label: 'Banner Offer', icon: ImageIcon },
  { value: 'text', label: 'Text Offer', icon: FileText },
  { value: 'company', label: 'Company Offer', icon: Building2 },
];

export default function Offers() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<any | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [selectedType, setSelectedType] = useState('banner');
  const [validFrom, setValidFrom] = useState<Date>();
  const [validTo, setValidTo] = useState<Date>();
  const [formImage, setFormImage] = useState<File | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: offersResponse, isLoading: loadingOffers } = useQuery({
    queryKey: ['offers', filterType, filterStatus],
    queryFn: async () => {
      const params: { type?: string; status?: string } = {};
      if (filterType !== 'all') params.type = filterType;
      if (filterStatus !== 'all') params.status = filterStatus;
      return offersAPI.getOffers(params);
    },
  });

  const offersList = Array.isArray(offersResponse?.data) ? offersResponse.data : [];
  const filteredOffers = useMemo(() => {
    if (!searchQuery.trim()) return offersList;
    const q = searchQuery.toLowerCase();
    return offersList.filter(
      (o: any) =>
        (o.title || '').toLowerCase().includes(q) ||
        (o.description || '').toLowerCase().includes(q)
    );
  }, [offersList, searchQuery]);

  const createMutation = useMutation({
    mutationFn: (formData: FormData) => offersAPI.createOffer(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offers'] });
      toast({ title: 'Offer created', description: 'The offer has been created successfully.' });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create offer',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, formData }: { id: string; formData: FormData }) =>
      offersAPI.updateOffer(id, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offers'] });
      toast({ title: 'Offer updated', description: 'The offer has been updated successfully.' });
      resetForm();
      setEditingOffer(null);
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update offer',
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => offersAPI.deleteOffer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offers'] });
      toast({ title: 'Offer deleted', description: 'The offer has been deleted.' });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete offer',
        variant: 'destructive',
      });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => offersAPI.toggleOfferStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offers'] });
      toast({ title: 'Status updated', description: 'Offer status has been toggled.' });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to toggle status',
        variant: 'destructive',
      });
    },
  });

  const resetForm = () => {
    setFormTitle('');
    setFormDescription('');
    setSelectedType('banner');
    setValidFrom(undefined);
    setValidTo(undefined);
    setFormImage(null);
    setEditingOffer(null);
  };

  const openCreate = () => {
    resetForm();
    setEditingOffer(null);
    setIsDialogOpen(true);
  };

  const openEdit = (offer: any) => {
    setEditingOffer(offer);
    setFormTitle(offer.title || '');
    setFormDescription(offer.description || '');
    setSelectedType(offer.type || 'banner');
    setValidFrom(offer.validFrom ? new Date(offer.validFrom) : undefined);
    setValidTo(offer.validTo ? new Date(offer.validTo) : undefined);
    setFormImage(null);
    setIsDialogOpen(true);
  };

  const buildFormData = (): FormData => {
    const formData = new FormData();
    formData.append('title', formTitle);
    formData.append('type', selectedType);
    formData.append('description', formDescription);
    if (validFrom) formData.append('validFrom', validFrom.toISOString().split('T')[0]);
    if (validTo) formData.append('validTo', validTo.toISOString().split('T')[0]);
    if (formImage) formData.append('image', formImage);
    return formData;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      toast({ title: 'Validation', description: 'Offer title is required.', variant: 'destructive' });
      return;
    }
    if (editingOffer?.id) {
      updateMutation.mutate({ id: String(editingOffer.id), formData: buildFormData() });
    } else {
      createMutation.mutate(buildFormData());
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getTypeIcon = (type: string) => offerTypes.find((t) => t.value === type)?.icon || Tag;
  const getTypeLabel = (type: string) => offerTypes.find((t) => t.value === type)?.label || type;

  const isOfferActive = (offer: any) => {
    const today = new Date();
    const from = new Date(offer.validFrom || offer.valid_from || 0);
    const to = new Date(offer.validTo || offer.valid_to || 0);
    const status = offer.status || 'inactive';
    return status === 'active' && today >= from && today <= to;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Offers & Promotions</h1>
          <p className="text-muted-foreground">Manage promotional offers and campaigns</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) { setIsDialogOpen(false); resetForm(); } else setIsDialogOpen(open); }}>
            <DialogTrigger asChild>
              <Button variant="gradient" onClick={openCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Add Offer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingOffer ? 'Edit Offer' : 'Create New Offer'}</DialogTitle>
                <DialogDescription>
                  {editingOffer ? 'Update the promotional offer.' : 'Add a new promotional offer to attract customers.'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="offer-title">Offer Title *</Label>
                  <Input
                    id="offer-title"
                    placeholder="Enter offer title"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="offer-type">Offer Type *</Label>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger id="offer-type">
                      <SelectValue placeholder="Select offer type" />
                    </SelectTrigger>
                    <SelectContent>
                      {offerTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <type.icon className="h-4 w-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="offer-description">Description</Label>
                  <Textarea
                    id="offer-description"
                    placeholder="Enter offer description"
                    rows={3}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                  />
                </div>
                {selectedType !== 'text' && (
                  <div className="space-y-2">
                    <Label htmlFor="offer-image">Offer Image</Label>
                    <div className="flex items-center gap-4">
                      <div className="h-32 w-full rounded-lg bg-secondary border-2 border-dashed border-border flex items-center justify-center">
                        <div className="text-center">
                          {editingOffer?.imageUrl || editingOffer?.image_url ? (
                            <img src={editingOffer.imageUrl || editingOffer.image_url} alt="" className="h-full w-full object-cover rounded-lg" />
                          ) : formImage ? (
                            <p className="text-sm text-muted-foreground">{formImage.name}</p>
                          ) : (
                            <>
                              <ImageIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                              <p className="text-sm text-muted-foreground">Upload offer image</p>
                              <p className="text-xs text-muted-foreground">Recommended: 1200x400px</p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => document.getElementById('offer-image-file')?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {formImage ? 'Change Image' : 'Upload Image'}
                    </Button>
                    <input
                      id="offer-image-file"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => setFormImage(e.target.files?.[0] ?? null)}
                    />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Valid From *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          {validFrom ? format(validFrom, 'PPP') : 'Pick a date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={validFrom}
                          onSelect={setValidFrom}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label>Valid To *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          {validTo ? format(validTo, 'PPP') : 'Pick a date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={validTo}
                          onSelect={setValidTo}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="gradient"
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    {editingOffer ? 'Update Offer' : 'Create Offer'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Tag className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{offersList.length}</p>
                <p className="text-xs text-muted-foreground">Total Offers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100">
                <Tag className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {offersList.filter((o: any) => isOfferActive(o)).length}
                </p>
                <p className="text-xs text-muted-foreground">Active Offers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100">
                <ImageIcon className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {offersList.filter((o: any) => (o.type || o.offer_type) === 'banner').length}
                </p>
                <p className="text-xs text-muted-foreground">Banner Offers</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <Building2 className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {offersList.filter((o: any) => (o.type || o.offer_type) === 'company').length}
                </p>
                <p className="text-xs text-muted-foreground">Company Offers</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="shadow-card">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search offers by title or description..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {offerTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Offers Table */}
      <Card className="shadow-card">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/50">
                  <TableHead>Preview</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Valid From</TableHead>
                  <TableHead>Valid To</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingOffers ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                      Loading offers…
                    </TableCell>
                  </TableRow>
                ) : filteredOffers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                      No offers found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOffers.map((offer: any) => {
                    const type = offer.type || offer.offer_type || 'banner';
                    const TypeIcon = getTypeIcon(type);
                    const imageUrl = offer.image || offer.imageUrl || offer.image_url;
                    const validFromStr = offer.validFrom || offer.valid_from;
                    const validToStr = offer.validTo || offer.valid_to;
                    const offerId = offer.id || offer.offer_id;
                    return (
                      <TableRow key={offerId} className="hover:bg-secondary/30">
                        <TableCell>
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={offer.title}
                              className="h-16 w-32 rounded-lg object-cover bg-secondary"
                            />
                          ) : (
                            <div className="h-16 w-32 rounded-lg bg-secondary border-2 border-dashed border-border flex items-center justify-center">
                              <TypeIcon className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-foreground">{offer.title}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {offer.description || '-'}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                            <TypeIcon className="h-3 w-3" />
                            {getTypeLabel(type)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {validFromStr ? formatDate(validFromStr) : '-'}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {validToStr ? formatDate(validToStr) : '-'}
                        </TableCell>
                        <TableCell>
                          {isOfferActive(offer) ? (
                            <Badge variant="delivered">Active</Badge>
                          ) : (
                            <Badge variant="cancelled">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEdit(offer)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Preview / View
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEdit(offer)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Offer
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => toggleMutation.mutate(offerId)}
                                disabled={toggleMutation.isPending}
                              >
                                <Tag className="h-4 w-4 mr-2" />
                                Toggle Status
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => {
                                  if (window.confirm('Delete this offer?')) deleteMutation.mutate(offerId);
                                }}
                                disabled={deleteMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Offer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

