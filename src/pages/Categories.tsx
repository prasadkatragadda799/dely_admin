import { useState } from 'react';
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  ChevronRight,
  FolderTree,
  Package
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

// Mock data
const categories = [
  {
    id: 1,
    name: 'Rice & Grains',
    icon: '🌾',
    color: '#f59e0b',
    productCount: 145,
    subcategories: [
      { id: 11, name: 'Basmati Rice', productCount: 45 },
      { id: 12, name: 'Brown Rice', productCount: 28 },
      { id: 13, name: 'White Rice', productCount: 52 },
      { id: 14, name: 'Specialty Grains', productCount: 20 },
    ],
  },
  {
    id: 2,
    name: 'Cooking Oil',
    icon: '🫒',
    color: '#84cc16',
    productCount: 89,
    subcategories: [
      { id: 21, name: 'Sunflower Oil', productCount: 32 },
      { id: 22, name: 'Mustard Oil', productCount: 24 },
      { id: 23, name: 'Groundnut Oil', productCount: 18 },
      { id: 24, name: 'Olive Oil', productCount: 15 },
    ],
  },
  {
    id: 3,
    name: 'Flour & Atta',
    icon: '🌾',
    color: '#f97316',
    productCount: 67,
    subcategories: [
      { id: 31, name: 'Wheat Flour', productCount: 35 },
      { id: 32, name: 'Maida', productCount: 18 },
      { id: 33, name: 'Besan', productCount: 14 },
    ],
  },
  {
    id: 4,
    name: 'Pulses & Lentils',
    icon: '🫘',
    color: '#8b5cf6',
    productCount: 112,
    subcategories: [
      { id: 41, name: 'Toor Dal', productCount: 28 },
      { id: 42, name: 'Moong Dal', productCount: 24 },
      { id: 43, name: 'Chana Dal', productCount: 22 },
      { id: 44, name: 'Urad Dal', productCount: 20 },
      { id: 45, name: 'Masoor Dal', productCount: 18 },
    ],
  },
  {
    id: 5,
    name: 'Sugar & Sweeteners',
    icon: '🍬',
    color: '#ec4899',
    productCount: 34,
    subcategories: [
      { id: 51, name: 'Refined Sugar', productCount: 18 },
      { id: 52, name: 'Jaggery', productCount: 10 },
      { id: 53, name: 'Honey', productCount: 6 },
    ],
  },
  {
    id: 6,
    name: 'Spices & Masalas',
    icon: '🌶️',
    color: '#ef4444',
    productCount: 198,
    subcategories: [
      { id: 61, name: 'Ground Spices', productCount: 65 },
      { id: 62, name: 'Whole Spices', productCount: 78 },
      { id: 63, name: 'Blended Masalas', productCount: 55 },
    ],
  },
  {
    id: 7,
    name: 'Beverages',
    icon: '🍵',
    color: '#06b6d4',
    productCount: 78,
    subcategories: [
      { id: 71, name: 'Tea', productCount: 35 },
      { id: 72, name: 'Coffee', productCount: 28 },
      { id: 73, name: 'Health Drinks', productCount: 15 },
    ],
  },
  {
    id: 8,
    name: 'Dairy Products',
    icon: '🥛',
    color: '#3b82f6',
    productCount: 56,
    subcategories: [
      { id: 81, name: 'Ghee', productCount: 24 },
      { id: 82, name: 'Butter', productCount: 18 },
      { id: 83, name: 'Paneer', productCount: 14 },
    ],
  },
];

export default function Categories() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<number[]>([1, 2]);

  const toggleCategory = (id: number) => {
    if (expandedCategories.includes(id)) {
      setExpandedCategories(expandedCategories.filter(c => c !== id));
    } else {
      setExpandedCategories([...expandedCategories, id]);
    }
  };

  const totalProducts = categories.reduce((acc, cat) => acc + cat.productCount, 0);
  const totalSubcategories = categories.reduce((acc, cat) => acc + cat.subcategories.length, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Categories</h1>
          <p className="text-muted-foreground">Manage product categories and subcategories</p>
        </div>
        <Button variant="gradient">
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
                <p className="text-2xl font-bold text-foreground">{categories.length}</p>
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
                <p className="text-2xl font-bold text-foreground">{totalSubcategories}</p>
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
                <p className="text-2xl font-bold text-foreground">{totalProducts}</p>
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
          <div className="space-y-2">
            {categories.map((category) => (
              <div key={category.id} className="border border-border rounded-lg overflow-hidden">
                {/* Main Category */}
                <div 
                  className="flex items-center justify-between p-4 bg-secondary/30 hover:bg-secondary/50 cursor-pointer transition-colors"
                  onClick={() => toggleCategory(category.id)}
                >
                  <div className="flex items-center gap-3">
                    <ChevronRight 
                      className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${
                        expandedCategories.includes(category.id) ? 'rotate-90' : ''
                      }`}
                    />
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                      style={{ backgroundColor: `${category.color}20` }}
                    >
                      {category.icon}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{category.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {category.subcategories.length} subcategories · {category.productCount} products
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover">
                        <DropdownMenuItem>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Subcategory
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Category
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive focus:text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Category
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Subcategories */}
                {expandedCategories.includes(category.id) && (
                  <div className="border-t border-border animate-fade-in">
                    {category.subcategories.map((sub, index) => (
                      <div 
                        key={sub.id}
                        className={`flex items-center justify-between p-3 pl-14 hover:bg-secondary/30 transition-colors ${
                          index < category.subcategories.length - 1 ? 'border-b border-border' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                          <p className="text-sm text-foreground">{sub.name}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-xs text-muted-foreground">{sub.productCount} products</span>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-popover">
                              <DropdownMenuItem>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive focus:text-destructive">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
