import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { categoriesAPI, companiesAPI, brandsAPI, productsAPI, sellerProductsAPI, uploadAPI } from '@/lib/api';
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
import { useAuth } from '@/contexts/AuthContext';
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

const variantSchema = z.object({
  hsnCode: z.string().optional(),
  setPieces: z.string().optional(),
  weight: z.string().optional(),
  mrp: z.number().min(0, 'MRP is required for each variant'),
  specialPrice: z.number().min(0, 'Special price is required for each variant'),
  freeItem: z.string().optional(),
});

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  categoryId: z.string().min(1, 'Category is required'),
  companyId: z.string().optional(),
  brandId: z.string().optional(),
  hsnCode: z.string().optional(),
  mrp: z.number().min(0, 'MRP must be greater than 0'),
  sellingPrice: z.number().min(0, 'Selling price must be greater than 0'),
  stockQuantity: z.number().int().min(0, 'Stock quantity must be 0 or greater'),
  minOrderQuantity: z.number().int().min(1, 'Minimum order quantity must be at least 1'),
  unit: z.string().min(1, 'Unit is required'),
  piecesPerSet: z.number().int().min(1).optional(),
  expiryDate: z.string().optional(),
  isFeatured: z.boolean().optional(),
  isAvailable: z.boolean().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  // Multiple size / pack variants like in Excel sheet
  variants: z
    .array(variantSchema)
    .min(1, 'At least one variant is required')
    .optional(),
}).refine((data) => data.sellingPrice <= data.mrp, {
  message: 'Selling price must be less than or equal to MRP',
  path: ['sellingPrice'],
});

type ProductFormData = z.infer<typeof productSchema>;

