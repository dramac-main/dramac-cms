/**
 * CategoriesPageBlock - Full categories browsing page
 *
 * Phase ECOM-51: Dynamic Route Components
 *
 * Renders a full-page grid of all product categories with images,
 * descriptions, and product counts. Supports hierarchical display
 * with subcategories nested under parents.
 */
"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  Loader2,
  FolderOpen,
  ChevronRight,
  Search,
  LayoutGrid,
  List,
  Grid3X3,
} from "lucide-react";
import { useStorefront } from "../../context/storefront-context";
import { getPublicCategories } from "../../actions/public-ecommerce-actions";
import type { Category } from "../../types/ecommerce-types";
import type { ComponentDefinition } from "@/types/studio";

// =============================================================================
// TYPES
// =============================================================================

interface CategoriesPageBlockProps {
  siteId?: string;
  _siteId?: string | null;
  title?: string;
  subtitle?: string;
  showSearch?: boolean;
  showSubcategories?: boolean;
  showProductCount?: boolean;
  showImages?: boolean;
  showDescription?: boolean;
  layout?: "grid" | "list";
  columns?: 2 | 3 | 4;
  className?: string;
}

interface CategoryTreeNode extends Category {
  children: CategoryTreeNode[];
  product_count?: number;
}

// =============================================================================
// HELPERS
// =============================================================================

