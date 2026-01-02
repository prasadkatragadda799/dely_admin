import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesAPI, uploadAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Upload, X, Image as ImageIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const categoryFormSchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().optional(),
  parentId: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Color must be a valid hex code').optional(),
  displayOrder: z.number().int().min(0, 'Display order must be non-negative').optional(),
  isActive: z.boolean().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
});

type CategoryFormData = z.infer<typeof categoryFormSchema>;

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
  metaTitle?: string;
  metaDescription?: string;
  children?: Category[];
}

interface CategoryFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryId?: string;
  parentId?: string; // For creating subcategories
  onCategorySaved?: (categoryId: string) => void;
}

export function CategoryForm({ 
  open, 
  onOpenChange, 
  categoryId, 
  parentId,
  onCategorySaved 
}: CategoryFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<CategoryFormData>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      isActive: true,
      displayOrder: 0,
      color: '#1E6DD8',
    },
  });

  // Fetch all categories for parent selection
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await categoriesAPI.getCategories();
      return response.data || [];
    },
  });

  // Fetch category data if editing
  const { data: categoryData } = useQuery({
    queryKey: ['category', categoryId],
    queryFn: async () => {
      if (!categoryId) return null;
      // Since we don't have a getCategory endpoint, we'll find it from the list
      const response = await categoriesAPI.getCategories();
      const categories = response.data || [];
      const findCategory = (cats: Category[]): Category | null => {
        for (const cat of cats) {
          if (cat.id === categoryId) return cat;
          if (cat.children) {
            const found = findCategory(cat.children);
            if (found) return found;
          }
        }
        return null;
      };
      return findCategory(categories);
    },
    enabled: !!categoryId && open,
  });

  // Flatten categories for parent dropdown (exclude self and children if editing)
  const flattenCategories = (cats: Category[], excludeId?: string, level = 0): Category[] => {
    const result: Category[] = [];
    const flatten = (items: Category[], depth: number) => {
      items.forEach((cat) => {
        if (cat.id !== excludeId) {
          result.push({ ...cat, name: '  '.repeat(depth) + cat.name });
          if (cat.children && cat.children.length > 0) {
            flatten(cat.children, depth + 1);
          }
        }
      });
    };
    flatten(cats, level);
    return result;
  };

  const allCategories = categoriesData ? flattenCategories(categoriesData, categoryId) : [];

  // Set form values when category data is loaded or dialog opens
  useEffect(() => {
    if (open) {
      if (categoryData && categoryId) {
        // Edit mode
        reset({
          name: categoryData.name || '',
          description: categoryData.description || '',
          parentId: categoryData.parentId || 'none',
          icon: categoryData.icon || '',
          color: categoryData.color || '#1E6DD8',
          displayOrder: categoryData.displayOrder || 0,
          isActive: categoryData.isActive !== false,
          metaTitle: categoryData.metaTitle || '',
          metaDescription: categoryData.metaDescription || '',
        });
        if (categoryData.image) {
          setImagePreview(categoryData.image);
        }
      } else {
        // Create mode
        reset({
          name: '',
          description: '',
          parentId: parentId || 'none',
          icon: '',
          color: '#1E6DD8',
          displayOrder: 0,
          isActive: true,
          metaTitle: '',
          metaDescription: '',
        });
        setImagePreview(null);
        setSelectedImage(null);
      }
    }
  }, [categoryData, categoryId, open, parentId, reset]);

  // Handle image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid file type',
          description: 'Please select an image file',
          variant: 'destructive',
        });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Image size must be less than 5MB',
          variant: 'destructive',
        });
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  // Create/Update category mutation
  const categoryMutation = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      // Clean data
      const cleanData: any = { ...data };
      if (cleanData.parentId === 'none') {
        delete cleanData.parentId;
      }
      if (!cleanData.icon) {
        delete cleanData.icon;
      }
      if (!cleanData.color) {
        delete cleanData.color;
      }
      if (cleanData.displayOrder === undefined || cleanData.displayOrder === null) {
        delete cleanData.displayOrder;
      }

      if (categoryId) {
        // Update category
        return await categoriesAPI.updateCategory(categoryId, cleanData);
      } else {
        // Create category
        return await categoriesAPI.createCategory(cleanData);
      }
    },
    onSuccess: async (response, variables) => {
      const newCategoryId = response.data?.id || categoryId;
      
      // Upload image if selected
      if (selectedImage && newCategoryId) {
        try {
          await uploadAPI.uploadImage(selectedImage, 'category', newCategoryId);
        } catch (error) {
          console.error('Error uploading image:', error);
          toast({
            title: 'Category saved but image upload failed',
            description: 'You can upload the image later',
            variant: 'destructive',
          });
        }
      }

      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({
        title: categoryId ? 'Category updated' : 'Category created',
        description: categoryId
          ? 'Category has been updated successfully'
          : 'Category has been created successfully',
      });
      onOpenChange(false);
      reset();
      setSelectedImage(null);
      setImagePreview(null);
      onCategorySaved?.(newCategoryId);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error?.message || 
          (categoryId ? 'Failed to update category' : 'Failed to create category'),
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: CategoryFormData) => {
    categoryMutation.mutate(data);
  };

  const currentParentId = watch('parentId');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{categoryId ? 'Edit Category' : 'Add New Category'}</DialogTitle>
          <DialogDescription>
            {categoryId 
              ? 'Update the category details below.'
              : 'Fill in the details to create a new category or subcategory.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Category Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Category Name *</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="e.g., Rice & Grains"
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Brief description of the category..."
              rows={3}
            />
          </div>

          {/* Parent Category */}
          <div className="space-y-2">
            <Label htmlFor="parentId">Parent Category</Label>
            <Select
              value={currentParentId || 'none'}
              onValueChange={(value) => setValue('parentId', value === 'none' ? 'none' : value)}
            >
              <SelectTrigger id="parentId">
                <SelectValue placeholder="Select parent category (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None (Main Category)</SelectItem>
                {allCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Leave as "None" to create a main category, or select a parent to create a subcategory
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Icon */}
            <div className="space-y-2">
              <Label htmlFor="icon">Icon (Emoji)</Label>
              <Input
                id="icon"
                {...register('icon')}
                placeholder="🌾"
                maxLength={2}
              />
              <p className="text-xs text-muted-foreground">Single emoji character</p>
            </div>

            {/* Color */}
            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <div className="flex gap-2">
                <Input
                  id="color"
                  type="color"
                  {...register('color')}
                  className="h-10 w-20 p-1 cursor-pointer"
                />
                <Input
                  {...register('color')}
                  placeholder="#1E6DD8"
                  pattern="^#[0-9A-F]{6}$"
                  className={errors.color ? 'border-destructive' : ''}
                />
              </div>
              {errors.color && (
                <p className="text-sm text-destructive">{errors.color.message}</p>
              )}
            </div>
          </div>

          {/* Display Order */}
          <div className="space-y-2">
            <Label htmlFor="displayOrder">Display Order</Label>
            <Input
              id="displayOrder"
              type="number"
              {...register('displayOrder', { valueAsNumber: true })}
              placeholder="0"
              min={0}
            />
            <p className="text-xs text-muted-foreground">
              Lower numbers appear first. Leave as 0 for default ordering.
            </p>
          </div>

          {/* Category Image */}
          <div className="space-y-2">
            <Label>Category Image</Label>
            {imagePreview ? (
              <div className="relative w-full h-48 rounded-lg border border-border overflow-hidden">
                <img
                  src={imagePreview}
                  alt="Category preview"
                  className="w-full h-full object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={removeImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <Label htmlFor="image-upload" className="cursor-pointer">
                  <Button type="button" variant="outline" asChild>
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Image
                    </span>
                  </Button>
                </Label>
                <Input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Recommended: 400x400px, max 5MB
                </p>
              </div>
            )}
          </div>

          {/* SEO Fields */}
          <div className="space-y-4 border-t border-border pt-4">
            <h3 className="text-sm font-semibold">SEO Settings (Optional)</h3>
            
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
                rows={2}
              />
            </div>
          </div>

          {/* Active Status */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isActive"
              checked={watch('isActive')}
              onCheckedChange={(checked) => setValue('isActive', checked as boolean)}
            />
            <Label htmlFor="isActive" className="cursor-pointer">
              Category is active (visible to users)
            </Label>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={categoryMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={categoryMutation.isPending}>
              {categoryMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {categoryId ? 'Update Category' : 'Create Category'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

