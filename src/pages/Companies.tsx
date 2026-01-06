import { useState, useMemo } from 'react';
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
  Upload,
  Loader2
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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companiesAPI, brandsAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { CompanyForm } from '@/components/admin/CompanyForm';
import { BrandForm } from '@/components/admin/BrandForm';

export default function Companies() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('companies');
  const [isCompanyDialogOpen, setIsCompanyDialogOpen] = useState(false);
  const [isBrandDialogOpen, setIsBrandDialogOpen] = useState(false);
  const [editingCompanyId, setEditingCompanyId] = useState<string | undefined>();
  const [editingBrandId, setEditingBrandId] = useState<string | undefined>();
  const [deleteCompanyId, setDeleteCompanyId] = useState<string | null>(null);
  const [deleteBrandId, setDeleteBrandId] = useState<string | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch companies
  const { data: companiesResponse, isLoading: isLoadingCompanies, error: companiesError } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const response = await companiesAPI.getCompanies();
      return response.data || [];
    },
  });

  const companies = companiesResponse || [];

  // Fetch brands
  const { data: brandsResponse, isLoading: isLoadingBrands, error: brandsError } = useQuery({
    queryKey: ['brands'],
    queryFn: async () => {
      const response = await brandsAPI.getBrands();
      return response.data || [];
    },
  });

  const brands = brandsResponse || [];

  // Filter companies based on search
  const filteredCompanies = useMemo(() => {
    if (!searchQuery) return companies;
    const query = searchQuery.toLowerCase();
    return companies.filter((company: any) =>
      company.name?.toLowerCase().includes(query) ||
      company.description?.toLowerCase().includes(query)
    );
  }, [companies, searchQuery]);

  // Filter brands based on search
  const filteredBrands = useMemo(() => {
    if (!searchQuery) return brands;
    const query = searchQuery.toLowerCase();
    return brands.filter((brand: any) =>
      brand.name?.toLowerCase().includes(query) ||
      brand.company?.name?.toLowerCase().includes(query) ||
      brand.category?.name?.toLowerCase().includes(query)
    );
  }, [brands, searchQuery]);

  // Delete company mutation
  const deleteCompanyMutation = useMutation({
    mutationFn: async (id: string) => {
      return await companiesAPI.deleteCompany(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      toast({
        title: 'Company deleted',
        description: 'Company has been deleted successfully',
      });
      setDeleteCompanyId(null);
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error?.message 
        || error.response?.data?.message 
        || 'Failed to delete company';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });

  // Delete brand mutation
  const deleteBrandMutation = useMutation({
    mutationFn: async (id: string) => {
      return await brandsAPI.deleteBrand(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast({
        title: 'Brand deleted',
        description: 'Brand has been deleted successfully',
      });
      setDeleteBrandId(null);
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error?.message 
        || error.response?.data?.message 
        || 'Failed to delete brand';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return 'N/A';
    }
  };

  const handleAddCompany = () => {
    setEditingCompanyId(undefined);
    setIsCompanyDialogOpen(true);
  };

  const handleEditCompany = (id: string) => {
    setEditingCompanyId(id);
    setIsCompanyDialogOpen(true);
  };

  const handleAddBrand = () => {
    setEditingBrandId(undefined);
    setIsBrandDialogOpen(true);
  };

  const handleEditBrand = (id: string) => {
    setEditingBrandId(id);
    setIsBrandDialogOpen(true);
  };

  // Calculate stats
  const totalProducts = companies.reduce((sum: number, c: any) => sum + (c.totalProducts || c.total_products || 0), 0);
  const totalBrandProducts = brands.reduce((sum: number, b: any) => sum + (b.totalProducts || b.total_products || 0), 0);

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
          <Button 
            variant="gradient"
            onClick={activeTab === 'companies' ? handleAddCompany : handleAddBrand}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add {activeTab === 'companies' ? 'Company' : 'Brand'}
          </Button>
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
                <p className="text-2xl font-bold text-foreground">
                  {isLoadingCompanies ? '...' : companies.length}
                </p>
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
                <p className="text-2xl font-bold text-foreground">
                  {isLoadingBrands ? '...' : brands.length}
                </p>
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
                  {isLoadingCompanies ? '...' : totalProducts}
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
                  {isLoadingBrands ? '...' : totalBrandProducts}
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
              {isLoadingCompanies ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : companiesError ? (
                <div className="p-8 text-center text-destructive">
                  <p>Failed to load companies. Please try again.</p>
                </div>
              ) : filteredCompanies.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No companies found</p>
                </div>
              ) : (
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
                      {filteredCompanies.map((company: any) => (
                        <TableRow key={company.id} className="hover:bg-secondary/30">
                          <TableCell>
                            {company.logoUrl || company.logo_url || company.logo ? (
                              <div className="h-12 w-12 rounded-lg bg-secondary border border-border overflow-hidden flex items-center justify-center">
                                <img
                                  src={company.logoUrl || company.logo_url || company.logo}
                                  alt={company.name}
                                  className="max-h-full max-w-full object-contain"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                    const parent = (e.target as HTMLImageElement).parentElement;
                                    if (parent) {
                                      parent.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>';
                                      parent.className = 'h-12 w-12 rounded-lg bg-secondary flex items-center justify-center';
                                    }
                                  }}
                                />
                              </div>
                            ) : (
                              <div className="h-12 w-12 rounded-lg bg-secondary border border-border flex items-center justify-center">
                                <Building2 className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">{company.name}</TableCell>
                          <TableCell className="text-muted-foreground max-w-md truncate">
                            {company.description || 'N/A'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {company.totalProducts || company.total_products || 0}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {company.totalBrands || company.total_brands || 0}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {formatDate(company.createdAt || company.created_at || company.createdDate)}
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
                                <DropdownMenuItem onClick={() => handleEditCompany(company.id)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Company
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Tag className="h-4 w-4 mr-2" />
                                  View Brands
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={() => setDeleteCompanyId(company.id)}
                                >
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
              )}
            </CardContent>
          </TabsContent>

          <TabsContent value="brands" className="m-0">
            <CardContent className="p-0">
              {isLoadingBrands ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : brandsError ? (
                <div className="p-8 text-center text-destructive">
                  <p>Failed to load brands. Please try again.</p>
                </div>
              ) : filteredBrands.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Tag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No brands found</p>
                </div>
              ) : (
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
                      {filteredBrands.map((brand: any) => (
                        <TableRow key={brand.id} className="hover:bg-secondary/30">
                          <TableCell>
                            {brand.logoUrl || brand.logo_url || brand.logo ? (
                              <div className="h-12 w-12 rounded-lg bg-secondary border border-border overflow-hidden flex items-center justify-center">
                                <img
                                  src={brand.logoUrl || brand.logo_url || brand.logo}
                                  alt={brand.name}
                                  className="max-h-full max-w-full object-contain"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                    const parent = (e.target as HTMLImageElement).parentElement;
                                    if (parent) {
                                      parent.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>';
                                      parent.className = 'h-12 w-12 rounded-lg bg-secondary flex items-center justify-center';
                                    }
                                  }}
                                />
                              </div>
                            ) : (
                              <div className="h-12 w-12 rounded-lg bg-secondary border border-border flex items-center justify-center">
                                <Tag className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">{brand.name}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {brand.company?.name || 'N/A'}
                          </TableCell>
                          <TableCell>
                            {brand.category?.name ? (
                              <Badge variant="secondary">{brand.category.name}</Badge>
                            ) : (
                              <span className="text-muted-foreground">N/A</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {brand.totalProducts || brand.total_products || 0}
                            </Badge>
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
                                <DropdownMenuItem onClick={() => handleEditBrand(brand.id)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Brand
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={() => setDeleteBrandId(brand.id)}
                                >
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
              )}
            </CardContent>
          </TabsContent>
        </Tabs>
      </Card>

      {/* Company Form Dialog */}
      <CompanyForm
        open={isCompanyDialogOpen}
        onOpenChange={(open) => {
          setIsCompanyDialogOpen(open);
          if (!open) setEditingCompanyId(undefined);
        }}
        companyId={editingCompanyId}
      />

      {/* Brand Form Dialog */}
      <BrandForm
        open={isBrandDialogOpen}
        onOpenChange={(open) => {
          setIsBrandDialogOpen(open);
          if (!open) setEditingBrandId(undefined);
        }}
        brandId={editingBrandId}
      />

      {/* Delete Company Confirmation */}
      <AlertDialog open={!!deleteCompanyId} onOpenChange={(open) => !open && setDeleteCompanyId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the company and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteCompanyId && deleteCompanyMutation.mutate(deleteCompanyId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteCompanyMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Brand Confirmation */}
      <AlertDialog open={!!deleteBrandId} onOpenChange={(open) => !open && setDeleteBrandId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the brand and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteBrandId && deleteBrandMutation.mutate(deleteBrandId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteBrandMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