function buildCategoryTree(categories: Category[]): CategoryTreeNode[] {
  const map = new Map<string, CategoryTreeNode>();
  const roots: CategoryTreeNode[] = [];

  for (const cat of categories) {
    map.set(cat.id, { ...cat, children: [] });
  }

  for (const cat of categories) {
    const node = map.get(cat.id)!;
    if (cat.parent_id && map.has(cat.parent_id)) {
      map.get(cat.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortNodes = (nodes: CategoryTreeNode[]) => {
    nodes.sort((a, b) => a.sort_order - b.sort_order);
    for (const n of nodes) sortNodes(n.children);
  };
  sortNodes(roots);
  return roots;
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function CategoryGridCard({
  category,
  showImage,
  showDescription,
  showProductCount,
  showSubcategories,
}: {
  category: CategoryTreeNode;
  showImage: boolean;
  showDescription: boolean;
  showProductCount: boolean;
  showSubcategories: boolean;
}) {
  return (
    <div className="group">
      <Link
        href={`/categories/${category.slug}`}
        className={cn(
          "block rounded-xl border bg-card overflow-hidden",
          "hover:border-primary/50 hover:shadow-md transition-all duration-200",
        )}
      >
        {showImage && (
          <div className="relative aspect-[16/10] bg-muted overflow-hidden">
            {category.image_url ? (
              <Image
                src={category.image_url}
                alt={category.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <FolderOpen className="h-12 w-12 text-muted-foreground/40" />
              </div>
            )}
          </div>
        )}
        <div className="p-4">
          <h3 className="font-semibold text-card-foreground group-hover:text-primary transition-colors">
            {category.name}
          </h3>
          {showDescription && category.description && (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
              {category.description}
            </p>
          )}
          {showProductCount && category.product_count !== undefined && (
            <p className="mt-2 text-xs text-muted-foreground">
              {category.product_count} product
              {category.product_count !== 1 ? "s" : ""}
            </p>
          )}
        </div>
      </Link>

      {/* Subcategories */}
      {showSubcategories && category.children.length > 0 && (
        <div className="mt-2 ml-1 flex flex-wrap gap-2">
          {category.children.map((child) => (
            <Link
              key={child.id}
              href={`/categories/${child.slug}`}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-3 py-1",
                "bg-card text-xs text-muted-foreground",
                "hover:bg-accent hover:text-accent-foreground transition-colors",
              )}
            >
              {child.name}
              {showProductCount && child.product_count !== undefined && (
                <span className="text-muted-foreground/60">
                  ({child.product_count})
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function CategoryListRow({
  category,
  showImage,
  showDescription,
  showProductCount,
  showSubcategories,
}: {
  category: CategoryTreeNode;
  showImage: boolean;
  showDescription: boolean;
  showProductCount: boolean;
  showSubcategories: boolean;
}) {
  return (
    <div>
      <Link
        href={`/categories/${category.slug}`}
        className={cn(
          "flex items-center gap-4 p-4 rounded-lg border bg-card",
          "hover:border-primary/50 hover:shadow-sm transition-all group",
        )}
      >
        {showImage && (
          <div className="relative h-16 w-16 shrink-0 rounded-lg bg-muted overflow-hidden">
            {category.image_url ? (
              <Image
                src={category.image_url}
                alt={category.name}
                fill
                className="object-cover"
                sizes="64px"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <FolderOpen className="h-6 w-6 text-muted-foreground/40" />
              </div>
            )}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-card-foreground group-hover:text-primary transition-colors">
            {category.name}
          </h3>
          {showDescription && category.description && (
            <p className="mt-0.5 text-sm text-muted-foreground truncate">
              {category.description}
            </p>
          )}
          {showSubcategories && category.children.length > 0 && (
            <p className="mt-1 text-xs text-muted-foreground">
              {category.children.map((c) => c.name).join(", ")}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {showProductCount && category.product_count !== undefined && (
            <span className="text-sm text-muted-foreground">
              {category.product_count} products
            </span>
          )}
          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
        </div>
      </Link>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function CategoriesPageBlock({
  siteId,
  _siteId,
  title = "Shop by Category",
  subtitle,
  showSearch = true,
  showSubcategories = true,
  showProductCount = true,
  showImages = true,
  showDescription = true,
  layout = "grid",
  columns = 3,
  className,
}: CategoriesPageBlockProps) {
  const storefront = useStorefront();
  const effectiveSiteId = _siteId || siteId || storefront?.siteId || "";

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeLayout, setActiveLayout] = useState<"grid" | "list">(layout);

  useEffect(() => {
    if (!effectiveSiteId) {
      setIsLoading(false);
      return;
    }

    async function fetchData() {
      setIsLoading(true);
      try {
        const data = await getPublicCategories(effectiveSiteId);
        setCategories(data.filter((c) => c.is_active));
      } catch (err) {
        console.error("Error fetching categories:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load categories",
        );
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [effectiveSiteId]);

  // Build tree from flat list
  const categoryTree = useMemo(
    () => buildCategoryTree(categories),
    [categories],
  );

  // Filter by search
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categoryTree;
    const q = searchQuery.toLowerCase();
    return categoryTree.filter(
      (cat) =>
        cat.name.toLowerCase().includes(q) ||
        cat.description?.toLowerCase().includes(q) ||
        cat.children.some((child) => child.name.toLowerCase().includes(q)),
    );
  }, [categoryTree, searchQuery]);

  const gridCols = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  };

  // ── Loading ──
  if (isLoading) {
    return (
      <div className={cn("w-full py-16", className)}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Loading categories...</span>
          </div>
        </div>
      </div>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <div className={cn("w-full py-16", className)}>
        <div className="max-w-6xl mx-auto px-4 text-center">
          <Grid3X3 className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  // ── Empty ──
  if (categories.length === 0) {
    return (
      <div className={cn("w-full py-16", className)}>
        <div className="max-w-6xl mx-auto px-4 text-center">
          <FolderOpen className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">
            No categories yet
          </h2>
          <p className="text-muted-foreground">
            Check back soon — categories will be added shortly.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full py-8 md:py-12", className)}>
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          {title && (
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              {title}
            </h1>
          )}
          {subtitle && (
            <p className="mt-2 text-lg text-muted-foreground">{subtitle}</p>
          )}
        </div>

        {/* Toolbar: search + layout toggle */}
        {(showSearch || true) && (
          <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {showSearch && (
              <div className="relative flex-1 w-full sm:max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={cn(
                    "w-full rounded-lg border bg-background pl-10 pr-4 py-2.5 text-sm",
                    "text-foreground placeholder:text-muted-foreground",
                    "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
                  )}
                />
              </div>
            )}

            <div className="flex items-center gap-1 ml-auto">
              <button
                onClick={() => setActiveLayout("grid")}
                className={cn(
                  "rounded-md p-2 transition-colors",
                  activeLayout === "grid"
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
                aria-label="Grid layout"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setActiveLayout("list")}
                className={cn(
                  "rounded-md p-2 transition-colors",
                  activeLayout === "list"
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
                aria-label="List layout"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Category count */}
        <p className="mb-4 text-sm text-muted-foreground">
          {filteredCategories.length} categor
          {filteredCategories.length === 1 ? "y" : "ies"}
          {searchQuery && ` matching "${searchQuery}"`}
        </p>

        {/* Categories grid / list */}
        {filteredCategories.length === 0 ? (
          <div className="py-12 text-center">
            <Search className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">
              No categories match &ldquo;{searchQuery}&rdquo;
            </p>
          </div>
        ) : activeLayout === "grid" ? (
          <div className={cn("grid gap-6", gridCols[columns])}>
            {filteredCategories.map((cat) => (
              <CategoryGridCard
                key={cat.id}
                category={cat}
                showImage={showImages}
                showDescription={showDescription}
                showProductCount={showProductCount}
                showSubcategories={showSubcategories}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredCategories.map((cat) => (
              <CategoryListRow
                key={cat.id}
                category={cat}
                showImage={showImages}
                showDescription={showDescription}
                showProductCount={showProductCount}
                showSubcategories={showSubcategories}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// STUDIO DEFINITION
// =============================================================================

export const categoriesPageDefinition: Omit<ComponentDefinition, "render"> = {
  type: "EcommerceCategoriesPage",
  label: "Categories Page",
  description:
    "Full-page browsable grid of all product categories with search, images, and subcategories",
  category: "ecommerce",
  icon: "LayoutGrid",
  fields: {
    title: {
      type: "text",
      label: "Page Title",
      defaultValue: "Shop by Category",
    },
    subtitle: {
      type: "text",
      label: "Subtitle",
      defaultValue: "",
    },
    showSearch: {
      type: "toggle",
      label: "Show Search",
      defaultValue: true,
    },
    showSubcategories: {
      type: "toggle",
      label: "Show Subcategories",
      defaultValue: true,
    },
    showProductCount: {
      type: "toggle",
      label: "Show Product Count",
      defaultValue: true,
    },
    showImages: {
      type: "toggle",
      label: "Show Category Images",
      defaultValue: true,
    },
    showDescription: {
      type: "toggle",
      label: "Show Description",
      defaultValue: true,
    },
    layout: {
      type: "select",
      label: "Default Layout",
      options: [
        { label: "Grid", value: "grid" },
        { label: "List", value: "list" },
      ],
      defaultValue: "grid",
    },
    columns: {
      type: "select",
      label: "Grid Columns",
      options: [
        { label: "2 Columns", value: "2" },
        { label: "3 Columns", value: "3" },
        { label: "4 Columns", value: "4" },
      ],
      defaultValue: "3",
    },
  },
  defaultProps: {
    title: "Shop by Category",
    subtitle: "",
    showSearch: true,
    showSubcategories: true,
    showProductCount: true,
    showImages: true,
    showDescription: true,
    layout: "grid",
    columns: 3,
  },
};
