"use client";

import { useState } from "react";
import { Check, X, Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { InstallLevelBadge } from "@/components/modules/shared/install-level-badge";
import { formatCurrency } from "@/lib/locale-config";
import { toast } from "sonner";

interface Module {
  id: string;
  slug: string;
  name: string;
  icon: string;
  category: string;
  install_level: string;
  status: string;
  pricing_type: string;
  wholesale_price_monthly: number | null;
  wholesale_price_yearly: number | null;
  suggested_retail_monthly: number | null;
  suggested_retail_yearly: number | null;
  lemon_product_id: string | null;
}

interface WholesalePricingTableProps {
  modules: Module[];
}

export function WholesalePricingTable({ modules }: WholesalePricingTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{
    wholesale_monthly: string;
    wholesale_yearly: string;
    suggested_monthly: string;
    suggested_yearly: string;
  }>({
    wholesale_monthly: "",
    wholesale_yearly: "",
    suggested_monthly: "",
    suggested_yearly: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  const startEditing = (module: Module) => {
    setEditingId(module.id);
    setEditValues({
      wholesale_monthly: ((module.wholesale_price_monthly || 0) / 100).toFixed(2),
      wholesale_yearly: ((module.wholesale_price_yearly || 0) / 100).toFixed(2),
      suggested_monthly: ((module.suggested_retail_monthly || 0) / 100).toFixed(2),
      suggested_yearly: ((module.suggested_retail_yearly || 0) / 100).toFixed(2),
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditValues({
      wholesale_monthly: "",
      wholesale_yearly: "",
      suggested_monthly: "",
      suggested_yearly: "",
    });
  };

  const savePrice = async (moduleId: string) => {
    setIsSaving(true);

    try {
      const response = await fetch(`/api/admin/modules/${moduleId}/pricing`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wholesale_price_monthly: Math.round(parseFloat(editValues.wholesale_monthly || "0") * 100),
          wholesale_price_yearly: Math.round(parseFloat(editValues.wholesale_yearly || "0") * 100),
          suggested_retail_monthly: Math.round(parseFloat(editValues.suggested_monthly || "0") * 100),
          suggested_retail_yearly: Math.round(parseFloat(editValues.suggested_yearly || "0") * 100),
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

  const formatPrice = (cents: number | null) => {
    if (!cents || cents === 0) return "Free";
    return formatCurrency(cents / 100);
  };

  if (modules.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg">
        <p className="text-muted-foreground">No modules to display</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Module</TableHead>
            <TableHead>Level</TableHead>
            <TableHead>Wholesale Monthly</TableHead>
            <TableHead>Wholesale Yearly</TableHead>
            <TableHead>Suggested Retail</TableHead>
            <TableHead>LemonSqueezy</TableHead>
            <TableHead className="w-[100px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {modules.map((module) => (
            <TableRow key={module.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{module.icon || "📦"}</span>
                  <div>
                    <p className="font-medium">{module.name}</p>
                    <p className="text-xs text-muted-foreground">{module.category}</p>
                  </div>
                </div>
              </TableCell>
              
              <TableCell>
                <InstallLevelBadge level={module.install_level} />
              </TableCell>
              
              <TableCell>
                {editingId === module.id ? (
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">$</span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editValues.wholesale_monthly}
                      onChange={(e) => setEditValues(v => ({ ...v, wholesale_monthly: e.target.value }))}
                      className="w-20 h-8"
                    />
                    <span className="text-xs text-muted-foreground">/mo</span>
                  </div>
                ) : (
                  <span 
                    className="cursor-pointer hover:text-primary"
                    onClick={() => startEditing(module)}
                  >
                    {formatPrice(module.wholesale_price_monthly)}/mo
                  </span>
                )}
              </TableCell>
              
              <TableCell>
                {editingId === module.id ? (
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">$</span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editValues.wholesale_yearly}
                      onChange={(e) => setEditValues(v => ({ ...v, wholesale_yearly: e.target.value }))}
                      className="w-20 h-8"
                    />
                    <span className="text-xs text-muted-foreground">/yr</span>
                  </div>
                ) : (
                  <span 
                    className="cursor-pointer hover:text-primary text-muted-foreground"
                    onClick={() => startEditing(module)}
                  >
                    {formatPrice(module.wholesale_price_yearly)}/yr
                  </span>
                )}
              </TableCell>
              
              <TableCell>
                {editingId === module.id ? (
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">$</span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editValues.suggested_monthly}
                      onChange={(e) => setEditValues(v => ({ ...v, suggested_monthly: e.target.value }))}
                      className="w-20 h-8"
                    />
                  </div>
                ) : (
                  <span className="text-muted-foreground">
                    {formatPrice(module.suggested_retail_monthly)}
                  </span>
                )}
              </TableCell>
              
              <TableCell>
                {module.lemon_product_id ? (
                  <Badge variant="outline" className="text-green-600 border-green-200">
                    Connected
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground">
                    Not Set
                  </Badge>
                )}
              </TableCell>
              
              <TableCell>
                {editingId === module.id ? (
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => savePrice(module.id)}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4 text-green-600" />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={cancelEditing}
                    >
                      <X className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => startEditing(module)}
                  >
                    Edit
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
