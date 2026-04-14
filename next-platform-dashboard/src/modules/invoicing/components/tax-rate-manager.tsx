"use client";

/**
 * Tax Rate Manager Component — INV-08
 *
 * CRUD interface for managing tax rates.
 * Supports inclusive/exclusive, compound, and default rate selection.
 */

import { useState, useTransition, useEffect } from "react";
import type { TaxRate, CreateTaxRateInput, TaxType } from "../types";
import {
  getTaxRates,
  createTaxRate,
  updateTaxRate,
  deleteTaxRate,
  setDefaultTaxRate,
} from "../actions/tax-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Star, Loader2, Percent } from "lucide-react";
import { toast } from "sonner";

interface TaxRateManagerProps {
  siteId: string;
}

export function TaxRateManager({ siteId }: TaxRateManagerProps) {
  const [taxRates, setTaxRates] = useState<TaxRate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<TaxRate | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [rate, setRate] = useState("");
  const [type, setType] = useState<TaxType>("exclusive");
  const [isCompound, setIsCompound] = useState(false);
  const [isDefault, setIsDefault] = useState(false);
  const [description, setDescription] = useState("");

  const loadRates = async () => {
    try {
      const rates = await getTaxRates(siteId);
      setTaxRates(rates);
    } catch {
      toast.error("Failed to load tax rates");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId]);

  const resetForm = () => {
    setName("");
    setRate("");
    setType("exclusive");
    setIsCompound(false);
    setIsDefault(false);
    setDescription("");
    setEditingRate(null);
  };

  const openCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (tr: TaxRate) => {
    setEditingRate(tr);
    setName(tr.name);
    setRate(String(tr.rate));
    setType(tr.type);
    setIsCompound(tr.isCompound);
    setIsDefault(tr.isDefault);
    setDescription(tr.description || "");
    setDialogOpen(true);
  };

  const handleSave = () => {
    const rateNum = parseFloat(rate);
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (isNaN(rateNum) || rateNum < 0 || rateNum > 100) {
      toast.error("Rate must be between 0 and 100");
      return;
    }

    const input: CreateTaxRateInput = {
      name: name.trim(),
      rate: rateNum,
      type,
      isCompound,
      isDefault,
      description: description.trim() || undefined,
    };

    startTransition(async () => {
      try {
        if (editingRate) {
          await updateTaxRate(siteId, editingRate.id, input);
          toast.success("Tax rate updated");
        } else {
          await createTaxRate(siteId, input);
          toast.success("Tax rate created");
        }
        setDialogOpen(false);
        resetForm();
        await loadRates();
      } catch (err: any) {
        toast.error(err.message || "Failed to save tax rate");
      }
    });
  };

  const handleDelete = (tr: TaxRate) => {
    startTransition(async () => {
      try {
        await deleteTaxRate(siteId, tr.id);
        toast.success(`"${tr.name}" deactivated`);
        await loadRates();
      } catch (err: any) {
        toast.error(err.message || "Failed to delete tax rate");
      }
    });
  };

  const handleSetDefault = (tr: TaxRate) => {
    startTransition(async () => {
      try {
        await setDefaultTaxRate(siteId, tr.id);
        toast.success(`"${tr.name}" set as default`);
        await loadRates();
      } catch (err: any) {
        toast.error(err.message || "Failed to set default");
      }
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading tax rates...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Tax Rates</CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={openCreate}>
              <Plus className="h-4 w-4 mr-1" />
              Add Tax Rate
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingRate ? "Edit Tax Rate" : "Add Tax Rate"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <Label htmlFor="taxName">Name *</Label>
                <Input
                  id="taxName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. VAT 16%"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="taxRate">Rate (%)</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    placeholder="16"
                    min={0}
                    max={100}
                    step={0.01}
                  />
                </div>
                <div>
                  <Label>Type</Label>
                  <Select
                    value={type}
                    onValueChange={(v) => setType(v as TaxType)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="exclusive">
                        Exclusive (added to price)
                      </SelectItem>
                      <SelectItem value="inclusive">
                        Inclusive (included in price)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="isCompound">Compound Tax</Label>
                  <p className="text-xs text-muted-foreground">
                    Applied on top of other taxes
                  </p>
                </div>
                <Switch
                  id="isCompound"
                  checked={isCompound}
                  onCheckedChange={setIsCompound}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="isDefaultTax">Set as Default</Label>
                  <p className="text-xs text-muted-foreground">
                    Auto-applied to new line items
                  </p>
                </div>
                <Switch
                  id="isDefaultTax"
                  checked={isDefault}
                  onCheckedChange={setIsDefault}
                />
              </div>
              <div>
                <Label htmlFor="taxDescription">Description</Label>
                <Input
                  id="taxDescription"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isPending}>
                  {isPending && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  {editingRate ? "Update" : "Create"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {taxRates.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No tax rates configured. Add one to get started.
          </p>
        ) : (
          <div className="space-y-2">
            {taxRates.map((tr) => (
              <div
                key={tr.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    <Percent className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{tr.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {tr.rate}%
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {tr.type}
                      </Badge>
                      {tr.isCompound && (
                        <Badge variant="outline" className="text-xs">
                          compound
                        </Badge>
                      )}
                      {tr.isDefault && (
                        <Badge className="text-xs">default</Badge>
                      )}
                    </div>
                    {tr.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {tr.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {!tr.isDefault && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleSetDefault(tr)}
                      disabled={isPending}
                      title="Set as default"
                    >
                      <Star className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => openEdit(tr)}
                    disabled={isPending}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => handleDelete(tr)}
                    disabled={isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
