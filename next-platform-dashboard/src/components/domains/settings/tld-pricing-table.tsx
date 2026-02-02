"use client";

// src/components/domains/settings/tld-pricing-table.tsx
// TLD-specific Pricing Configuration Table

import { useState } from "react";
import { Search, Edit2, Check, X, Settings2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { updateAgencyPricingConfig } from "@/lib/actions/domain-billing";
import type { TldPricingConfig, TldPricingEntry, PricingMarkupType } from "@/types/domain-pricing";

interface TldPricingTableProps {
  currentConfig: TldPricingConfig;
  defaultMarkupType: PricingMarkupType;
  defaultMarkupValue: number;
  onUpdate: () => void;
}

// Popular TLDs with simulated wholesale prices
const TLD_DATA: Record<string, { wholesale: number; description: string }> = {
  '.com': { wholesale: 9.99, description: 'Most popular TLD' },
  '.net': { wholesale: 11.99, description: 'Network/tech sites' },
  '.org': { wholesale: 10.99, description: 'Organizations' },
  '.io': { wholesale: 35.99, description: 'Tech startups' },
  '.co': { wholesale: 25.99, description: 'Companies/Colombia' },
  '.app': { wholesale: 15.99, description: 'Applications' },
  '.dev': { wholesale: 13.99, description: 'Developers' },
  '.xyz': { wholesale: 8.99, description: 'Generic' },
  '.online': { wholesale: 5.99, description: 'Online presence' },
  '.store': { wholesale: 12.99, description: 'E-commerce' },
  '.tech': { wholesale: 14.99, description: 'Technology' },
  '.ai': { wholesale: 79.99, description: 'AI companies' },
};

export function TldPricingTable({ 
  currentConfig, 
  defaultMarkupType,
  defaultMarkupValue,
  onUpdate 
}: TldPricingTableProps) {
  const [search, setSearch] = useState("");
  const [editingTld, setEditingTld] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<TldPricingEntry | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const tlds = Object.keys(TLD_DATA);
  const filteredTlds = tlds.filter(tld => 
    tld.toLowerCase().includes(search.toLowerCase())
  );
  
  const startEdit = (tld: string) => {
    const config = currentConfig[tld] || {
      markup_type: defaultMarkupType,
      markup_value: defaultMarkupValue,
      enabled: true,
    };
    setEditingTld(tld);
    setEditValues({ ...config });
  };
  
  const cancelEdit = () => {
    setEditingTld(null);
    setEditValues(null);
  };
  
  const saveEdit = async () => {
    if (!editingTld || !editValues) return;
    
    setIsLoading(true);
    try {
      const newConfig = {
        ...currentConfig,
        [editingTld]: editValues,
      };
      
      const result = await updateAgencyPricingConfig({
        tld_pricing: newConfig,
      });
      
      if (result.success) {
        toast.success(`Pricing for ${editingTld} updated`);
        onUpdate();
      } else {
        toast.error(result.error || 'Failed to update');
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setIsLoading(false);
      setEditingTld(null);
      setEditValues(null);
    }
  };
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };
  
  const calculateRetail = (wholesale: number, tld: string) => {
    const config = currentConfig[tld];
    const type = config?.markup_type || defaultMarkupType;
    const value = config?.markup_value ?? defaultMarkupValue;
    
    switch (type) {
      case 'percentage':
        return wholesale * (1 + value / 100);
      case 'fixed':
        return wholesale + value;
      case 'custom':
        return value;
      default:
        return wholesale * 1.3;
    }
  };
  
  const isCustomized = (tld: string) => {
    return tld in currentConfig;
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search TLDs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Settings2 className="h-4 w-4" />
          <span>{Object.keys(currentConfig).length} customized</span>
        </div>
      </div>
      
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-24">TLD</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Wholesale</TableHead>
              <TableHead className="text-right">Markup</TableHead>
              <TableHead className="text-right">Retail</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="w-24 text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTlds.map(tld => {
              const tldInfo = TLD_DATA[tld];
              const wholesale = tldInfo.wholesale;
              const config = currentConfig[tld];
              const isEditing = editingTld === tld;
              
              return (
                <TableRow key={tld} className={isCustomized(tld) ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''}>
                  <TableCell className="font-mono font-medium">
                    {tld}
                    {isCustomized(tld) && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        Custom
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {tldInfo.description}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatPrice(wholesale)}
                  </TableCell>
                  
                  {isEditing && editValues ? (
                    <>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Select
                            value={editValues.markup_type}
                            onValueChange={(v) => setEditValues({ 
                              ...editValues, 
                              markup_type: v as PricingMarkupType 
                            })}
                          >
                            <SelectTrigger className="w-20 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="percentage">%</SelectItem>
                              <SelectItem value="fixed">$+</SelectItem>
                              <SelectItem value="custom">$</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            type="number"
                            value={editValues.markup_value}
                            onChange={(e) => setEditValues({
                              ...editValues,
                              markup_value: parseFloat(e.target.value) || 0,
                            })}
                            className="w-20 h-8"
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-primary">
                        {formatPrice(
                          editValues.markup_type === 'custom'
                            ? editValues.markup_value
                            : editValues.markup_type === 'percentage'
                              ? wholesale * (1 + editValues.markup_value / 100)
                              : wholesale + editValues.markup_value
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={editValues.enabled}
                          onCheckedChange={(checked) => setEditValues({
                            ...editValues,
                            enabled: checked,
                          })}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            onClick={saveEdit}
                            disabled={isLoading}
                            className="h-8 w-8"
                          >
                            <Check className="h-4 w-4 text-green-500" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            onClick={cancelEdit}
                            disabled={isLoading}
                            className="h-8 w-8"
                          >
                            <X className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell className="text-right">
                        {config ? (
                          <span className="font-mono">
                            {config.markup_type === 'percentage' 
                              ? `${config.markup_value}%`
                              : config.markup_type === 'fixed'
                                ? `+${formatPrice(config.markup_value)}`
                                : formatPrice(config.markup_value)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            Default ({defaultMarkupType === 'percentage' ? `${defaultMarkupValue}%` : formatPrice(defaultMarkupValue)})
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono text-primary font-medium">
                        {formatPrice(calculateRetail(wholesale, tld))}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge 
                          variant={config?.enabled === false ? 'secondary' : 'default'}
                          className={config?.enabled === false ? '' : 'bg-green-500'}
                        >
                          {config?.enabled === false ? 'Disabled' : 'Active'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button 
                          size="icon" 
                          variant="ghost"
                          onClick={() => startEdit(tld)}
                          className="h-8 w-8"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      
      {filteredTlds.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No TLDs found matching &quot;{search}&quot;
        </div>
      )}
    </div>
  );
}
