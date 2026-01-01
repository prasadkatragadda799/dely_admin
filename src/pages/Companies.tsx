import { useState } from 'react';
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye,
  Building2,
  Tag,
  Download,
  Upload
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// Mock data
const companies = [
  {
    id: 1,
    name: 'KRBL Limited',
    description: 'Leading rice manufacturer and exporter',
    logo: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=80&h=80&fit=crop',
    totalProducts: 45,
    totalBrands: 3,
    createdDate: '2023-01-15',
  },
  {
    id: 2,
    name: 'Adani Wilmar',
    description: 'Major FMCG company specializing in cooking oils',
    logo: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=80&h=80&fit=crop',
    totalProducts: 78,
    totalBrands: 5,
    createdDate: '2023-02-20',
  },
  {
    id: 3,
    name: 'ITC Limited',
    description: 'Diversified conglomerate with strong FMCG presence',
    logo: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=80&h=80&fit=crop',
    totalProducts: 120,
    totalBrands: 8,
    createdDate: '2023-03-10',
  },
  {
    id: 4,
    name: 'Tata Consumer',
    description: 'Consumer goods division of Tata Group',
    logo: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=80&h=80&fit=crop',
    totalProducts: 95,
    totalBrands: 6,
    createdDate: '2023-04-15',
  },
];

const brands = [
  {
    id: 1,
    name: 'India Gate',
    company: 'KRBL Limited',
    category: 'Rice & Grains',
    logo: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=80&h=80&fit=crop',
    totalProducts: 15,
  },
  {
    id: 2,
    name: 'Fortune',
    company: 'Adani Wilmar',
    category: 'Cooking Oil',
    logo: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=80&h=80&fit=crop',
    totalProducts: 28,
  },
  {
    id: 3,
    name: 'Aashirvaad',
    company: 'ITC Limited',
    category: 'Flour & Atta',
    logo: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=80&h=80&fit=crop',
    totalProducts: 22,
  },
  {
    id: 4,
    name: 'Tata Sampann',
    company: 'Tata Consumer',
    category: 'Pulses & Lentils',
    logo: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=80&h=80&fit=crop',
    totalProducts: 18,
  },
];

export default function Companies() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('companies');
  const [isCompanyDialogOpen, setIsCompanyDialogOpen] = useState(false);
  const [isBrandDialogOpen, setIsBrandDialogOpen] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Companies & Brands</h1>
          <p className="text-muted-foreground">Manage companies and their brands</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Dialog open={activeTab === 'companies' ? isCompanyDialogOpen : isBrandDialogOpen} 
                  onOpenChange={activeTab === 'companies' ? setIsCompanyDialogOpen : setIsBrandDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="gradient">
                <Plus className="h-4 w-4 mr-2" />
                Add {activeTab === 'companies' ? 'Company' : 'Brand'}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add {activeTab === 'companies' ? 'Company' : 'Brand'}</DialogTitle>
                <DialogDescription>
                  {activeTab === 'companies' 
                    ? 'Create a new company in the system'
                    : 'Create a new brand and assign it to a company'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {activeTab === 'companies' ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="company-name">Company Name *</Label>
                      <Input id="company-name" placeholder="Enter company name" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company-description">Description</Label>
                      <Textarea 
                        id="company-description" 
                        placeholder="Enter company description"
                        rows={4}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company-logo">Company Logo</Label>
                      <div className="flex items-center gap-4">
                        <div className="h-20 w-20 rounded-lg bg-secondary border-2 border-dashed border-border flex items-center justify-center">
                          <Building2 className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <Button variant="outline" size="sm">
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Logo
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="brand-name">Brand Name *</Label>
                      <Input id="brand-name" placeholder="Enter brand name" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="brand-company">Company *</Label>
                      <select 
                        id="brand-company" 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="">Select company</option>
                        {companies.map((company) => (
                          <option key={company.id} value={company.id}>
                            {company.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="brand-category">Category</Label>
                      <Input id="brand-category" placeholder="Enter category" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="brand-logo">Brand Logo</Label>
                      <div className="flex items-center gap-4">
                        <div className="h-20 w-20 rounded-lg bg-secondary border-2 border-dashed border-border flex items-center justify-center">
                          <Tag className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <Button variant="outline" size="sm">
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Logo
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  setIsCompanyDialogOpen(false);
                  setIsBrandDialogOpen(false);
                }}>
                  Cancel
                </Button>
                <Button variant="gradient">Save {activeTab === 'companies' ? 'Company' : 'Brand'}</Button>
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
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{companies.length}</p>
                <p className="text-xs text-muted-foreground">Total Companies</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <Tag className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{brands.length}</p>
                <p className="text-xs text-muted-foreground">Total Brands</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100">
                <Building2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {companies.reduce((sum, c) => sum + c.totalProducts, 0)}
                </p>
                <p className="text-xs text-muted-foreground">Total Products</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100">
                <Tag className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {brands.reduce((sum, b) => sum + b.totalProducts, 0)}
                </p>
                <p className="text-xs text-muted-foreground">Brand Products</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="shadow-card">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={`Search ${activeTab}...`}
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Companies and Brands Tabs */}
      <Card className="shadow-card">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="border-b border-border px-4">
            <TabsList className="h-12 bg-transparent p-0 gap-6">
              <TabsTrigger 
                value="companies" 
                className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0"
              >
                Companies
              </TabsTrigger>
              <TabsTrigger 
                value="brands"
                className="data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0"
              >
                Brands
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="companies" className="m-0">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary/50">
                      <TableHead>Logo</TableHead>
                      <TableHead>Company Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Products</TableHead>
                      <TableHead>Brands</TableHead>
                      <TableHead>Created Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {companies.map((company) => (
                      <TableRow key={company.id} className="hover:bg-secondary/30">
                        <TableCell>
                          <img
                            src={company.logo}
                            alt={company.name}
                            className="h-12 w-12 rounded-lg object-cover bg-secondary"
                          />
                        </TableCell>
                        <TableCell className="font-medium">{company.name}</TableCell>
                        <TableCell className="text-muted-foreground max-w-md truncate">
                          {company.description}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{company.totalProducts}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{company.totalBrands}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {formatDate(company.createdDate)}
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
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Company
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Tag className="h-4 w-4 mr-2" />
                                View Brands
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Company
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </TabsContent>

          <TabsContent value="brands" className="m-0">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary/50">
                      <TableHead>Logo</TableHead>
                      <TableHead>Brand Name</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Products</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {brands.map((brand) => (
                      <TableRow key={brand.id} className="hover:bg-secondary/30">
                        <TableCell>
                          <img
                            src={brand.logo}
                            alt={brand.name}
                            className="h-12 w-12 rounded-lg object-cover bg-secondary"
                          />
                        </TableCell>
                        <TableCell className="font-medium">{brand.name}</TableCell>
                        <TableCell className="text-muted-foreground">{brand.company}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{brand.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{brand.totalProducts}</Badge>
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
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Brand
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Brand
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}

