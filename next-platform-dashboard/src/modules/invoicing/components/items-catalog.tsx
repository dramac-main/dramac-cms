"use client";

import { useState, useEffect } from "react";
import type { Item, ItemType } from "../types";
import type {
  CreateItemInput,
  UpdateItemInput,
  ItemFilters,
} from "../actions/item-actions";
import {
  getItems,
  createItem,
  updateItem,
  deleteItem,
} from "../actions/item-actions";
import { AmountDisplay } from "./amount-display";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ITEM_TYPE_LABELS } from "../lib/invoicing-constants";
import { ImportEcommerceItems } from "./import-ecommerce-items";
import { ImportBookingServices } from "./import-booking-services";

interface ItemsCatalogProps {
  siteId: string;
}

const EMPTY_FORM: CreateItemInput = {
  name: "",
  description: "",
  type: "service",
  unitPrice: 0,
  unit: "",
  sku: "",
  category: "",
};

export function ItemsCatalog({ siteId }: ItemsCatalogProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<CreateItemInput>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadItems = () => {
    setLoading(true);
    getItems(siteId, { search: search || undefined })
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadItems();
  }, [siteId, search]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const handleOpenEdit = (item: Item) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      description: item.description ?? "",
      type: item.type,
      unitPrice: item.unitPrice,
      unit: item.unit ?? "",
      sku: item.sku ?? "",
      category: item.category ?? "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name) return;
    setSaving(true);
    try {
      if (editingId) {
        const updated = await updateItem(siteId, editingId, form);
        if (updated) {
          setItems((prev) =>
            prev.map((i) => (i.id === editingId ? updated : i)),
          );
          toast.success("Item updated");
        }
      } else {
        const created = await createItem(siteId, form);
        if (created) {
          setItems((prev) => [...prev, created]);
          toast.success("Item created");
        }
      }
      setDialogOpen(false);
    } catch {
      toast.error("Failed to save item");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (itemId: string) => {
    try {
      await deleteItem(siteId, itemId);
      setItems((prev) => prev.filter((i) => i.id !== itemId));
      toast.success("Item deleted");
    } catch {
      toast.error("Failed to delete item");
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Items Catalog</h2>
          <p className="text-sm text-muted-foreground">
            Reusable items for invoices — products, services, and expenses.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ImportEcommerceItems siteId={siteId} onImported={loadItems} />
          <ImportBookingServices siteId={siteId} onImported={loadItems} />
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenCreate}>
              <Plus className="h-4 w-4 mr-1.5" />
              New Item
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Item" : "New Item"}</DialogTitle>
              <DialogDescription>
                {editingId
                  ? "Update item details."
                  : "Create a reusable item for invoices."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label htmlFor="item-name">Name *</Label>
                <Input
                  id="item-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Item name"
                />
              </div>
              <div>
                <Label htmlFor="item-desc">Description</Label>
                <Textarea
                  id="item-desc"
                  value={form.description ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  rows={2}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Type</Label>
                  <Select
                    value={form.type}
                    onValueChange={(v) =>
                      setForm({ ...form, type: v as ItemType })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="service">Service</SelectItem>
                      <SelectItem value="product">Product</SelectItem>
                      <SelectItem value="expense">Expense</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="item-price">Unit Price (cents)</Label>
                  <Input
                    id="item-price"
                    type="number"
                    min={0}
                    value={form.unitPrice}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        unitPrice: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <Label htmlFor="item-unit">Unit</Label>
                  <Input
                    id="item-unit"
                    value={form.unit ?? ""}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    placeholder="e.g., hour, piece"
                  />
                </div>
                <div>
                  <Label htmlFor="item-sku">SKU</Label>
                  <Input
                    id="item-sku"
                    value={form.sku ?? ""}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="item-category">Category</Label>
                  <Input
                    id="item-category"
                    value={form.category ?? ""}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value })
                    }
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving || !form.name}>
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
                {editingId ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search items..."
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-12 text-muted-foreground"
                >
                  No items found. Create your first item to get started.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <p className="font-medium">{item.name}</p>
                    {item.description && (
                      <p className="text-xs text-muted-foreground truncate max-w-xs">
                        {item.description}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {ITEM_TYPE_LABELS[item.type] ?? item.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.sku ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.category ?? "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <AmountDisplay amount={item.unitPrice} />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenEdit(item)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete item?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will deactivate &quot;{item.name}&quot;.
                              Existing invoices using this item will not be
                              affected.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(item.id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
