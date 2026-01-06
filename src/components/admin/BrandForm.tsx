import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { brandsAPI, companiesAPI, categoriesAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Loader2, Upload, X, Tag } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const brandSchema = z.object({
  name: z.string().min(1, 'Brand name is required'),
  companyId: z.string().optional(),
  categoryId: z.string().optional(),
});

type BrandFormData = z.infer<typeof brandSchema>;

interface BrandFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brandId?: string;
}

export function BrandForm({ open, onOpenChange, brandId }: BrandFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<BrandFormData>({
    resolver: zodResolver(brandSchema),
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

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await categoriesAPI.getCategories();
      return response.data || [];
    },
    enabled: open,
  });

  // Fetch brand data if editing
  const { data: brandData, isLoading: isLoadingBrand } = useQuery({
    queryKey: ['brand', brandId],
    queryFn: async () => {
      if (!brandId) return null;
      const response = await brandsAPI.getBrand(brandId);
      return response.data;
    },
    enabled: !!brandId && open,
  });

  // Load brand data into form when editing
  useEffect(() => {
    if (brandData && open) {
      setValue('name', brandData.name || '');
      setValue('companyId', brandData.company?.id || brandData.companyId || '');
      setValue('categoryId', brandData.category?.id || brandData.categoryId || '');
      setSelectedCompany(brandData.company?.id || brandData.companyId || '');
      if (brandData.logoUrl || brandData.logo_url || brandData.logo) {
        setImagePreview(brandData.logoUrl || brandData.logo_url || brandData.logo);
      }
    } else if (!brandId && open) {
      reset();
      setSelectedFile(null);
      setImagePreview(null);
      setSelectedCompany('');
    }
  }, [brandData, brandId, open, setValue, reset]);

  // Handle company change
  const handleCompanyChange = (value: string) => {
    setSelectedCompany(value);
    setValue('companyId', value === 'none' ? '' : value);
    // Reset brand selection when company changes
    setValue('categoryId', '');
  };

  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedFile(null);
    setImagePreview(null);
  };

  // Flatten categories for dropdown
  const flattenCategories = (cats: any[]): any[] => {
    const result: any[] = [];
    cats.forEach((cat) => {
      result.push(cat);
      if (cat.children && cat.children.length > 0) {
        result.push(...flattenCategories(cat.children));
      }
    });
    return result;
  };

  const categories = categoriesData ? flattenCategories(categoriesData) : [];
  const companies = companiesData || [];

  // Create/Update brand mutation
  const brandMutation = useMutation({
    mutationFn: async (data: BrandFormData) => {
      const formData = new FormData();
      formData.append('name', data.name);
      if (data.companyId && data.companyId !== 'none' && data.companyId !== '') {
        formData.append('companyId', data.companyId);
      }
      if (data.categoryId && data.categoryId !== 'none' && data.categoryId !== '') {
        formData.append('categoryId', data.categoryId);
      }
      if (selectedFile) {
        formData.append('logo', selectedFile);
      }

      if (brandId) {
        return await brandsAPI.updateBrand(brandId, formData);
      } else {
        return await brandsAPI.createBrand(formData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast({
        title: brandId ? 'Brand updated' : 'Brand created',
        description: brandId
          ? 'Brand has been updated successfully'
          : 'Brand has been created successfully',
      });
      onOpenChange(false);
      reset();
      setSelectedFile(null);
      setImagePreview(null);
      setSelectedCompany('');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error?.message 
        || error.response?.data?.message 
        || 'Failed to save brand';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: BrandFormData) => {
    brandMutation.mutate(data);
  };

  if (isLoadingBrand && brandId) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{brandId ? 'Edit Brand' : 'Add Brand'}</DialogTitle>
          <DialogDescription>
            {brandId ? 'Update brand information' : 'Create a new brand and assign it to a company'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="name">Brand Name *</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="Enter brand name"
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyId">Company</Label>
                <Select
                  value={watch('companyId') || 'none'}
                  onValueChange={handleCompanyChange}
                >
                  <SelectTrigger id="companyId">
                    <SelectValue placeholder="Select company (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {companies.map((company: any) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="categoryId">Category</Label>
                <Select
                  value={watch('categoryId') || 'none'}
                  onValueChange={(value) => setValue('categoryId', value === 'none' ? '' : value)}
                >
                  <SelectTrigger id="categoryId">
                    <SelectValue placeholder="Select category (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {categories.map((category: any) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Logo Upload */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Brand Logo</h3>
            
            <div className="space-y-4">
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Brand logo preview"
                    className="h-32 w-32 rounded-lg object-cover border-2 border-border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                    onClick={removeImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="h-32 w-32 rounded-lg bg-secondary border-2 border-dashed border-border flex items-center justify-center">
                  <Tag className="h-12 w-12 text-muted-foreground" />
                </div>
              )}

              <div className="flex items-center gap-4">
                <Input
                  ref={fileInputRef}
                  type="file"
                  id="logo"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {imagePreview ? 'Change Logo' : 'Upload Logo'}
                </Button>
                {imagePreview && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={removeImage}
                  >
                    Remove
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Recommended: Square image, at least 200x200px. Max size: 10MB
              </p>
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
              disabled={brandMutation.isPending}
            >
              {brandMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {brandId ? 'Update Brand' : 'Create Brand'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

