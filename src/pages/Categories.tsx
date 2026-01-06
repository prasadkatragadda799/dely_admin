import { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  ChevronRight,
  FolderTree,
  Package,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesAPI } from '@/lib/api';
import { CategoryForm } from '@/components/admin/CategoryForm';
import { useToast } from '@/hooks/use-toast';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  parentId?: string;
  displayOrder?: number;
  isActive?: boolean;
  image?: string;
  productCount?: number;
  children?: Category[];
}

export default function Categories() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | undefined>();
  const [parentCategoryId, setParentCategoryId] = useState<string | undefined>();
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch categories
  const { data: categoriesData, isLoading, isError, error } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await categoriesAPI.getCategories();
      return response.data || [];
    },
    retry: 1, // Only retry once
    onError: (error: any) => {
      console.error('Failed to fetch categories:', error);
      toast({
        title: 'Error loading categories',
        description: error.response?.data?.error?.message || error.message || 'Failed to load categories. Please check your connection and try again.',
        variant: 'destructive',
      });
    },
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: categoriesAPI.deleteCategory,
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Category deleted successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setDeletingCategoryId(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error?.message || 'Failed to delete category',
        variant: 'destructive',
      });
    },
  });

  // Filter categories based on search
  const filteredCategories = useMemo(() => {
    if (!categoriesData) return [];
    if (!searchQuery) return categoriesData;

    const searchLower = searchQuery.toLowerCase();
    const filterRecursive = (cats: Category[]): Category[] => {
      return cats
        .map(cat => {
          const matchesSearch = 
            cat.name.toLowerCase().includes(searchLower) ||
            cat.description?.toLowerCase().includes(searchLower);
          
          const filteredChildren = cat.children ? filterRecursive(cat.children) : [];
          
          if (matchesSearch || filteredChildren.length > 0) {
            return {
              ...cat,
              children: filteredChildren.length > 0 ? filteredChildren : cat.children,
            };
          }
          return null;
        })
        .filter((cat): cat is Category => cat !== null);
    };

    return filterRecursive(categoriesData);
  }, [categoriesData, searchQuery]);

  const toggleCategory = (id: string) => {
    if (expandedCategories.includes(id)) {
      setExpandedCategories(expandedCategories.filter(c => c !== id));
    } else {
      setExpandedCategories([...expandedCategories, id]);
    }
  };

  const handleAddCategory = (parentId?: string) => {
    setEditingCategoryId(undefined);
    setParentCategoryId(parentId);
    setIsFormOpen(true);
  };

  const handleEditCategory = (categoryId: string) => {
    setEditingCategoryId(categoryId);
    setParentCategoryId(undefined);
    setIsFormOpen(true);
  };

  const handleAddSubcategory = (parentId: string) => {
    setEditingCategoryId(undefined);
    setParentCategoryId(parentId);
    setIsFormOpen(true);
  };

  const handleDeleteCategory = (categoryId: string) => {
    setDeletingCategoryId(categoryId);
  };

  const confirmDelete = () => {
    if (deletingCategoryId) {
      deleteCategoryMutation.mutate(deletingCategoryId);
    }
  };

  // Calculate stats
  const stats = useMemo(() => {
    if (!categoriesData) return { totalCategories: 0, totalSubcategories: 0, totalProducts: 0 };
    
    const countRecursive = (cats: Category[]) => {
      let categories = 0;
      let subcategories = 0;
      let products = 0;
      
      cats.forEach(cat => {
        if (!cat.parentId) {
          categories++;
        } else {
          subcategories++;
        }
        products += cat.productCount || 0;
        if (cat.children) {
          const childStats = countRecursive(cat.children);
          subcategories += childStats.subcategories;
          products += childStats.products;
        }
      });
      
      return { categories, subcategories, products };
    };
    
    return countRecursive(categoriesData);
  }, [categoriesData]);

  // Render category tree recursively
  const renderCategoryTree = (categories: Category[], level = 0) => {
    return categories.map((category) => {
      const hasChildren = category.children && category.children.length > 0;
      const isExpanded = expandedCategories.includes(category.id);
      const isMainCategory = !category.parentId;

      return (
        <div key={category.id} className="border border-border rounded-lg overflow-hidden mb-2">
          {/* Main Category */}
          <div 
            className={`flex items-center justify-between p-4 ${
              isMainCategory ? 'bg-secondary/30' : 'bg-background'
            } hover:bg-secondary/50 cursor-pointer transition-colors`}
            onClick={() => hasChildren && toggleCategory(category.id)}
          >
            <div className="flex items-center gap-3 flex-1">
              {hasChildren && (
                <ChevronRight 
                  className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${
                    isExpanded ? 'rotate-90' : ''
                  }`}
                />
              )}
              {!hasChildren && <div className="w-5" />}
              
              {category.icon && (
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                  style={{ backgroundColor: category.color ? `${category.color}20` : undefined }}
                >
                  {category.icon}
                </div>
              )}
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-foreground">{category.name}</p>
                  {!category.isActive && (
                    <Badge variant="secondary" className="text-xs">Inactive</Badge>
                  )}
                </div>
                {category.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                    {category.description}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-1">
                  {category.productCount !== undefined && (
                    <span className="text-xs text-muted-foreground">
                      {category.productCount} products
                    </span>
                  )}
                  {hasChildren && (
                    <span className="text-xs text-muted-foreground">
                      {category.children?.length} subcategories
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {category.color && (
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-popover">
                  <DropdownMenuItem onClick={() => handleAddSubcategory(category.id)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Subcategory
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleEditCategory(category.id)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Category
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-destructive focus:text-destructive"
                    onClick={() => handleDeleteCategory(category.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Category
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Subcategories */}
          {hasChildren && isExpanded && (
            <div className="border-t border-border animate-fade-in bg-secondary/10">
              {renderCategoryTree(category.children!, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Categories</h1>
          <p className="text-muted-foreground">Manage product categories and subcategories</p>
        </div>
        <Button variant="gradient" onClick={() => handleAddCategory()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <FolderTree className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">{stats.totalCategories}</p>
                )}
                <p className="text-xs text-muted-foreground">Main Categories</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <FolderTree className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">{stats.totalSubcategories}</p>
                )}
                <p className="text-xs text-muted-foreground">Subcategories</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-100">
                <Package className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                {isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">{stats.totalProducts}</p>
                )}
                <p className="text-xs text-muted-foreground">Total Products</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="shadow-card">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search categories..."
              className="pl-10 max-w-md"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Categories Tree */}
      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-semibold">Category Structure</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="border border-border rounded-lg p-4">
                  <Skeleton className="h-6 w-48 mb-2" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="text-center py-8">
              <FolderTree className="h-12 w-12 mx-auto text-destructive mb-4 opacity-50" />
              <p className="text-destructive font-medium mb-2">Failed to load categories</p>
              <p className="text-sm text-muted-foreground mb-4">
                {(error as any)?.response?.data?.error?.message || 
                 (error as any)?.message || 
                 'Server returned an error. Please check the console for details.'}
              </p>
              <Button
                variant="outline"
                onClick={() => queryClient.invalidateQueries({ queryKey: ['categories'] })}
              >
                Retry
              </Button>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="text-center py-8">
              <FolderTree className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchQuery ? 'No categories found matching your search' : 'No categories yet'}
              </p>
              {!searchQuery && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => handleAddCategory()}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Category
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {renderCategoryTree(filteredCategories)}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Form Dialog */}
      <CategoryForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        categoryId={editingCategoryId}
        parentId={parentCategoryId}
        onCategorySaved={() => {
          setIsFormOpen(false);
          setEditingCategoryId(undefined);
          setParentCategoryId(undefined);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingCategoryId} onOpenChange={(open) => !open && setDeletingCategoryId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the category
              {deletingCategoryId && ' and all its subcategories'}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteCategoryMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
