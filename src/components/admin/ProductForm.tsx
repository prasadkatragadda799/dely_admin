import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { categoriesAPI, companiesAPI, brandsAPI, productsAPI, uploadAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, X, Image as ImageIcon } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Category {
  id: string;
  name: string;
  slug: string;
  children?: Category[];
}

interface Company {
  id: string;
  name: string;
}

interface Brand {
  id: string;
  name: string;
  companyId?: string;
}

interface ProductFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId?: string; // If provided, we're editing
}

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  categoryId: z.string().min(1, 'Category is required'),
  companyId: z.string().optional(),
  brandId: z.string().optional(),
  mrp: z.number().min(0, 'MRP must be greater than 0'),
  sellingPrice: z.number().min(0, 'Selling price must be greater than 0'),
  stockQuantity: z.number().int().min(0, 'Stock quantity must be 0 or greater'),
  minOrderQuantity: z.number().int().min(1, 'Minimum order quantity must be at least 1'),
  unit: z.string().min(1, 'Unit is required'),
  piecesPerSet: z.number().int().min(1).optional(),
  isFeatured: z.boolean().optional(),
  isAvailable: z.boolean().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
}).refine((data) => data.sellingPrice <= data.mrp, {
  message: 'Selling price must be less than or equal to MRP',
  path: ['sellingPrice'],
});

type ProductFormData = z.infer<typeof productSchema>;

