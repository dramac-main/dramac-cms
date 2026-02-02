"use client";

// src/components/domains/settings/markup-calculator.tsx
// Real-time Markup Preview Calculator

import { useState } from "react";
import { Calculator, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TldPricingConfig, PricingMarkupType } from "@/types/domain-pricing";

interface MarkupCalculatorProps {
  tldConfig: TldPricingConfig;
  defaultMarkupType: PricingMarkupType;
  defaultMarkupValue: number;
}

// Simulated wholesale prices
const WHOLESALE_PRICES: Record<string, number> = {
  '.com': 9.99,
  '.net': 11.99,
  '.org': 10.99,
  '.io': 35.99,
  '.co': 25.99,
  '.app': 15.99,
  '.dev': 13.99,
};

export function MarkupCalculator({ 
  tldConfig, 
  defaultMarkupType, 
  defaultMarkupValue 
}: MarkupCalculatorProps) {
  const [selectedTld, setSelectedTld] = useState('.com');
  const [customWholesale, setCustomWholesale] = useState<string>('');
  
  const wholesale = customWholesale 
    ? parseFloat(customWholesale) || 0
    : WHOLESALE_PRICES[selectedTld] || 12.99;
  
  // Get effective pricing for this TLD
  const tldSettings = tldConfig[selectedTld];
  const markupType = tldSettings?.markup_type || defaultMarkupType;
  const markupValue = tldSettings?.markup_value ?? defaultMarkupValue;
  const isCustomTld = Boolean(tldSettings);
  
  // Calculate retail price
  let retail: number;
  switch (markupType) {
    case 'percentage':
      retail = wholesale * (1 + markupValue / 100);
      break;
    case 'fixed':
      retail = wholesale + markupValue;
      break;
    case 'custom':
      retail = markupValue;
      break;
    default:
      retail = wholesale * 1.3;
  }
  
  const profit = retail - wholesale;
  const profitMargin = retail > 0 ? (profit / retail) * 100 : 0;
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Markup Calculator
        </CardTitle>
        <CardDescription>
          Preview pricing for any TLD based on your current configuration
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Input Controls */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Select TLD</Label>
            <Select value={selectedTld} onValueChange={(v) => {
              setSelectedTld(v);
              setCustomWholesale('');
            }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(WHOLESALE_PRICES).map(tld => (
                  <SelectItem key={tld} value={tld}>
                    {tld} ({formatPrice(WHOLESALE_PRICES[tld])})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Custom Wholesale (optional)</Label>
            <Input
              type="number"
              value={customWholesale}
              onChange={(e) => setCustomWholesale(e.target.value)}
              placeholder={String(WHOLESALE_PRICES[selectedTld] || 12.99)}
              step="0.01"
              min="0"
            />
          </div>
        </div>
        
        {/* Pricing Info */}
        <div className="p-4 bg-muted rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="font-medium">Pricing for {selectedTld}</span>
            {isCustomTld && (
              <span className="text-xs text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-300 px-2 py-1 rounded">
                Custom pricing applied
              </span>
            )}
          </div>
          
          <div className="text-sm text-muted-foreground mb-2">
            {markupType === 'percentage' 
              ? `${markupValue}% markup`
              : markupType === 'fixed'
                ? `+${formatPrice(markupValue)} fixed markup`
                : `${formatPrice(markupValue)} custom price`}
          </div>
        </div>
        
        {/* Price Breakdown */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Wholesale</p>
            <p className="text-2xl font-bold">{formatPrice(wholesale)}</p>
            <p className="text-xs text-muted-foreground">Your cost</p>
          </div>
          
          <div className="text-center p-4 bg-primary/10 rounded-lg border-2 border-primary/20">
            <p className="text-sm text-muted-foreground mb-1">Retail</p>
            <p className="text-2xl font-bold text-primary">{formatPrice(retail)}</p>
            <p className="text-xs text-muted-foreground">Client pays</p>
          </div>
          
          <div className="text-center p-4 bg-green-500/10 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Profit</p>
            <p className="text-2xl font-bold text-green-600">{formatPrice(profit)}</p>
            <p className="text-xs text-muted-foreground">{profitMargin.toFixed(1)}% margin</p>
          </div>
        </div>
        
        {/* Annual Projection */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Annual Projection (per domain)
          </h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Cost (1 year)</p>
              <p className="font-semibold">{formatPrice(wholesale)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Revenue (1 year)</p>
              <p className="font-semibold">{formatPrice(retail)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Profit (1 year)</p>
              <p className="font-semibold text-green-600">{formatPrice(profit)}</p>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-muted rounded text-sm">
            <p className="font-medium">10 domains = {formatPrice(profit * 10)}/year profit</p>
            <p className="text-muted-foreground text-xs mt-1">
              50 domains = {formatPrice(profit * 50)}/year | 100 domains = {formatPrice(profit * 100)}/year
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