export function ProductForm({ open, onOpenChange, productId }: ProductFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isSeller = user?.role === 'seller';
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
    control,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      minOrderQuantity: 1,
      piecesPerSet: 1,
      isFeatured: false,
      isAvailable: true,
      unit: 'piece',
      variants: [
        {
          hsnCode: '',
          setPieces: '',
          weight: '',
          mrp: 0,
          specialPrice: 0,
          freeItem: '',
        },
      ],
    },
  });

  const {
    fields: variantFields,
    append: appendVariant,
    remove: removeVariant,
  } = useFieldArray({
    control,
    name: 'variants',
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
    enabled: open && !isSeller,
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
      const response = isSeller
        ? await sellerProductsAPI.getProduct(productId)
        : await productsAPI.getProduct(productId);
      return response.data;
    },
    enabled: !!productId && open,
  });

  // If seller, lock companyId to assigned company
  useEffect(() => {
    if (!open) return;
    if (!isSeller) return;
    const assignedCompanyId = user?.companyId || '';
    if (!assignedCompanyId) return;
    setSelectedCompany(assignedCompanyId);
    setValue('companyId', assignedCompanyId);
  }, [open, isSeller, user?.companyId, setValue]);

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
        variants: productData.variants && Array.isArray(productData.variants)
          ? productData.variants.map((v: any) => ({
              hsnCode: v.hsnCode || v.hsn_code || '',
              setPieces: v.setPieces?.toString() || v.set_pcs?.toString() || '',
              weight: v.weight || '',
              mrp: Number(v.mrp || 0),
              specialPrice: Number(v.specialPrice || v.special_price || 0),
              freeItem: v.freeItem || v.free_item || '',
            }))
          : [
              {
                hsnCode: '',
                setPieces: '',
                weight: '',
                mrp: Number(productData.mrp || 0),
                specialPrice: Number(productData.sellingPrice || 0),
                freeItem: '',
              },
            ],
        hsnCode: productData.hsnCode || productData.hsn_code || '',
        expiryDate: productData.expiryDate || productData.expiry_date || '',
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
      const formData = new FormData();
      
      // Add basic fields
      formData.append('name', data.name);
      if (data.description) {
        formData.append('description', data.description);
      }
      
      // Add category (required)
      if (data.categoryId && data.categoryId !== 'none') {
        formData.append('categoryId', data.categoryId);
      }
      
      // Add company (optional) - backend expects 'company_id'
      if (data.companyId && data.companyId !== 'none' && data.companyId !== '') {
        formData.append('company_id', data.companyId);
      }
      
      // Add brand (optional) - backend expects 'brand_id'
      if (data.brandId && data.brandId !== 'none' && data.brandId !== '') {
        formData.append('brand_id', data.brandId);
      }
      
      // Add base pricing (can represent default / primary variant)
      formData.append('mrp', data.mrp.toString());
      formData.append('sellingPrice', data.sellingPrice.toString());
      
      // Add stock and order quantities (overall stock for all variants)
      formData.append('stockQuantity', (data.stockQuantity || 0).toString());
      formData.append('minOrderQuantity', (data.minOrderQuantity || 1).toString());
      
      // Add unit (generic unit, individual variant weights go in variants array)
      formData.append('unit', data.unit);
      
      // Add pieces per set if provided
      if (data.piecesPerSet) {
        formData.append('piecesPerSet', data.piecesPerSet.toString());
      }
      
      // Add boolean fields (convert to string)
      formData.append('isFeatured', (data.isFeatured || false).toString());
      formData.append('isAvailable', (data.isAvailable !== false).toString());
      
      // Add HSN code if provided
      if (data.hsnCode) {
        formData.append('hsnCode', data.hsnCode);
      }

      // Add expiry date if provided
      if (data.expiryDate) {
        formData.append('expiryDate', data.expiryDate);
      }
      
      // Add SEO fields if provided
      if (data.metaTitle) {
        formData.append('meta_title', data.metaTitle);
      }
      if (data.metaDescription) {
        formData.append('meta_description', data.metaDescription);
      }
      
      // Add images to the same FormData (as per backend guide)
      if (selectedFiles.length > 0) {
        selectedFiles.forEach((image) => {
          formData.append('images', image);
        });
        // Set primary image index (first image is primary)
        formData.append('primaryIndex', '0');
      }

      // Add variants as JSON so backend can create separate rows per variant
      if (data.variants && data.variants.length > 0) {
        const cleanedVariants = data.variants.map((v) => ({
          hsnCode: v.hsnCode || '',
          setPieces: v.setPieces || '',
          weight: v.weight || '',
          mrp: Number.isFinite(v.mrp) ? v.mrp : 0,
          specialPrice: Number.isFinite(v.specialPrice) ? v.specialPrice : 0,
          freeItem: v.freeItem || '',
        }));
        formData.append('variants', JSON.stringify(cleanedVariants));
      }

      if (productId) {
        // Update product
        return await (isSeller
          ? sellerProductsAPI.updateProduct(productId, formData)
          : productsAPI.updateProduct(productId, formData));
      } else {
        // Create product
        return await (isSeller
          ? sellerProductsAPI.createProduct(formData)
          : productsAPI.createProduct(formData));
      }
    },
    onSuccess: async (response, variables) => {
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
      const errorMessage = error.response?.data?.error?.message 
        || error.response?.data?.message 
        || 'Failed to save product';
      toast({
        title: 'Error',
        description: errorMessage,
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
                  disabled={isSeller}
                >
                  <SelectTrigger id="companyId">
                    <SelectValue placeholder={isSeller ? 'Assigned company' : 'Select company (optional)'} />
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
                {isSeller && !user?.companyId && (
                  <p className="text-sm text-destructive">Seller account is missing company assignment.</p>
                )}
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

            <div className="space-y-2">
              <Label htmlFor="hsnCode">HSN Code</Label>
              <Input
                id="hsnCode"
                {...register('hsnCode')}
                placeholder="Enter HSN code (e.g., 07139090)"
              />
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
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  {...register('expiryDate')}
                />
                {watch('expiryDate') && (() => {
                  const expiry = new Date(watch('expiryDate'));
                  const today = new Date();
                  const twoMonthsFromNow = new Date();
                  twoMonthsFromNow.setMonth(today.getMonth() + 2);
                  const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                  
                  if (daysUntilExpiry < 0) {
                    return <p className="text-sm text-red-600">⚠️ Product has expired</p>;
                  } else if (daysUntilExpiry <= 60) {
                    return <p className="text-sm text-amber-600">⚠️ Expires in {daysUntilExpiry} days (less than 2 months)</p>;
                  }
                  return null;
                })()}
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

