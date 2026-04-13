"use client";

import { useState, useEffect, useTransition } from "react";
import type { ExpenseCategory } from "../types/expense-types";
import {
  getExpenseCategories,
  createExpenseCategory,
  updateExpenseCategory,
  deleteExpenseCategory,
} from "../actions/expense-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, Loader2, FolderOpen } from "lucide-react";
import { toast } from "sonner";

const DEFAULT_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4",
  "#3b82f6", "#8b5cf6", "#ec4899", "#6b7280", "#14b8a6",
];

interface ExpenseCategoryManagerProps {
  siteId: string;
}

export function ExpenseCategoryManager({ siteId }: ExpenseCategoryManagerProps) {
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);
  const [isPending, startTransition] = useTransition();

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(DEFAULT_COLORS[0]);
  const [parentId, setParentId] = useState("");

  useEffect(() => {
    loadCategories();
  }, [siteId]);

  async function loadCategories() {
    setLoading(true);
    try {
      const data = await getExpenseCategories(siteId);
      setCategories(data);
    } catch {
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditingCategory(null);
    setName("");
    setDescription("");
    setColor(DEFAULT_COLORS[0]);
    setParentId("");
    setDialogOpen(true);
  }

  function openEdit(cat: ExpenseCategory) {
    setEditingCategory(cat);
    setName(cat.name);
    setDescription(cat.description || "");
    setColor(cat.color || DEFAULT_COLORS[0]);
    setParentId(cat.parentId || "");
    setDialogOpen(true);
  }

  function handleSave() {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }

    startTransition(async () => {
      try {
        if (editingCategory) {
          await updateExpenseCategory(editingCategory.id, {
            name: name.trim(),
            description: description.trim() || null,
            color,
            parentId: parentId || null,
          });
          toast.success("Category updated");
        } else {
          await createExpenseCategory(siteId, {
            name: name.trim(),
            description: description.trim() || null,
            color,
            parentId: parentId || null,
          });
          toast.success("Category created");
        }
        setDialogOpen(false);
        loadCategories();
      } catch (err: any) {
        toast.error(err?.message || "Something went wrong");
      }
    });
  }

  async function handleDelete(catId: string) {
    try {
      await deleteExpenseCategory(catId);
      toast.success("Category deleted");
      loadCategories();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete category");
    }
  }

  // Build tree: top-level categories with children nested
  const topLevel = categories.filter((c) => !c.parentId);
  const childrenOf = (parentId: string) =>
    categories.filter((c) => c.parentId === parentId);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Expense Categories</CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={openCreate}>
              <Plus className="h-4 w-4 mr-1.5" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? "Edit Category" : "New Category"}
              </DialogTitle>
              <DialogDescription>
                {editingCategory
                  ? "Update the expense category details."
                  : "Create a new expense category."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Name *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Office Supplies"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description"
                />
              </div>
              <div>
                <Label>Color</Label>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {DEFAULT_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`h-7 w-7 rounded-full border-2 transition-all ${
                        color === c
                          ? "border-foreground scale-110"
                          : "border-transparent"
                      }`}
                      style={{ backgroundColor: c }}
                      onClick={() => setColor(c)}
                    />
                  ))}
                </div>
              </div>
              <div>
                <Label>Parent Category</Label>
                <Select value={parentId} onValueChange={setParentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="None (top-level)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None (top-level)</SelectItem>
                    {categories
                      .filter((c) => !c.parentId && c.id !== editingCategory?.id)
                      .map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSave} disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                {editingCategory ? "Save Changes" : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {categories.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FolderOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No categories yet. Create your first one.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {topLevel.map((cat) => (
              <div key={cat.id}>
                <CategoryRow
                  category={cat}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  level={0}
                />
                {childrenOf(cat.id).map((child) => (
                  <CategoryRow
                    key={child.id}
                    category={child}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                    level={1}
                  />
                ))}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CategoryRow({
  category,
  onEdit,
  onDelete,
  level,
}: {
  category: ExpenseCategory;
  onEdit: (cat: ExpenseCategory) => void;
  onDelete: (id: string) => void;
  level: number;
}) {
  return (
    <div
      className="flex items-center justify-between py-2 px-2 rounded-md hover:bg-muted/50 group"
      style={{ paddingLeft: `${level * 24 + 8}px` }}
    >
      <div className="flex items-center gap-2">
        <span
          className="h-3 w-3 rounded-full"
          style={{ backgroundColor: category.color }}
        />
        <span className="font-medium text-sm">{category.name}</span>
        {category.description && (
          <span className="text-xs text-muted-foreground">
            — {category.description}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => onEdit(category)}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Category</AlertDialogTitle>
              <AlertDialogDescription>
                Delete &quot;{category.name}&quot;? This cannot be undone. It
                will fail if expenses use this category.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onDelete(category.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
