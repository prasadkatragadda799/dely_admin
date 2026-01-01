import { useState } from 'react';
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
  Building2
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
import { Switch } from '@/components/ui/switch';
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

// Mock data
const offers = [
  {
    id: 1,
    title: 'Summer Sale - 20% Off',
    type: 'banner',
    image: 'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=400&h=200&fit=crop',
    validFrom: '2024-01-01',
    validTo: '2024-01-31',
    status: 'active',
    description: 'Get 20% off on all products this summer',
  },
  {
    id: 2,
    title: 'New Year Special',
    type: 'text',
    image: null,
    validFrom: '2024-01-15',
    validTo: '2024-02-15',
    status: 'active',
    description: 'Special discounts for the new year',
  },
  {
    id: 3,
    title: 'KRBL Limited - Bulk Discount',
    type: 'company',
    image: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=400&h=200&fit=crop',
    validFrom: '2024-01-10',
    validTo: '2024-01-25',
    status: 'inactive',
    description: 'Special bulk pricing for KRBL products',
  },
  {
    id: 4,
    title: 'Weekend Flash Sale',
    type: 'banner',
    image: 'https://images.unsplash.com/photo-1607082349566-187342175e2f?w=400&h=200&fit=crop',
    validFrom: '2024-01-20',
    validTo: '2024-01-22',
    status: 'active',
    description: 'Flash sale on weekends only',
  },
];

const offerTypes = [
  { value: 'banner', label: 'Banner Offer', icon: ImageIcon },
  { value: 'text', label: 'Text Offer', icon: FileText },
  { value: 'company', label: 'Company Offer', icon: Building2 },
];

export default function Offers() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState('banner');
  const [validFrom, setValidFrom] = useState<Date>();
  const [validTo, setValidTo] = useState<Date>();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getTypeIcon = (type: string) => {
    return offerTypes.find(t => t.value === type)?.icon || Tag;
  };

  const getTypeLabel = (type: string) => {
    return offerTypes.find(t => t.value === type)?.label || type;
  };

  const isOfferActive = (offer: typeof offers[0]) => {
    const today = new Date();
    const from = new Date(offer.validFrom);
    const to = new Date(offer.validTo);
    return offer.status === 'active' && today >= from && today <= to;
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
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="gradient">
                <Plus className="h-4 w-4 mr-2" />
                Add Offer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Offer</DialogTitle>
                <DialogDescription>
                  Add a new promotional offer to attract customers
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="offer-title">Offer Title *</Label>
                  <Input id="offer-title" placeholder="Enter offer title" />
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
                  />
                </div>
                {selectedType !== 'text' && (
                  <div className="space-y-2">
                    <Label htmlFor="offer-image">Offer Image</Label>
                    <div className="flex items-center gap-4">
                      <div className="h-32 w-full rounded-lg bg-secondary border-2 border-dashed border-border flex items-center justify-center">
                        <div className="text-center">
                          <ImageIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">Upload offer image</p>
                          <p className="text-xs text-muted-foreground">Recommended: 1200x400px</p>
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="w-full">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Image
                    </Button>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Valid From *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
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
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="offer-status">Active Status</Label>
                    <p className="text-xs text-muted-foreground">
                      Enable or disable this offer
                    </p>
                  </div>
                  <Switch id="offer-status" defaultChecked />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button variant="gradient">Create Offer</Button>
              </DialogFooter>
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
                <p className="text-2xl font-bold text-foreground">{offers.length}</p>
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
                  {offers.filter(o => isOfferActive(o)).length}
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
                  {offers.filter(o => o.type === 'banner').length}
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
                  {offers.filter(o => o.type === 'company').length}
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
            <Select defaultValue="all">
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
            <Select defaultValue="all">
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
                {offers.map((offer) => {
                  const TypeIcon = getTypeIcon(offer.type);
                  return (
                    <TableRow key={offer.id} className="hover:bg-secondary/30">
                      <TableCell>
                        {offer.image ? (
                          <img
                            src={offer.image}
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
                            {offer.description}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                          <TypeIcon className="h-3 w-3" />
                          {getTypeLabel(offer.type)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(offer.validFrom)}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(offer.validTo)}
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
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              Preview
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Offer
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Tag className="h-4 w-4 mr-2" />
                              Toggle Status
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Offer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

