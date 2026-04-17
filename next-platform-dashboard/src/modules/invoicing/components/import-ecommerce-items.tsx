"use client";

import { useState, useEffect } from "react";
import {
  getEcommerceProducts,
  importEcommerceProducts,
} from "../actions/item-actions";
import { AmountDisplay } from "./amount-display";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ImportEcommerceItemsProps {
  siteId: string;
  onImported?: () => void;
}

export function ImportEcommerceItems({
  siteId,
  onImported,
}: ImportEcommerceItemsProps) {
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState<
    {
      id: string;
      name: string;
      base_price: number;
      sku: string | null;
      description: string | null;
      status: string | null;
    }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    getEcommerceProducts(siteId)
      .then((data) => {
        setProducts(data);
        setSelected(new Set());
        setSearch("");
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [open, siteId]);

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(search.toLowerCase())),
  );

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((p) => p.id)));
    }
  };

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleImport = async () => {
    if (selected.size === 0) return;
    setImporting(true);
    try {
      const result = await importEcommerceProducts(siteId, [...selected]);
      const parts: string[] = [];
      if (result.imported > 0) parts.push(`${result.imported} imported`);
      if (result.skipped > 0) parts.push(`${result.skipped} skipped (duplicate)`);
      if (result.errors.length > 0) parts.push(`${result.errors.length} errors`);
      toast.success(`Import complete: ${parts.join(", ")}`);
      setOpen(false);
      onImported?.();
    } catch {
      toast.error("Failed to import products");
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <ShoppingBag className="h-4 w-4 mr-1.5" />
          Import from E-Commerce
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Import E-Commerce Products</DialogTitle>
          <DialogDescription>
            Select products to add to your invoice items catalog.
            Duplicate SKUs will be skipped.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="pl-9"
          />
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 space-y-1 max-h-[400px] border rounded-md p-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {products.length === 0
                ? "No active e-commerce products found."
                : "No products match your search."}
            </p>
          ) : (
            <>
              <div className="flex items-center gap-2 px-2 py-1 border-b mb-1">
                <Checkbox
                  checked={selected.size === filtered.length && filtered.length > 0}
                  onCheckedChange={toggleAll}
                />
                <span className="text-xs font-medium text-muted-foreground">
                  Select all ({filtered.length})
                </span>
              </div>
              {filtered.map((product) => (
                <label
                  key={product.id}
                  className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-muted cursor-pointer"
                >
                  <Checkbox
                    checked={selected.has(product.id)}
                    onCheckedChange={() => toggle(product.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {product.name}
                    </p>
                    {product.sku && (
                      <p className="text-xs text-muted-foreground">
                        SKU: {product.sku}
                      </p>
                    )}
                  </div>
                  <AmountDisplay amount={product.base_price} />
                </label>
              ))}
            </>
          )}
        </div>

        <DialogFooter>
          <div className="flex items-center justify-between w-full">
            <span className="text-sm text-muted-foreground">
              {selected.size} selected
            </span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleImport}
                disabled={importing || selected.size === 0}
              >
                {importing && (
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                )}
                Import {selected.size > 0 ? `(${selected.size})` : ""}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
