import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { divisionsAPI, type Division } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';

const divisionSchema = z.object({
  name: z.string().min(1, 'Division name is required').max(80, 'Name must be less than 80 characters'),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(80, 'Slug must be less than 80 characters')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers, and hyphens only'),
  description: z.string().optional(),
  icon: z.string().optional(),
  imageUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  displayOrder: z.number().int().min(0, 'Display order must be non-negative').optional(),
  isActive: z.boolean().optional(),
});

type DivisionFormData = z.infer<typeof divisionSchema>;

interface DivisionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  divisionId?: string;
}

export function DivisionForm({ open, onOpenChange, divisionId }: DivisionFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: divisionData } = useQuery({
    queryKey: ['division', divisionId],
    queryFn: async () => {
      if (!divisionId) return null;
      const res = await divisionsAPI.getDivision(divisionId);
      return res.data as Division;
    },
    enabled: !!divisionId && open,
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DivisionFormData>({
    resolver: zodResolver(divisionSchema),
    defaultValues: {
      isActive: true,
      displayOrder: 0,
      imageUrl: '',
    },
  });

  useEffect(() => {
    if (!open) return;
    if (divisionData && divisionId) {
      reset({
        name: divisionData.name ?? '',
        slug: divisionData.slug ?? '',
        description: divisionData.description ?? '',
        icon: divisionData.icon ?? '',
        imageUrl: divisionData.imageUrl ?? '',
        displayOrder: divisionData.displayOrder ?? 0,
        isActive: divisionData.isActive !== false,
      });
    } else {
      reset({
        name: '',
        slug: '',
        description: '',
        icon: '',
        imageUrl: '',
        displayOrder: 0,
        isActive: true,
      });
    }
  }, [open, divisionData, divisionId, reset]);

  const mutation = useMutation({
    mutationFn: async (data: DivisionFormData) => {
      const payload: Partial<Division> = {
        ...data,
        imageUrl: data.imageUrl?.trim() ? data.imageUrl.trim() : undefined,
      };
      if (divisionId) return divisionsAPI.updateDivision(divisionId, payload);
      return divisionsAPI.createDivision(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['divisions'] });
      toast({
        title: divisionId ? 'Division updated' : 'Division created',
        description: divisionId ? 'Division has been updated successfully' : 'Division has been created successfully',
      });
      onOpenChange(false);
      reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error?.message || (divisionId ? 'Failed to update division' : 'Failed to create division'),
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: DivisionFormData) => mutation.mutate(data);

  const isActive = watch('isActive');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{divisionId ? 'Edit Division' : 'Create Division'}</DialogTitle>
          <DialogDescription>
            Divisions are Instamart-style verticals (e.g., Grocery and Kitchen). They control app tabs and cart separation.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" {...register('name')} placeholder="Kitchen" className={errors.name ? 'border-destructive' : ''} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input id="slug" {...register('slug')} placeholder="kitchen" className={errors.slug ? 'border-destructive' : ''} />
              {errors.slug && <p className="text-sm text-destructive">{errors.slug.message}</p>}
              <p className="text-xs text-muted-foreground">Used by the mobile app query param \(division_slug\).</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" {...register('description')} placeholder="Cookware, storage, utensils, appliances…" rows={3} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="icon">Icon (Emoji)</Label>
              <Input id="icon" {...register('icon')} placeholder="🍳" maxLength={2} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="displayOrder">Display Order</Label>
              <Input id="displayOrder" type="number" min={0} {...register('displayOrder', { valueAsNumber: true })} placeholder="0" />
              {errors.displayOrder && <p className="text-sm text-destructive">{errors.displayOrder.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="isActive">Active</Label>
              <div className="flex items-center gap-3 rounded-lg border border-border px-3 py-2 bg-secondary/20">
                <Switch
                  id="isActive"
                  checked={!!isActive}
                  onCheckedChange={(checked) => setValue('isActive', checked)}
                />
                <span className="text-sm">{isActive ? 'Visible in app tabs' : 'Hidden from app tabs'}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="imageUrl">Image URL (Optional)</Label>
            <Input id="imageUrl" {...register('imageUrl')} placeholder="https://…/kitchen.png" className={errors.imageUrl ? 'border-destructive' : ''} />
            {errors.imageUrl && <p className="text-sm text-destructive">{errors.imageUrl.message}</p>}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" variant="gradient" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {divisionId ? 'Update Division' : 'Create Division'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

