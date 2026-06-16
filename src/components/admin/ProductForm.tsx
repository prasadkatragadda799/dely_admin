import { useState, useEffect, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  categoriesAPI,
  companiesAPI,
  brandsAPI,
  divisionsAPI,
  zonesAPI,
  productsAPI,
  sellerProductsAPI,
  sellerResourcesAPI,
  uploadAPI,
  type Division,
} from '@/lib/api';
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

/** Matches backend VALID_PACKAGING_LABEL_TYPES */
const PACKAGING_LABEL_TYPE_OPTIONS = [
  { value: '', label: 'Not selected' },
  { value: 'set', label: 'Set' },
  { value: 'pieces', label: 'Pieces' },
  { value: 'pack', label: 'Pack' },
  { value: 'unit', label: 'Unit' },
  { value: 'pair', label: 'Pair' },
  { value: 'dozen', label: 'Dozen' },
] as const;

const PACKAGING_SELECT_SENTINEL = '__none__';

const normalizePiecesPerSetForUnit = (unit?: string, piecesPerSet?: number) => {
  const normalizedUnit = String(unit || 'piece').trim().toLowerCase();
  if (normalizedUnit === 'piece') {
    return 1;
  }
  const parsed = Number(piecesPerSet ?? 1);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1;
};

const variantSchema = z.object({
  id: z.string().optional(), // backend variant id (round-tripped so updates upsert instead of recreate)
  hsnCode: z.string().optional(),
  packagingLabelType: z.string().optional(),
  setPieces: z.string().optional(),
  weight: z.string().optional(),
  mrp: z.number().min(0, 'MRP is required for each variant'),
  specialPrice: z.number().min(0, 'Special price is required for each variant'),
  freeItem: z.string().optional(),
  minOrderQuantity: z.number().int().min(1).optional(),
});


const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  categoryId: z.string().min(1, 'Category is required'),
  divisionId: z.string().optional(),
  zoneId: z.string().optional(),
  companyId: z.string().min(1, 'Company is required'),
  brandId: z.string().optional(),
  hsnCode: z.string().optional(),
  mrp: z.number().min(0).optional(),
  sellingPrice: z.number().min(0).optional(),
  commissionCost: z.number().min(0).default(0).optional(),
  stockQuantity: z.number().int().min(0, 'Stock quantity must be 0 or greater'),
  minOrderQuantity: z.number().int().min(1, 'Minimum order quantity must be at least 1'),
  unit: z.string().min(1, 'Unit is required'),
  piecesPerSet: z.number().int().min(1).optional(),
  expiryDate: z.string().optional(),
  isFeatured: z.boolean().optional(),
  isAvailable: z.boolean().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  manufacturerName: z.string().optional(),
  manufacturerAddress: z.string().optional(),
  cancelPolicy: z.string().optional(),
  returnPolicy: z.string().optional(),
  // Multiple size / pack variants like in Excel sheet
  variants: z
    .array(variantSchema)
    .min(1, 'At least one variant is required')
    .optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

/** Remote gallery row (server) or newly picked file — used to sync removals on PUT via keepImageIds. */
type ProductImageSlot =
  | { kind: 'remote'; id: string; url: string }
  | { kind: 'local'; file: File; preview: string };

/** Per-variant gallery slot. Remote slots carry the owning variant id so removals can be synced. */
type VariantImageSlot =
  | { kind: 'remote'; id: string; url: string; variantId: string }
  | { kind: 'local'; file: File; preview: string };

function revokeLocalPreviews(slots: Array<ProductImageSlot | VariantImageSlot>) {
  slots.forEach((s) => {
    if (s.kind === 'local' && s.preview.startsWith('blob:')) {
      URL.revokeObjectURL(s.preview);
    }
  });
}

function revokeAllVariantPreviews(map: Record<string, VariantImageSlot[]>) {
  Object.values(map).forEach((slots) => revokeLocalPreviews(slots));
}

