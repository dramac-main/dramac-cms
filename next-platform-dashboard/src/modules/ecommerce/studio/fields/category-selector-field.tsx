/**
 * E-Commerce Category Selector Field
 * 
 * Custom field for selecting product categories in Studio.
 * Shows hierarchical categories with product counts.
 */

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Check, ChevronsUpDown, Folder, FolderOpen, Loader2 } from "lucide-react";
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

// =============================================================================
// TYPES
// =============================================================================

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: string;
  productCount: number;
  children?: Category[];
}

interface CategoryValue {
  id: string;
  name: string;
  slug: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function CategorySelectorField({
  value,
  onChange,
  field,
  siteId,
}: CustomFieldEditorProps) {
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Parse current value
  const selectedCategory = useMemo((): CategoryValue | null => {
    if (!value) return null;
    if (typeof value === "string") {
      return { id: value, name: "Loading...", slug: "" };
    }
    return value as CategoryValue;
  }, [value]);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    if (!siteId || loaded) return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams({
        siteId,
        includeEmpty: "true",
      });
      
      const response = await fetch(`/api/studio/modules/ecommerce/categories?${params}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch categories");
      }
      
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error("[CategorySelector] Fetch error:", error);
      setCategories([]);
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }, [siteId, loaded]);

  // Load on open
  useEffect(() => {
    if (open && !loaded) {
      fetchCategories();
    }
  }, [open, loaded, fetchCategories]);

  // Handle select
  const handleSelect = (category: Category) => {
    const newValue: CategoryValue = {
      id: category.id,
      name: category.name,
      slug: category.slug,
    };
    onChange(newValue);
    setOpen(false);
  };

  // Handle clear - select "All Categories"
  const handleSelectAll = () => {
    onChange(null);
    setOpen(false);
  };

  // Build category tree for nested display
  const categoryTree = useMemo(() => {
    const roots = categories.filter(c => !c.parentId);
    const children = categories.filter(c => c.parentId);
    
    return roots.map(root => ({
      ...root,
      children: children.filter(c => c.parentId === root.id),
    }));
  }, [categories]);

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
            className="w-full justify-between"
          >
            {selectedCategory ? (
              <div className="flex items-center gap-2">
                <Folder className="h-4 w-4 text-muted-foreground" />
                <span>{selectedCategory.name}</span>
              </div>
            ) : (
              <span className="text-muted-foreground">All Categories</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command>
            <CommandList>
              {loading && (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                  Loading categories...
                </div>
              )}
              
              {!loading && categories.length === 0 && (
                <CommandEmpty>No categories found.</CommandEmpty>
              )}
              
              {!loading && categories.length > 0 && (
                <>
                  {/* All Categories option */}
                  <CommandGroup>
                    <CommandItem
                      value="all"
                      onSelect={handleSelectAll}
                      className="flex items-center gap-2"
                    >
                      <FolderOpen className="h-4 w-4" />
                      <span>All Categories</span>
                      <Check
                        className={cn(
                          "ml-auto h-4 w-4",
                          !selectedCategory ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  </CommandGroup>
                  
                  {/* Category tree */}
                  <CommandGroup heading="Categories">
                    {categoryTree.map((category) => (
                      <div key={category.id}>
                        <CommandItem
                          value={category.id}
                          onSelect={() => handleSelect(category)}
                          className="flex items-center gap-2"
                        >
                          <Folder className="h-4 w-4" />
                          <span className="flex-1">{category.name}</span>
                          <Badge variant="secondary" className="text-[10px] h-4">
                            {category.productCount}
                          </Badge>
                          <Check
                            className={cn(
                              "ml-2 h-4 w-4",
                              selectedCategory?.id === category.id
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                        </CommandItem>
                        
                        {/* Child categories */}
                        {category.children?.map((child) => (
                          <CommandItem
                            key={child.id}
                            value={child.id}
                            onSelect={() => handleSelect(child)}
                            className="flex items-center gap-2 pl-8"
                          >
                            <Folder className="h-3 w-3" />
                            <span className="flex-1 text-sm">{child.name}</span>
                            <Badge variant="secondary" className="text-[10px] h-4">
                              {child.productCount}
                            </Badge>
                            <Check
                              className={cn(
                                "ml-2 h-4 w-4",
                                selectedCategory?.id === child.id
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                          </CommandItem>
                        ))}
                      </div>
                    ))}
                  </CommandGroup>
                </>
              )}
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

export const categorySelectorFieldDefinition = {
  type: "ecommerce:category-selector",
  label: "Category Selector",
  moduleId: "ecommerce",
  moduleName: "E-Commerce",
  render: CategorySelectorField,
  validate: (value: unknown) => {
    return null;
  },
};

export default CategorySelectorField;
