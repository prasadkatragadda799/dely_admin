import { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye,
  Download,
  Upload,
  Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

// Mock data
const products = [
  {
    id: 1,
    name: 'Basmati Rice Premium',
    brand: 'India Gate',
    company: 'KRBL Limited',
    category: 'Rice & Grains',
    mrp: 1250,
    sellingPrice: 1100,
    stock: 450,
    status: 'available',
    featured: true,
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=80&h=80&fit=crop',
  },
  {
    id: 2,
    name: 'Sunflower Oil',
    brand: 'Fortune',
    company: 'Adani Wilmar',
    category: 'Cooking Oil',
    mrp: 180,
    sellingPrice: 165,
    stock: 1200,
    status: 'available',
    featured: false,
    image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=80&h=80&fit=crop',
  },
  {
    id: 3,
    name: 'Wheat Flour (Atta)',
    brand: 'Aashirvaad',
    company: 'ITC Limited',
    category: 'Flour & Atta',
    mrp: 450,
    sellingPrice: 420,
    stock: 23,
    status: 'low_stock',
    featured: true,
    image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=80&h=80&fit=crop',
  },
  {
    id: 4,
    name: 'Toor Dal',
    brand: 'Tata Sampann',
    company: 'Tata Consumer',
    category: 'Pulses & Lentils',
    mrp: 180,
    sellingPrice: 165,
    stock: 0,
    status: 'out_of_stock',
    featured: false,
    image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=80&h=80&fit=crop',
  },
  {
    id: 5,
    name: 'Sugar (Refined)',
    brand: 'Madhur',
    company: 'DSCL Sugar',
    category: 'Sugar & Sweeteners',
    mrp: 52,
    sellingPrice: 48,
    stock: 890,
    status: 'available',
    featured: false,
    image: 'https://images.unsplash.com/photo-1581268221988-5c5f0e255e51?w=80&h=80&fit=crop',
  },
  {
    id: 6,
    name: 'Tea Premium',
    brand: 'Tata Tea',
    company: 'Tata Consumer',
    category: 'Beverages',
    mrp: 520,
    sellingPrice: 485,
    stock: 340,
    status: 'available',
    featured: true,
    image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=80&h=80&fit=crop',
  },
];

const categories = ['All Categories', 'Rice & Grains', 'Cooking Oil', 'Flour & Atta', 'Pulses & Lentils', 'Sugar & Sweeteners', 'Beverages'];
const statuses = ['All Status', 'Available', 'Low Stock', 'Out of Stock'];

export default function Products() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedStatus, setSelectedStatus] = useState('All Status');
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getStatusBadge = (status: string, stock: number) => {
    if (stock === 0) return <Badge variant="cancelled">Out of Stock</Badge>;
    if (stock < 50) return <Badge variant="pending">Low Stock</Badge>;
    return <Badge variant="delivered">Available</Badge>;
  };

  const toggleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map(p => p.id));
    }
  };

  const toggleSelectProduct = (id: number) => {
    if (selectedProducts.includes(id)) {
      setSelectedProducts(selectedProducts.filter(p => p !== id));
    } else {
      setSelectedProducts([...selectedProducts, id]);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Products</h1>
          <p className="text-muted-foreground">Manage your product catalog</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="gradient">
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">892</p>
                <p className="text-xs text-muted-foreground">Total Products</p>
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
                <p className="text-2xl font-bold text-foreground">756</p>
                <p className="text-xs text-muted-foreground">In Stock</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100">
                <Package className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">45</p>
                <p className="text-xs text-muted-foreground">Low Stock</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100">
                <Package className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">12</p>
                <p className="text-xs text-muted-foreground">Out of Stock</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="shadow-card">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products by name, brand, or company..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedProducts.length > 0 && (
        <div className="bg-secondary/50 border border-border rounded-lg p-3 flex items-center justify-between animate-fade-in">
          <span className="text-sm text-foreground">
            <strong>{selectedProducts.length}</strong> products selected
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">Update Stock</Button>
            <Button variant="outline" size="sm">Update Status</Button>
            <Button variant="destructive" size="sm">Delete Selected</Button>
          </div>
        </div>
      )}

      {/* Products Table */}
      <Card className="shadow-card">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary/50">
                <tr className="border-b border-border">
                  <th className="py-4 px-4 text-left">
                    <Checkbox
                      checked={selectedProducts.length === products.length}
                      onCheckedChange={toggleSelectAll}
                    />
                  </th>
                  <th className="py-4 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Product</th>
                  <th className="py-4 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Brand / Company</th>
                  <th className="py-4 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Category</th>
                  <th className="py-4 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Price</th>
                  <th className="py-4 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Stock</th>
                  <th className="py-4 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="py-4 px-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                    <td className="py-4 px-4">
                      <Checkbox
                        checked={selectedProducts.includes(product.id)}
                        onCheckedChange={() => toggleSelectProduct(product.id)}
                      />
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-12 w-12 rounded-lg object-cover bg-secondary"
                        />
                        <div>
                          <p className="font-medium text-foreground">{product.name}</p>
                          {product.featured && (
                            <Badge variant="secondary" className="mt-1 text-xs">Featured</Badge>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <p className="font-medium text-foreground">{product.brand}</p>
                      <p className="text-sm text-muted-foreground">{product.company}</p>
                    </td>
                    <td className="py-4 px-4 text-foreground">{product.category}</td>
                    <td className="py-4 px-4">
                      <p className="font-medium text-foreground">{formatCurrency(product.sellingPrice)}</p>
                      <p className="text-xs text-muted-foreground line-through">{formatCurrency(product.mrp)}</p>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`font-medium ${product.stock === 0 ? 'text-red-600' : product.stock < 50 ? 'text-amber-600' : 'text-foreground'}`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      {getStatusBadge(product.status, product.stock)}
                    </td>
                    <td className="py-4 px-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover">
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Product
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Product
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Showing <strong>1-6</strong> of <strong>892</strong> products
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>Previous</Button>
              <Button variant="outline" size="sm">1</Button>
              <Button variant="secondary" size="sm">2</Button>
              <Button variant="outline" size="sm">3</Button>
              <Button variant="outline" size="sm">Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