export function ProductForm({ open, onOpenChange, productId }: ProductFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isSeller = user?.role === 'seller';
  const [imageSlots, setImageSlots] = useState<ProductImageSlot[]>([]);
  // Per-variant image galleries, keyed by the useFieldArray row id (field.id).
  const [variantImageSlots, setVariantImageSlots] = useState<Record<string, VariantImageSlot[]>>({});
  // Remote variant images the user removed while editing → deleted on save.
  const [removedVariantImages, setRemovedVariantImages] = useState<Array<{ variantId: string; imageId: string }>>([]);
  // Server variant images keyed by backend variant id, captured at load (used to seed slots once fields exist).
  const serverVariantImagesRef = useRef<Record<string, VariantImageSlot[]>>({});
  // Tracks which product's variant images we've already seeded into state.
  const variantImagesInitKeyRef = useRef<string | null>(null);
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
      mrp: 0,
      sellingPrice: 0,
      minOrderQuantity: 1,
      piecesPerSet: 1,
      commissionCost: 0,
      isFeatured: false,
      isAvailable: true,
      unit: 'piece',
      divisionId: 'default',
      variants: [
        {
          hsnCode: '',
          packagingLabelType: '',
          setPieces: '',
          weight: '',
          mrp: 0,
          specialPrice: 0,
          freeItem: '',
          minOrderQuantity: 1,
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
    // Use a non-'id' key so RHF's row key doesn't clobber our variant `id` field.
    keyName: 'rowKey',
  });

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = isSeller
        ? await sellerResourcesAPI.getCategories()
        : await categoriesAPI.getCategories();
      return response.data || [];
    },
    enabled: open,
  });

  const { data: divisionsData } = useQuery({
    queryKey: ['divisions'],
    queryFn: async () => {
      const response = await divisionsAPI.getDivisions();
      return (response.data || []) as Division[];
    },
    // Sellers can now read divisions via /admin/divisions
    enabled: open,
  });

  // Fetch zones (for product-level zone assignment)
  const { data: zonesData } = useQuery({
    queryKey: ['zones'],
    queryFn: async () => {
      const response = await zonesAPI.getZones();
      return (response.data || []) as Array<{ id: string; name: string }>;
    },
    enabled: open,
  });
  const zones = zonesData || [];

  // Fetch companies
  const { data: companiesData } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const response = isSeller
        ? await sellerResourcesAPI.getCompanies()
        : await companiesAPI.getCompanies();
      return response.data || [];
    },
    enabled: open,
  });

  // Fetch brands (filtered by company if selected)
  const { data: brandsData } = useQuery({
    queryKey: ['brands', selectedCompany],
    queryFn: async () => {
      if (isSeller) {
        const response = await sellerResourcesAPI.getBrands();
        const all = (response.data || []) as any[];
        if (!selectedCompany) return all;
        return all.filter((b) => (b.company?.id || b.companyId || b.company_id) === selectedCompany);
      }

      const response = await brandsAPI.getBrands(selectedCompany ? { companyId: selectedCompany } : undefined);
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

  // Sellers can now choose any company (backend no longer restricts by assigned company)

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
  // Only active divisions belong in the picker; resolve the legacy 'default' sentinel
  // to the FOOD & FMCG division (slug 'default') so it shows as selected.
  const activeDivisions = (divisionsData || []).filter(
    (d: any) => d.isActive !== false && d.is_active !== false,
  );
  const watchedDivision = watch('divisionId');
  const resolvedDivisionValue =
    watchedDivision && watchedDivision !== 'default'
      ? watchedDivision
      : (activeDivisions.find((d: any) => d.slug === 'default')?.id ?? '');

  // Load product data when editing
  useEffect(() => {
    if (productData && open) {
      const categoryId =
        productData.category?.id ||
        productData.categoryId ||
        productData.category_id ||
        '';
      const companyId =
        productData.company?.id ||
        productData.companyId ||
        productData.company_id ||
        '';
      const brandId =
        productData.brand?.id ||
        productData.brandId ||
        productData.brand_id ||
        '';
      const divisionId =
        productData.division?.id ||
        productData.divisionId ||
        productData.division_id ||
        'default';
      const mrp = Number(productData.mrp ?? 0);
      const sellingPrice = Number(productData.sellingPrice ?? productData.selling_price ?? 0);
      const commissionCost = Number(productData.commissionCost ?? productData.commission_cost ?? 0);
      const stockQuantity = Number(productData.stockQuantity ?? productData.stock_quantity ?? 0);
      const minOrderQuantity = Number(productData.minOrderQuantity ?? productData.min_order_quantity ?? 1);
      const piecesPerSet = Number(productData.piecesPerSet ?? productData.pieces_per_set ?? 1);
      const isFeatured = Boolean(productData.isFeatured ?? productData.is_featured ?? false);
      const isAvailable = productData.isAvailable !== undefined
        ? Boolean(productData.isAvailable)
        : (productData.is_available !== undefined ? Boolean(productData.is_available) : true);

      reset({
        name: productData.name || '',
        description: productData.description || '',
        categoryId,
        divisionId: divisionId || 'default',
        zoneId: (productData.zoneId ?? productData.zone_id) ? String(productData.zoneId ?? productData.zone_id) : 'none',
        companyId: companyId || '',
        brandId: brandId || 'none',
        mrp,
        sellingPrice,
        commissionCost,
        stockQuantity,
        minOrderQuantity,
        unit: productData.unit || 'piece',
        piecesPerSet,
        isFeatured,
        isAvailable,
        variants: (productData.variants && Array.isArray(productData.variants) && productData.variants.length > 0)
          ? productData.variants.map((v: any) => ({
              id: (v.id ?? '').toString() || undefined,
              hsnCode: v.hsnCode || v.hsn_code || '',
              packagingLabelType:
                v.packagingLabelType?.toString() || v.packaging_label_type?.toString() || '',
              setPieces: v.setPieces?.toString() || v.set_pcs?.toString() || '',
              weight: v.weight || '',
              mrp: Number(v.mrp || 0),
              specialPrice: Number(v.specialPrice || v.special_price || 0),
              freeItem: v.freeItem || v.free_item || '',
              minOrderQuantity: Number(v.minOrderQuantity || v.min_order_quantity || 1),
            }))
          : [
              {
                hsnCode: productData.hsnCode || productData.hsn_code || '',
                packagingLabelType: '',
                setPieces: '',
                weight: '',
                mrp,
                specialPrice: sellingPrice,
                freeItem: '',
              },
            ],
        hsnCode: productData.hsnCode || productData.hsn_code || '',
        expiryDate: productData.expiryDate || productData.expiry_date || '',
        metaTitle: productData.metaTitle || '',
        metaDescription: productData.metaDescription || '',
        manufacturerName: productData.manufacturerName || productData.manufacturer_name || '',
        manufacturerAddress: productData.manufacturerAddress || productData.manufacturer_address || '',
        cancelPolicy: productData.cancelPolicy || productData.cancel_policy || '',
        returnPolicy: productData.returnPolicy || productData.return_policy || '',
      });
      setSelectedCompany(companyId || '');
      setImageSlots((prev) => {
        revokeLocalPreviews(prev);
        const gallery =
          (Array.isArray(productData.images) && productData.images) ||
          (Array.isArray(productData.product_images) && productData.product_images) ||
          (Array.isArray(productData.productImages) && productData.productImages) ||
          [];
        console.log('[ProductForm] Seeding imageSlots from productData. gallery:', JSON.stringify(gallery));
        if (!gallery.length) {
          return [];
        }
        const seeded = gallery
          .map((img: any) => ({
            kind: 'remote' as const,
            id: String(img.id ?? ''),
            url: String(img.imageUrl || img.image_url || img.url || ''),
          }))
          .filter((s) => s.id && s.url);
        console.log('[ProductForm] imageSlots seeded:', JSON.stringify(seeded));
        return seeded;
      });

      // Capture each variant's server image gallery, keyed by backend variant id.
      // A separate effect seeds these into variantImageSlots once useFieldArray rows exist.
      const variantImagesByVariantId: Record<string, VariantImageSlot[]> = {};
      if (Array.isArray(productData.variants)) {
        productData.variants.forEach((v: any) => {
          const vid = (v.id ?? '').toString();
          if (!vid) return;
          const imgs = Array.isArray(v.images) ? v.images : [];
          variantImagesByVariantId[vid] = imgs
            .map((img: any): VariantImageSlot => ({
              kind: 'remote' as const,
              id: String(img.id ?? ''),
              url: String(img.imageUrl || img.image_url || img.url || ''),
              variantId: vid,
            }))
            .filter((s: VariantImageSlot) => s.kind === 'remote' && s.id && s.url);
        });
      }
      serverVariantImagesRef.current = variantImagesByVariantId;
      variantImagesInitKeyRef.current = null; // force re-seed for this product
      setVariantImageSlots((prev) => {
        revokeAllVariantPreviews(prev);
        return {};
      });
      setRemovedVariantImages([]);
    } else if (!productId && open) {
      reset({
        companyId: '',
        brandId: 'none',
        mrp: 0,
        sellingPrice: 0,
        minOrderQuantity: 1,
        piecesPerSet: 1,
        commissionCost: 0,
        isFeatured: false,
        isAvailable: true,
        unit: 'piece',
        variants: [
          {
            hsnCode: '',
            packagingLabelType: '',
            setPieces: '',
            weight: '',
            mrp: 0,
            specialPrice: 0,
            freeItem: '',
          },
        ],
      });
      setImageSlots((prev) => {
        revokeLocalPreviews(prev);
        return [];
      });
      setVariantImageSlots((prev) => {
        revokeAllVariantPreviews(prev);
        return {};
      });
      setRemovedVariantImages([]);
      serverVariantImagesRef.current = {};
      variantImagesInitKeyRef.current = null;
      setSelectedCompany('');
    }
  }, [productData, productId, open, reset]);

  // Seed per-variant image galleries into state once useFieldArray rows exist for
  // the loaded product. Keyed by the RHF row key (field.rowKey); matched to server
  // images via each row's backend variant id (field.id).
  useEffect(() => {
    if (!productId) return;
    if (variantImagesInitKeyRef.current === productId) return;
    if (!variantFields.length) return;
    const seeded: Record<string, VariantImageSlot[]> = {};
    variantFields.forEach((field: any) => {
      const backendId = (field.id ?? '').toString();
      seeded[field.rowKey] = backendId
        ? (serverVariantImagesRef.current[backendId] ?? [])
        : [];
    });
    variantImagesInitKeyRef.current = productId;
    setVariantImageSlots(seeded);
  }, [productId, variantFields]);

  // Handle company change to filter brands
  const handleCompanyChange = (companyId: string) => {
    setSelectedCompany(companyId);
    setValue('companyId', companyId);
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

    setImageSlots((prev) => {
      const room = 5 - prev.length;
      if (room <= 0) return prev;
      const slice = validFiles.slice(0, room);
      const next = [...prev];
      for (const file of slice) {
        next.push({ kind: 'local', file, preview: URL.createObjectURL(file) });
      }
      return next;
    });
  };

  const removeImage = (index: number) => {
    setImageSlots((prev) => {
      const slot = prev[index];
      if (slot?.kind === 'local' && slot.preview.startsWith('blob:')) {
        URL.revokeObjectURL(slot.preview);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  // ── Per-variant image handlers ───────────────────────────────────────────
  const VARIANT_IMAGE_MAX = 5;

  const handleVariantFileChange = (rowKey: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter((file) => {
      if (!file.type.startsWith('image/')) {
        toast({ title: 'Invalid file type', description: 'Please select image files only', variant: 'destructive' });
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: 'File too large', description: 'Image size must be less than 5MB', variant: 'destructive' });
        return false;
      }
      return true;
    });
    setVariantImageSlots((prev) => {
      const current = prev[rowKey] ?? [];
      const room = VARIANT_IMAGE_MAX - current.length;
      if (room <= 0) return prev;
      const next = [...current];
      for (const file of validFiles.slice(0, room)) {
        next.push({ kind: 'local', file, preview: URL.createObjectURL(file) });
      }
      return { ...prev, [rowKey]: next };
    });
    // Allow re-selecting the same file later.
    e.target.value = '';
  };

  const removeVariantImage = (rowKey: string, index: number) => {
    setVariantImageSlots((prev) => {
      const current = prev[rowKey] ?? [];
      const slot = current[index];
      if (slot?.kind === 'local' && slot.preview.startsWith('blob:')) {
        URL.revokeObjectURL(slot.preview);
      }
      if (slot?.kind === 'remote') {
        setRemovedVariantImages((r) => [...r, { variantId: slot.variantId, imageId: slot.id }]);
      }
      return { ...prev, [rowKey]: current.filter((_, i) => i !== index) };
    });
  };

  // Wrap field-array remove so a deleted variant row drops its image slots too.
  const removeVariantRow = (index: number) => {
    const field: any = variantFields[index];
    const rowKey = field?.rowKey as string | undefined;
    if (rowKey) {
      setVariantImageSlots((prev) => {
        const current = prev[rowKey] ?? [];
        current.forEach((s) => {
          if (s.kind === 'remote') {
            setRemovedVariantImages((r) => [...r, { variantId: s.variantId, imageId: s.id }]);
          }
        });
        revokeLocalPreviews(current);
        const { [rowKey]: _drop, ...rest } = prev;
        return rest;
      });
    }
    removeVariant(index);
  };

  /**
   * Phase-2 save: push each variant's newly-picked images and remove the ones the
   * user deleted. `result` is the create/update API response (AdminProductResponse);
   * `data` is the submitted form. Variants align by index (backend returns them in
   * sort_order == submission order). Best-effort: image failures warn but don't
   * roll back the already-saved product.
   */
  const syncVariantImages = async (result: any, data: ProductFormData) => {
    const product = result?.data ?? result;
    const resolvedProductId: string | undefined = productId ?? product?.id;
    if (!resolvedProductId) return;

    const serverVariants: any[] = Array.isArray(product?.variants) ? product.variants : [];
    const formVariants = data.variants ?? [];
    let hadError = false;

    // Delete removed remote images first (skip ones already gone via cascade).
    for (const { variantId, imageId } of removedVariantImages) {
      try {
        await productsAPI.deleteVariantImage(resolvedProductId, variantId, imageId);
      } catch {
        // Variant may have been deleted (images cascade) — safe to ignore.
      }
    }

    // Upload new local files per variant row.
    for (let i = 0; i < formVariants.length; i++) {
      const serverVariant = serverVariants[i];
      const variantId: string | undefined = serverVariant?.id ? String(serverVariant.id) : undefined;
      const rowKey = (variantFields[i] as any)?.rowKey as string | undefined;
      if (!variantId || !rowKey) continue;

      const slots = variantImageSlots[rowKey] ?? [];
      const localFiles = slots
        .filter((s): s is Extract<VariantImageSlot, { kind: 'local' }> => s.kind === 'local')
        .map((s) => s.file);
      if (!localFiles.length) continue;

      const hasRemote = slots.some((s) => s.kind === 'remote');
      const firstIsLocal = slots[0]?.kind === 'local';
      const primaryIndex = !hasRemote && firstIsLocal ? 0 : undefined;

      try {
        await productsAPI.uploadVariantImages(resolvedProductId, variantId, localFiles, primaryIndex);
      } catch {
        hadError = true;
      }
    }

    if (hadError) {
      toast({
        title: 'Some variant images failed to upload',
        description: 'The product was saved, but please re-check variant images.',
        variant: 'destructive',
      });
    }
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

      // Add division (optional): "default" means NULL on backend (Grocery)
      if (data.divisionId && data.divisionId !== 'default') {
        formData.append('division_id', data.divisionId);
      } else {
        // Ensure updates can clear division back to default
        if (productId) formData.append('division_id', '');
      }

      // Add zone (optional): "none" means no zone restriction (available everywhere)
      if (data.zoneId && data.zoneId !== 'none') {
        formData.append('zoneId', data.zoneId);
      } else {
        // Explicitly clear zone when updating
        if (productId) formData.append('zoneId', '');
      }

      // Add company (required) - backend expects 'company_id'
      if (!data.companyId || data.companyId === 'none' || data.companyId === '') {
        throw new Error('Company is required');
      }
      formData.append('company_id', data.companyId);
      
      // Add brand (optional) - backend expects 'brand_id'
      if (data.brandId && data.brandId !== 'none' && data.brandId !== '') {
        formData.append('brand_id', data.brandId);
      }
      
      // Add stock and order quantities (overall stock for all variants)
      formData.append('stockQuantity', (data.stockQuantity || 0).toString());
      formData.append('minOrderQuantity', (data.minOrderQuantity || 1).toString());
      
      // Add unit (generic unit, individual variant weights go in variants array)
      formData.append('unit', data.unit);
      
      // For "piece" unit, always persist 1 to avoid bad UI labels like "12 pcs / piece".
      const normalizedPiecesPerSet = normalizePiecesPerSetForUnit(data.unit, data.piecesPerSet);
      formData.append('piecesPerSet', normalizedPiecesPerSet.toString());
      
      // Add boolean fields (convert to string)
      formData.append('isFeatured', (data.isFeatured || false).toString());
      formData.append('isAvailable', (data.isAvailable !== false).toString());
      
      // Add HSN code if provided
      if (data.hsnCode) {
        formData.append('hsnCode', data.hsnCode);
      }

      // Add expiry date: on create only if provided; on update always so backend can clear when empty
      if (productId) {
        formData.append('expiryDate', data.expiryDate && data.expiryDate.trim() ? data.expiryDate.trim() : '');
      } else if (data.expiryDate && data.expiryDate.trim()) {
        formData.append('expiryDate', data.expiryDate.trim());
      }
      
      // Add SEO fields if provided
      if (data.metaTitle) {
        formData.append('meta_title', data.metaTitle);
      }
      if (data.metaDescription) {
        formData.append('meta_description', data.metaDescription);
      }

      // Bill From (manufacturer/supplier) fields
      formData.append('manufacturerName', data.manufacturerName?.trim() || '');
      formData.append('manufacturerAddress', data.manufacturerAddress?.trim() || '');
      formData.append('cancelPolicy', data.cancelPolicy?.trim() || '');
      formData.append('returnPolicy', data.returnPolicy?.trim() || '');
      
      // Images: on update, tell backend which existing rows to keep, then append new files.
      const localSlots = imageSlots.filter((s): s is Extract<ProductImageSlot, { kind: 'local' }> => s.kind === 'local');
      // Admin PUT supports keepImageIds; seller PUT is JSON-only (same FormData is a separate issue).
      if (productId && !isSeller) {
        const keepIds = imageSlots.filter((s) => s.kind === 'remote').map((s) => s.id);
        console.log('[ProductForm] imageSlots at save:', JSON.stringify(imageSlots));
        console.log('[ProductForm] keepIds being sent:', keepIds);
        formData.append('keepImageIds', JSON.stringify(keepIds));
      }
      localSlots.forEach((s) => {
        formData.append('images', s.file);
      });
      // primaryIndex is relative to newly uploaded files only; set when the first gallery slot is new.
      if (localSlots.length > 0 && imageSlots[0]?.kind === 'local') {
        formData.append('primaryIndex', '0');
      }

      // Add variants as JSON so backend can create separate rows per variant.
      // `id` is round-tripped so the backend upserts (keeps variant ids + their
      // image galleries stable) instead of delete-and-recreate.
      if (data.variants && data.variants.length > 0) {
        const cleanedVariants = data.variants.map((v) => ({
          id: v.id || undefined,
          hsnCode: v.hsnCode || '',
          packagingLabelType: (v.packagingLabelType || '').trim() || undefined,
          setPieces: v.setPieces || '',
          weight: v.weight || '',
          mrp: Number.isFinite(v.mrp) ? v.mrp : 0,
          specialPrice: Number.isFinite(v.specialPrice) ? v.specialPrice : 0,
          freeItem: v.freeItem || '',
          minOrderQuantity: Number.isFinite(v.minOrderQuantity) && (v.minOrderQuantity ?? 0) >= 1 ? v.minOrderQuantity : 1,
        }));
        formData.append('variants', JSON.stringify(cleanedVariants));
      }

      let result: any;
      if (productId) {
        result = await (isSeller
          ? sellerProductsAPI.updateProduct(productId, formData)
          : productsAPI.updateProduct(productId, formData));
      } else {
        result = await (isSeller
          ? sellerProductsAPI.createProduct(formData)
          : productsAPI.createProduct(formData));
      }

      // Phase 2 — per-variant image galleries (admin only; sellers can't manage variants).
      // Variants come back in submission order (backend sorts by sort_order), so we
      // map form row i → response variant i to learn each row's authoritative id.
      if (!isSeller) {
        await syncVariantImages(result, data);
      }

      return result;
    },
    onSuccess: async (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      if (productId) {
        queryClient.invalidateQueries({ queryKey: ['product', productId] });
      }
      toast({
        title: productId ? 'Product updated' : 'Product created',
        description: productId
          ? 'Product has been updated successfully'
          : 'Product has been created successfully',
      });
      onOpenChange(false);
      reset();
      setImageSlots((prev) => {
        revokeLocalPreviews(prev);
        return [];
      });
      setVariantImageSlots((prev) => {
        revokeAllVariantPreviews(prev);
        return {};
      });
      setRemovedVariantImages([]);
      serverVariantImagesRef.current = {};
      variantImagesInitKeyRef.current = null;
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
    // On create the product-level Pricing section is hidden (pricing is entered per
    // variant), so derive a representative product price from the first variant.
    if (!productId && data.variants && data.variants.length > 0) {
      const v = data.variants[0];
      data = {
        ...data,
        mrp: data.mrp > 0 ? data.mrp : Number(v.mrp || 0),
        sellingPrice: data.sellingPrice > 0 ? data.sellingPrice : Number(v.specialPrice || v.mrp || 0),
      };
    }
    productMutation.mutate(data);
  };

  const onSubmitInvalid = (errors: any) => {
    const firstError = Object.values(errors)?.[0] as any;
    const message =
      firstError?.message ||
      firstError?.[0]?.message ||
      'Please fill all required fields';
    toast({
      title: 'Validation error',
      description: message,
      variant: 'destructive',
    });
  };

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

        <form onSubmit={handleSubmit(onSubmit, onSubmitInvalid)} className="space-y-6">
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

            <div className="space-y-2">
              <Label htmlFor="divisionId">Division</Label>
              <Select
                value={resolvedDivisionValue}
                onValueChange={(value) => setValue('divisionId', value)}
              >
                <SelectTrigger id="divisionId">
                  <SelectValue placeholder="Select a division" />
                </SelectTrigger>
                <SelectContent>
                  {activeDivisions.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.icon ? `${d.icon} ` : ''}{d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Grocery is used when division is empty. Pick Kitchen to keep products/cart/orders in that vertical.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="zoneId">Zone (delivery area)</Label>
              <Select
                value={watch('zoneId') || 'none'}
                onValueChange={(value) => setValue('zoneId', value)}
              >
                <SelectTrigger id="zoneId">
                  <SelectValue placeholder="No zone restriction" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No restriction — available everywhere</SelectItem>
                  {zones.map((z) => (
                    <SelectItem key={z.id} value={z.id}>
                      {z.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Restrict this product to customers in a specific delivery zone. Leave empty to show it to everyone.
              </p>
            </div>
          </div>

          {/* Company & Brand */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Company & Brand</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyId">
                  Company <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={watch('companyId') || ''}
                  onValueChange={handleCompanyChange}
                >
                  <SelectTrigger id="companyId">
                    <SelectValue placeholder="Select company" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isSeller && (
                  <p className="text-xs text-muted-foreground">
                    Sellers can now create products for any company.
                  </p>
                )}
                {errors.companyId && (
                  <p className="text-sm text-destructive">{errors.companyId.message}</p>
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
                <Label htmlFor="expiryDate">Expiry Date (optional)</Label>
                <div className="flex gap-2 items-center">
                  <Input
                    id="expiryDate"
                    type="date"
                    {...register('expiryDate')}
                  />
                  {productId && (watch('expiryDate') || productData?.expiryDate || productData?.expiry_date) && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setValue('expiryDate', '')}
                    >
                      Clear expiry
                    </Button>
                  )}
                </div>
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
                    <SelectItem value="set">Set</SelectItem>
                    <SelectItem value="box">Box</SelectItem>
                    <SelectItem value="bottle">Bottle</SelectItem>
                  </SelectContent>
                </Select>
                {errors.unit && (
                  <p className="text-sm text-destructive">{errors.unit.message}</p>
                )}
              </div>
            </div>

          </div>

          {/* Packaging variants — set/pcs label + optional price rows */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-lg font-semibold">Packaging variants</h3>
                <p className="text-xs text-muted-foreground max-w-xl">
                  Choose <strong>Set</strong>, <strong>Pieces</strong>, <strong>Pack</strong>, etc., then add
                  detail (e.g. 6×100g, 12). Shown in the admin product list and mobile app. MRP and special
                  price should match your main pricing unless you use multiple sellable SKUs.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  appendVariant({
                    hsnCode: '',
                    packagingLabelType: '',
                    setPieces: '',
                    weight: '',
                    mrp: 0,
                    specialPrice: 0,
                    freeItem: '',
                    minOrderQuantity: 1,
                  })
                }>
                Add variant row
              </Button>
            </div>

            {variantFields.map((field, index) => (
              <div
                key={(field as any).rowKey}
                className="rounded-lg border border-border bg-card/50 p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-foreground">Variant {index + 1}</span>
                  {variantFields.length > 1 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => removeVariantRow(index)}>
                      Remove
                    </Button>
                  ) : null}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                      value={
                        watch(`variants.${index}.packagingLabelType`)?.trim()
                          ? watch(`variants.${index}.packagingLabelType`)
                          : PACKAGING_SELECT_SENTINEL
                      }
                      onValueChange={(val) =>
                        setValue(
                          `variants.${index}.packagingLabelType`,
                          val === PACKAGING_SELECT_SENTINEL ? '' : val,
                        )
                      }>
                      <SelectTrigger>
                        <SelectValue placeholder="Set / Pieces / Pack…" />
                      </SelectTrigger>
                      <SelectContent>
                        {PACKAGING_LABEL_TYPE_OPTIONS.map((opt) => (
                          <SelectItem
                            key={opt.value || PACKAGING_SELECT_SENTINEL}
                            value={opt.value || PACKAGING_SELECT_SENTINEL}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Label detail</Label>
                    <Input
                      placeholder='e.g. "6×100g", "12"'
                      {...register(`variants.${index}.setPieces`)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Weight / size note</Label>
                    <Input placeholder="e.g. 500 ml" {...register(`variants.${index}.weight`)} />
                  </div>
                  <div className="space-y-2">
                    <Label>HSN (variant)</Label>
                    <Input {...register(`variants.${index}.hsnCode`)} />
                  </div>
                  <div className="space-y-2">
                    <Label>MRP (₹)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      {...register(`variants.${index}.mrp`, { valueAsNumber: true })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Special price (₹)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      {...register(`variants.${index}.specialPrice`, { valueAsNumber: true })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Free item note</Label>
                    <Input {...register(`variants.${index}.freeItem`)} />
                  </div>
                  <div className="space-y-2">
                    <Label>
                      Min Order Qty <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      type="number"
                      placeholder="1"
                      {...register(`variants.${index}.minOrderQuantity`, { valueAsNumber: true })}
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Variant images (Max 5, 5MB each)</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      multiple
                      className="cursor-pointer"
                      disabled={(variantImageSlots[(field as any).rowKey]?.length ?? 0) >= VARIANT_IMAGE_MAX}
                      onChange={(e) => handleVariantFileChange((field as any).rowKey, e)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Images specific to this variant. Shown on the product page when this option is selected.
                    </p>
                    {(variantImageSlots[(field as any).rowKey]?.length ?? 0) > 0 && (
                      <div className="grid grid-cols-4 gap-3">
                        {(variantImageSlots[(field as any).rowKey] ?? []).map((slot, imgIdx) => (
                          <div
                            key={slot.kind === 'remote' ? slot.id : `${slot.preview}-${imgIdx}`}
                            className="relative">
                            <img
                              src={slot.kind === 'remote' ? slot.url : slot.preview}
                              alt={`Variant ${index + 1} image ${imgIdx + 1}`}
                              className="w-full h-20 object-cover rounded-lg border"
                            />
                            <button
                              type="button"
                              onClick={() => removeVariantImage((field as any).rowKey, imgIdx)}
                              className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1">
                              <X className="h-3 w-3" />
                            </button>
                            {imgIdx === 0 && (
                              <div className="absolute bottom-0 left-0 right-0 bg-primary text-primary-foreground text-[10px] text-center py-0.5">
                                Primary
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
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
                  disabled={imageSlots.length >= 5}
                />
              </div>
              {imageSlots.length >= 5 && (
                <p className="text-sm text-muted-foreground">
                  Maximum 5 images allowed
                </p>
              )}
            </div>

            {imageSlots.length > 0 && (
              <div className="grid grid-cols-4 gap-4">
                {imageSlots.map((slot, index) => (
                  <div key={slot.kind === 'remote' ? slot.id : `${slot.preview}-${index}`} className="relative">
                    <img
                      src={slot.kind === 'remote' ? slot.url : slot.preview}
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

          {/* Bill From — manufacturer / supplier address */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Bill From (Supplier / Manufacturer)</h3>
            <p className="text-sm text-muted-foreground">
              Appears as the "Bill From" address on invoices and purchase bills.
            </p>

            <div className="space-y-2">
              <Label htmlFor="manufacturerName">Manufacturer / Supplier Name</Label>
              <Input
                id="manufacturerName"
                {...register('manufacturerName')}
                placeholder="e.g. krishn bhog flowr mill"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="manufacturerAddress">Manufacturer / Supplier Address</Label>
              <Textarea
                id="manufacturerAddress"
                {...register('manufacturerAddress')}
                placeholder="e.g. adibaran pur harihar pur azamgarh, State: 09-Uttar Pradesh"
                rows={3}
              />
            </div>
          </div>

          {/* Policies */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Policies</h3>
            <p className="text-sm text-muted-foreground">
              Shown to customers on the product page.
            </p>

            <div className="space-y-2">
              <Label htmlFor="cancelPolicy">Cancellation Policy</Label>
              <Textarea
                id="cancelPolicy"
                {...register('cancelPolicy')}
                placeholder="e.g. Order can be cancelled within 24 hours of placing."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="returnPolicy">Return Policy</Label>
              <Textarea
                id="returnPolicy"
                {...register('returnPolicy')}
                placeholder="e.g. Returns accepted within 7 days if product is damaged."
                rows={3}
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

