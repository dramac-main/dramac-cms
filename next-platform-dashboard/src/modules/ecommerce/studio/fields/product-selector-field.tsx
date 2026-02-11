/**
 * E-Commerce Product Selector Field
 * 
 * Custom field for selecting products in Studio.
 * Displays a searchable dropdown with product images and prices.
 */

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Check, ChevronsUpDown, Search, X, Package, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/locale-config";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import type { CustomFieldEditorProps } from "@/types/studio-module";
import { useDebouncedCallback } from "use-debounce";

// =============================================================================
// TYPES
// =============================================================================

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number;
  image?: string;
  status: "active" | "draft" | "archived";
  sku?: string;
  categoryName?: string;
}

interface ProductValue {
  id: string;
  name: string;
  price: number;
  image?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function ProductSelectorField({
  value,
  onChange,
  field,
  siteId,
}: CustomFieldEditorProps) {
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [initialLoaded, setInitialLoaded] = useState(false);

  // Parse current value
  const selectedProduct = useMemo((): ProductValue | null => {
    if (!value) return null;
    if (typeof value === "string") {
      return { id: value, name: "Loading...", price: 0 };
    }
    return value as ProductValue;
  }, [value]);

  // Fetch products
  const fetchProducts = useCallback(async (searchQuery: string = "") => {
    if (!siteId) return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams({
        siteId,
        search: searchQuery,
        status: "active",
        limit: "50",
      });
      
      const response = await fetch(`/api/studio/modules/ecommerce/products?${params}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }
      
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error("[ProductSelector] Fetch error:", error);
      setProducts([]);
    } finally {
      setLoading(false);
      setInitialLoaded(true);
    }
  }, [siteId]);

  // Debounced search
  const debouncedSearch = useDebouncedCallback((query: string) => {
    fetchProducts(query);
  }, 300);

  // Initial load
  useEffect(() => {
    if (open && !initialLoaded) {
      fetchProducts();
    }
  }, [open, initialLoaded, fetchProducts]);

  // Handle search
  const handleSearch = (query: string) => {
    setSearch(query);
    debouncedSearch(query);
  };

  // Handle select
  const handleSelect = (product: Product) => {
    const newValue: ProductValue = {
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
    };
    onChange(newValue);
    setOpen(false);
  };

  // Handle clear
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        {field.label}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </label>
      
      {field.description && (
        <p className="text-xs text-muted-foreground">{field.description}</p>
      )}
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-auto min-h-[40px] py-2"
          >
            {selectedProduct ? (
              <div className="flex items-center gap-3 w-full">
                {selectedProduct.image ? (
                  <img
                    src={selectedProduct.image}
                    alt={selectedProduct.name}
                    className="w-8 h-8 rounded object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded bg-muted flex items-center justify-center flex-shrink-0">
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium truncate">
                    {selectedProduct.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency(selectedProduct.price)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 flex-shrink-0"
                  onClick={handleClear}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <span className="text-muted-foreground">Select a product...</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command shouldFilter={false}>
            <div className="flex items-center border-b px-3">
              <Search className="h-4 w-4 shrink-0 opacity-50" />
              <input
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search products..."
                className="flex h-10 w-full rounded-md bg-transparent py-3 px-2 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              />
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            </div>
            
            <CommandList>
              {!loading && products.length === 0 && (
                <CommandEmpty>
                  {search ? "No products found." : "No products available."}
                </CommandEmpty>
              )}
              
              {loading && products.length === 0 && (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  Loading products...
                </div>
              )}
              
              <CommandGroup>
                {products.map((product) => (
                  <CommandItem
                    key={product.id}
                    value={product.id}
                    onSelect={() => handleSelect(product)}
                    className="flex items-center gap-3 py-2"
                  >
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-10 h-10 rounded object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded bg-muted flex items-center justify-center flex-shrink-0">
                        <Package className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{product.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatCurrency(product.price)}</span>
                        {product.sku && <span>• {product.sku}</span>}
                        {product.categoryName && (
                          <Badge variant="secondary" className="text-[10px] h-4">
                            {product.categoryName}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <Check
                      className={cn(
                        "h-4 w-4 flex-shrink-0",
                        selectedProduct?.id === product.id
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}

// =============================================================================
// FIELD DEFINITION
// =============================================================================

export const productSelectorFieldDefinition = {
  type: "ecommerce:product-selector",
  label: "Product Selector",
  moduleId: "ecommerce",
  moduleName: "E-Commerce",
  render: ProductSelectorField,
  validate: (value: unknown) => {
    // Validation logic - can be extended
    return null;
  },
};

export default ProductSelectorField;