export function ProductForm({ open, onOpenChange, productId }: ProductFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      minOrderQuantity: 1,
      piecesPerSet: 1,
      isFeatured: false,
      isAvailable: true,
      unit: 'piece',
    },
  });

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await categoriesAPI.getCategories();
      return response.data || [];
    },
    enabled: open,
  });

  // Fetch companies
  const { data: companiesData } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const response = await companiesAPI.getCompanies();
      return response.data || [];
    },
    enabled: open,
  });

  // Fetch brands (filtered by company if selected)
  const { data: brandsData } = useQuery({
    queryKey: ['brands', selectedCompany],
    queryFn: async () => {
      const response = await brandsAPI.getBrands(
        selectedCompany ? { companyId: selectedCompany } : undefined
      );
      return response.data || [];
    },
    enabled: open,
  });

  // Fetch product data if editing
  const { data: productData } = useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      if (!productId) return null;
      const response = await productsAPI.getProduct(productId);
      return response.data;
    },
    enabled: !!productId && open,
  });

  // Flatten categories for dropdown
  const flattenCategories = (cats: Category[]): Category[] => {
    const result: Category[] = [];
    const flatten = (items: Category[], level = 0) => {
      items.forEach((cat) => {
        result.push({ ...cat, name: '  '.repeat(level) + cat.name });
        if (cat.children && cat.children.length > 0) {
          flatten(cat.children, level + 1);
        }
      });
    };
    flatten(cats);
    return result;
  };

  const categories = categoriesData ? flattenCategories(categoriesData) : [];
  const companies = (companiesData || []) as Company[];
  const brands = (brandsData || []) as Brand[];

  // Load product data when editing
  useEffect(() => {
    if (productData && open) {
      reset({
        name: productData.name || '',
        description: productData.description || '',
        categoryId: productData.category?.id || '',
        companyId: productData.company?.id || 'none',
        brandId: productData.brand?.id || 'none',
        mrp: productData.mrp || 0,
        sellingPrice: productData.sellingPrice || 0,
        stockQuantity: productData.stockQuantity || 0,
        minOrderQuantity: productData.minOrderQuantity || 1,
        unit: productData.unit || 'piece',
        piecesPerSet: productData.piecesPerSet || 1,
        isFeatured: productData.isFeatured || false,
        isAvailable: productData.isAvailable !== false,
        metaTitle: productData.metaTitle || '',
        metaDescription: productData.metaDescription || '',
      });
      setSelectedCompany(productData.company?.id || '');
      if (productData.images) {
        setImagePreviews(productData.images.map((img: any) => img.url));
      }
    } else if (!productId && open) {
      reset({
        minOrderQuantity: 1,
        piecesPerSet: 1,
        isFeatured: false,
        isAvailable: true,
        unit: 'piece',
      });
      setSelectedFiles([]);
      setImagePreviews([]);
      setSelectedCompany('');
    }
  }, [productData, productId, open, reset]);

  // Handle company change to filter brands
  const handleCompanyChange = (companyId: string) => {
    const actualCompanyId = companyId === 'none' ? '' : companyId;
    setSelectedCompany(actualCompanyId);
    setValue('companyId', actualCompanyId);
    setValue('brandId', 'none'); // Reset brand when company changes
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter((file) => {
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid file type',
          description: 'Please select image files only',
          variant: 'destructive',
        });
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Image size must be less than 5MB',
          variant: 'destructive',
        });
        return false;
      }
      return true;
    });

    setSelectedFiles((prev) => [...prev, ...validFiles]);

    // Create previews
    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Create/Update product mutation
  const productMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      // Clean data - remove empty strings and 'none' values
      const cleanData = { ...data };
      if (cleanData.companyId === '' || cleanData.companyId === 'none') {
        delete cleanData.companyId;
      }
      if (cleanData.brandId === '' || cleanData.brandId === 'none') {
        delete cleanData.brandId;
      }

      if (productId) {
        // Update product
        const formData = new FormData();
        Object.entries(cleanData).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            formData.append(key, value.toString());
          }
        });
        return await productsAPI.updateProduct(productId, formData);
      } else {
        // Create product
        const formData = new FormData();
        Object.entries(cleanData).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            formData.append(key, value.toString());
          }
        });
        return await productsAPI.createProduct(formData);
      }
    },
    onSuccess: async (response, variables) => {
      const productId = response.data?.id;
      
      // Upload images if any
      if (selectedFiles.length > 0 && productId) {
        try {
          await productsAPI.uploadImages(productId, selectedFiles);
        } catch (error) {
          console.error('Error uploading images:', error);
          toast({
            title: 'Product created but image upload failed',
            description: 'You can upload images later',
            variant: 'destructive',
          });
        }
      }

      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: productId ? 'Product updated' : 'Product created',
        description: productId
          ? 'Product has been updated successfully'
          : 'Product has been created successfully',
      });
      onOpenChange(false);
      reset();
      setSelectedFiles([]);
      setImagePreviews([]);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error?.message || 'Failed to save product',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: ProductFormData) => {
    productMutation.mutate(data);
  };

  const discount = watch('mrp') && watch('sellingPrice')
    ? ((watch('mrp') - watch('sellingPrice')) / watch('mrp')) * 100
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{productId ? 'Edit Product' : 'Create New Product'}</DialogTitle>
          <DialogDescription>
            {productId
              ? 'Update product information and settings'
              : 'Add a new product to your catalog. All fields marked with * are required.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="name">
                Product Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="Enter product name"
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Enter product description"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoryId">
                Category <span className="text-destructive">*</span>
              </Label>
              <Select
                value={watch('categoryId') || ''}
                onValueChange={(value) => setValue('categoryId', value)}
              >
                <SelectTrigger id="categoryId">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.categoryId && (
                <p className="text-sm text-destructive">{errors.categoryId.message}</p>
              )}
            </div>
          </div>

          {/* Company & Brand */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Company & Brand</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyId">Company</Label>
                <Select
                  value={watch('companyId') || 'none'}
                  onValueChange={(value) => handleCompanyChange(value === 'none' ? '' : value)}
                >
                  <SelectTrigger id="companyId">
                    <SelectValue placeholder="Select company (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="brandId">Brand</Label>
                <Select
                  value={watch('brandId') || 'none'}
                  onValueChange={(value) => setValue('brandId', value === 'none' ? '' : value)}
                  disabled={!selectedCompany}
                >
                  <SelectTrigger id="brandId">
                    <SelectValue placeholder={selectedCompany ? 'Select brand' : 'Select company first'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {brands.map((brand) => (
                      <SelectItem key={brand.id} value={brand.id}>
                        {brand.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Pricing</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mrp">
                  MRP (₹) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="mrp"
                  type="number"
                  step="0.01"
                  {...register('mrp', { valueAsNumber: true })}
                  placeholder="0.00"
                />
                {errors.mrp && (
                  <p className="text-sm text-destructive">{errors.mrp.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="sellingPrice">
                  Selling Price (₹) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="sellingPrice"
                  type="number"
                  step="0.01"
                  {...register('sellingPrice', { valueAsNumber: true })}
                  placeholder="0.00"
                />
                {errors.sellingPrice && (
                  <p className="text-sm text-destructive">{errors.sellingPrice.message}</p>
                )}
                {discount > 0 && (
                  <p className="text-sm text-emerald-600">
                    Discount: {discount.toFixed(1)}%
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Stock & Inventory */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Stock & Inventory</h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stockQuantity">
                  Stock Quantity <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="stockQuantity"
                  type="number"
                  {...register('stockQuantity', { valueAsNumber: true })}
                  placeholder="0"
                />
                {errors.stockQuantity && (
                  <p className="text-sm text-destructive">{errors.stockQuantity.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="minOrderQuantity">
                  Min Order Qty <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="minOrderQuantity"
                  type="number"
                  {...register('minOrderQuantity', { valueAsNumber: true })}
                  placeholder="1"
                />
                {errors.minOrderQuantity && (
                  <p className="text-sm text-destructive">{errors.minOrderQuantity.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit">
                  Unit <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={watch('unit') || 'piece'}
                  onValueChange={(value) => setValue('unit', value)}
                >
                  <SelectTrigger id="unit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="piece">Piece</SelectItem>
                    <SelectItem value="kg">Kilogram (kg)</SelectItem>
                    <SelectItem value="gram">Gram (g)</SelectItem>
                    <SelectItem value="liter">Liter (L)</SelectItem>
                    <SelectItem value="pack">Pack</SelectItem>
                    <SelectItem value="box">Box</SelectItem>
                    <SelectItem value="bottle">Bottle</SelectItem>
                  </SelectContent>
                </Select>
                {errors.unit && (
                  <p className="text-sm text-destructive">{errors.unit.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="piecesPerSet">Pieces per Set</Label>
              <Input
                id="piecesPerSet"
                type="number"
                {...register('piecesPerSet', { valueAsNumber: true })}
                placeholder="1"
              />
            </div>
          </div>

          {/* Images */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Product Images</h3>
            
            <div className="space-y-2">
              <Label>Upload Images (Max 5, 5MB each)</Label>
              <div className="flex items-center gap-4">
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="cursor-pointer"
                  disabled={selectedFiles.length >= 5}
                />
              </div>
              {selectedFiles.length >= 5 && (
                <p className="text-sm text-muted-foreground">
                  Maximum 5 images allowed
                </p>
              )}
            </div>

            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-4 gap-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    {index === 0 && (
                      <div className="absolute bottom-0 left-0 right-0 bg-primary text-primary-foreground text-xs text-center py-1">
                        Primary
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Settings</h3>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="isFeatured">Featured Product</Label>
                <p className="text-xs text-muted-foreground">
                  Show this product in featured section
                </p>
              </div>
              <Switch
                id="isFeatured"
                checked={watch('isFeatured') || false}
                onCheckedChange={(checked) => setValue('isFeatured', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="isAvailable">Available</Label>
                <p className="text-xs text-muted-foreground">
                  Product will be visible to customers
                </p>
              </div>
              <Switch
                id="isAvailable"
                checked={watch('isAvailable') !== false}
                onCheckedChange={(checked) => setValue('isAvailable', checked)}
              />
            </div>
          </div>

          {/* SEO */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">SEO Settings</h3>
            
            <div className="space-y-2">
              <Label htmlFor="metaTitle">Meta Title</Label>
              <Input
                id="metaTitle"
                {...register('metaTitle')}
                placeholder="SEO title for search engines"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="metaDescription">Meta Description</Label>
              <Textarea
                id="metaDescription"
                {...register('metaDescription')}
                placeholder="SEO description for search engines"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="gradient"
              disabled={productMutation.isPending}
            >
              {productMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {productId ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                productId ? 'Update Product' : 'Create Product'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

