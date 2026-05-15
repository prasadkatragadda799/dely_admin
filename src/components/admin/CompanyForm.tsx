import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { companiesAPI, divisionsAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, X, Building2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SearchableSelect } from '@/components/ui/searchable-select';

const companySchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  description: z.string().optional(),
  divisionId: z.string().optional(),
});

type CompanyFormData = z.infer<typeof companySchema>;

interface CompanyFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId?: string;
}

export function CompanyForm({ open, onOpenChange, companyId }: CompanyFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
  });

  // Fetch divisions
  const { data: divisionsData } = useQuery({
    queryKey: ['divisions'],
    queryFn: async () => {
      const response = await divisionsAPI.getDivisions();
      return response.data || [];
    },
    enabled: open,
  });

  // Fetch company data if editing
  const { data: companyData, isLoading: isLoadingCompany } = useQuery({
    queryKey: ['company', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const response = await companiesAPI.getCompany(companyId);
      return response.data;
    },
    enabled: !!companyId && open,
  });

  // Load company data into form when editing
  useEffect(() => {
    if (companyData && open) {
      setValue('name', companyData.name || '');
      setValue('description', companyData.description || '');
      setValue('divisionId', companyData.division?.id || companyData.divisionId || companyData.division_id || '');
      if (companyData.logoUrl || companyData.logo_url || companyData.logo) {
        setImagePreview(companyData.logoUrl || companyData.logo_url || companyData.logo);
      }
    } else if (!companyId && open) {
      reset();
      setSelectedFile(null);
      setImagePreview(null);
    }
  }, [companyData, companyId, open, setValue, reset]);

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

  const divisions = divisionsData || [];
  const divisionOptions = divisions.map((d: any) => ({ value: d.id, label: d.name }));

  // Create/Update company mutation
  const companyMutation = useMutation({
    mutationFn: async (data: CompanyFormData) => {
      const formData = new FormData();

      formData.append('name', data.name.trim());

      if (data.description && data.description.trim()) {
        formData.append('description', data.description.trim());
      }

      if (data.divisionId && data.divisionId !== '') {
        formData.append('division_id', data.divisionId);
      }

      if (selectedFile) {
        formData.append('logo', selectedFile);
      }

      if (companyId) {
        return await companiesAPI.updateCompany(companyId, formData);
      } else {
        return await companiesAPI.createCompany(formData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast({
        title: companyId ? 'Company updated' : 'Company created',
        description: companyId
          ? 'Company has been updated successfully'
          : 'Company has been created successfully',
      });
      onOpenChange(false);
      reset();
      setSelectedFile(null);
      setImagePreview(null);
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.error?.message
        || error.response?.data?.message
        || 'Failed to save company';
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: CompanyFormData) => {
    companyMutation.mutate(data);
  };

  if (isLoadingCompany && companyId) {
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
          <DialogTitle>{companyId ? 'Edit Company' : 'Add Company'}</DialogTitle>
          <DialogDescription>
            {companyId ? 'Update company information' : 'Create a new company in the system'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>

            <div className="space-y-2">
              <Label htmlFor="name">Company Name *</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="Enter company name"
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            {/* Division */}
            <div className="space-y-2">
              <Label>Division</Label>
              <SearchableSelect
                options={divisionOptions}
                value={watch('divisionId') || ''}
                onValueChange={(v) => setValue('divisionId', v)}
                placeholder="Select division (FMCG / Home & Kitchen)"
                searchPlaceholder="Search division..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Enter company description"
                rows={4}
              />
            </div>
          </div>

          {/* Logo Upload */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Company Logo</h3>

            <div className="space-y-4">
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Company logo preview"
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
                  <Building2 className="h-12 w-12 text-muted-foreground" />
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
              disabled={companyMutation.isPending}
            >
              {companyMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {companyId ? 'Update Company' : 'Create Company'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
