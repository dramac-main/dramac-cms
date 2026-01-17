"use client";

import { useState } from "react";
import { DollarSign, Percent, Edit2, Check, X, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface Subscription {
  id: string;
  module_id: string;
  markup_type: string | null;
  markup_percentage: number | null;
  markup_fixed_amount: number | null;
  custom_price_monthly: number | null;
  retail_price_monthly_cached: number | null;
  module: {
    id: string;
    name: string;
    icon: string;
    install_level: string;
    wholesale_price_monthly: number | null;
  };
}

interface MarkupPricingListProps {
  subscriptions: Subscription[];
}

export function MarkupPricingList({ subscriptions }: MarkupPricingListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({
    markupType: "percentage",
    markupPercentage: "100",
    markupFixed: "0",
    customPrice: "0",
  });
  const [isSaving, setIsSaving] = useState(false);

  const startEditing = (sub: Subscription) => {
    setEditingId(sub.id);
    setEditValues({
      markupType: sub.markup_type || "percentage",
      markupPercentage: String(sub.markup_percentage || 100),
      markupFixed: String((sub.markup_fixed_amount || 0) / 100),
      customPrice: String((sub.custom_price_monthly || 0) / 100),
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
  };

  const saveMarkup = async (subscriptionId: string) => {
    setIsSaving(true);

    try {
      const response = await fetch(`/api/modules/subscriptions/${subscriptionId}/pricing`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          markup_type: editValues.markupType,
          markup_percentage: parseInt(editValues.markupPercentage) || 100,
          markup_fixed_amount: Math.round(parseFloat(editValues.markupFixed) * 100) || 0,
          custom_price_monthly: Math.round(parseFloat(editValues.customPrice) * 100) || null,
        }),
      });

      if (!response.ok) throw new Error("Failed to update pricing");

      toast.success("Pricing updated successfully");
      cancelEditing();
      window.location.reload();
    } catch (error) {
      toast.error("Failed to update pricing");
    } finally {
      setIsSaving(false);
    }
  };

  const calculateRetailPrice = (sub: Subscription): number => {
    const wholesale = (sub.module?.wholesale_price_monthly || 0) / 100;
    
    if (editingId === sub.id) {
      switch (editValues.markupType) {
        case "percentage":
          return wholesale + (wholesale * parseInt(editValues.markupPercentage) / 100);
        case "fixed":
          return wholesale + parseFloat(editValues.markupFixed);
        case "custom":
          return parseFloat(editValues.customPrice) || wholesale;
        case "passthrough":
          return wholesale;
        default:
          return wholesale;
      }
    }

    // Use cached value or calculate from stored values
    if (sub.retail_price_monthly_cached) {
      return sub.retail_price_monthly_cached / 100;
    }

    switch (sub.markup_type) {
      case "percentage":
        return wholesale + (wholesale * (sub.markup_percentage || 100) / 100);
      case "fixed":
        return wholesale + ((sub.markup_fixed_amount || 0) / 100);
      case "custom":
        return (sub.custom_price_monthly || 0) / 100;
      case "passthrough":
        return wholesale;
      default:
        return wholesale * 2;
    }
  };

  return (
    <div className="space-y-4">
      {subscriptions.map((sub) => {
        const wholesale = (sub.module?.wholesale_price_monthly || 0) / 100;
        const retail = calculateRetailPrice(sub);
        const profit = retail - wholesale;
        const isEditing = editingId === sub.id;

        return (
          <Card key={sub.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{sub.module?.icon || "📦"}</span>
                  <div>
                    <CardTitle className="text-lg">{sub.module?.name}</CardTitle>
                    <Badge variant="outline" className="mt-1">
                      {sub.module?.install_level}
                    </Badge>
                  </div>
                </div>
                {!isEditing && (
                  <Button variant="ghost" size="sm" onClick={() => startEditing(sub)}>
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit Pricing
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <div className="space-y-4">
                  {/* Markup Type */}
                  <div className="flex items-center gap-4">
                    <Select
                      value={editValues.markupType}
                      onValueChange={(value) => setEditValues(v => ({ ...v, markupType: value }))}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Markup type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage</SelectItem>
                        <SelectItem value="fixed">Fixed Amount</SelectItem>
                        <SelectItem value="custom">Custom Price</SelectItem>
                        <SelectItem value="passthrough">Passthrough (no markup)</SelectItem>
                      </SelectContent>
                    </Select>

                    {editValues.markupType === "percentage" && (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          max="500"
                          value={editValues.markupPercentage}
                          onChange={(e) => setEditValues(v => ({ ...v, markupPercentage: e.target.value }))}
                          className="w-24"
                        />
                        <span className="text-muted-foreground">% markup</span>
                      </div>
                    )}

                    {editValues.markupType === "fixed" && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">$</span>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={editValues.markupFixed}
                          onChange={(e) => setEditValues(v => ({ ...v, markupFixed: e.target.value }))}
                          className="w-24"
                        />
                        <span className="text-muted-foreground">added</span>
                      </div>
                    )}

                    {editValues.markupType === "custom" && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">$</span>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={editValues.customPrice}
                          onChange={(e) => setEditValues(v => ({ ...v, customPrice: e.target.value }))}
                          className="w-24"
                        />
                        <span className="text-muted-foreground">/mo</span>
                      </div>
                    )}
                  </div>

                  {/* Preview & Actions */}
                  <div className="flex items-center justify-between bg-muted/50 rounded-lg p-4">
                    <div className="space-y-1 text-sm">
                      <div>
                        <span className="text-muted-foreground">Wholesale: </span>
                        <span>${wholesale.toFixed(2)}/mo</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Client pays: </span>
                        <span className="font-medium">${retail.toFixed(2)}/mo</span>
                      </div>
                      <div className="text-green-600">
                        <span>Your profit: </span>
                        <span className="font-medium">${profit.toFixed(2)}/mo</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={cancelEditing}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => saveMarkup(sub.id)}
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4 mr-1" />
                        )}
                        Save
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground">Your Cost</p>
                    <p className="font-medium">${wholesale.toFixed(2)}/mo</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Markup</p>
                    <p className="font-medium">
                      {sub.markup_type === "percentage" && `${sub.markup_percentage || 100}%`}
                      {sub.markup_type === "fixed" && `+$${((sub.markup_fixed_amount || 0) / 100).toFixed(2)}`}
                      {sub.markup_type === "custom" && "Custom"}
                      {sub.markup_type === "passthrough" && "None"}
                      {!sub.markup_type && "100%"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Client Pays</p>
                    <p className="font-medium text-primary">${retail.toFixed(2)}/mo</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Your Profit</p>
                    <p className="font-medium text-green-600">${profit.toFixed(2)}/mo</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
