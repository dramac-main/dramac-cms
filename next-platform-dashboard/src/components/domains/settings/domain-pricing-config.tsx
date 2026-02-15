"use client";

// src/components/domains/settings/domain-pricing-config.tsx
// Domain Pricing Configuration Form

import { useState } from "react";
import { Save, Percent, Coins, Tag, Loader2 } from "lucide-react";
import { DEFAULT_CURRENCY_SYMBOL } from "@/lib/locale-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { updateAgencyPricingConfig } from "@/lib/actions/domain-billing";
import type { AgencyDomainPricing, PricingMarkupType } from "@/types/domain-pricing";

interface DomainPricingConfigProps {
  config: Partial<AgencyDomainPricing>;
}

export function DomainPricingConfig({ config }: DomainPricingConfigProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [markupType, setMarkupType] = useState<PricingMarkupType>(
    config.default_markup_type || 'percentage'
  );
  const [markupValue, setMarkupValue] = useState(
    String(config.default_markup_value ?? 0)
  );
  const [showWholesale, setShowWholesale] = useState(
    config.show_wholesale_prices || false
  );
  const [billingEnabled, setBillingEnabled] = useState(
    config.billing_enabled || false
  );
  
  const handleSave = async () => {
    setIsLoading(true);
    
    try {
      const result = await updateAgencyPricingConfig({
        default_markup_type: markupType,
        default_markup_value: parseFloat(markupValue) || 0,
        show_wholesale_prices: showWholesale,
        billing_enabled: billingEnabled,
      });
      
      if (result.success) {
        toast.success('Pricing configuration saved');
      } else {
        toast.error(result.error || 'Failed to save configuration');
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Calculate example markup
  const exampleWholesale = 12.99;
  let exampleRetail: number;
  
  switch (markupType) {
    case 'percentage':
      exampleRetail = exampleWholesale * (1 + (parseFloat(markupValue) || 0) / 100);
      break;
    case 'fixed':
      exampleRetail = exampleWholesale + (parseFloat(markupValue) || 0);
      break;
    default:
      exampleRetail = parseFloat(markupValue) || exampleWholesale;
  }
  
  return (
    <div className="space-y-6">
      {/* Default Markup */}
      <Card>
        <CardHeader>
          <CardTitle>Default Pricing Markup</CardTitle>
          <CardDescription>
            Your ResellerClub selling prices already include the profit margin you set in your RC panel.
            This setting adds an <strong>additional</strong> markup on top. Set to 0% to use your RC selling prices exactly as configured.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <RadioGroup 
            value={markupType} 
            onValueChange={(v) => setMarkupType(v as PricingMarkupType)}
          >
            <div className="grid gap-4">
              <div className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="percentage" id="percentage" />
                <div className="flex-1">
                  <Label htmlFor="percentage" className="flex items-center gap-2 cursor-pointer">
                    <Percent className="h-4 w-4 text-blue-500" />
                    Percentage Markup
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Add a percentage on top of ResellerClub selling prices (0% = use RC prices as-is)
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="fixed" id="fixed" />
                <div className="flex-1">
                  <Label htmlFor="fixed" className="flex items-center gap-2 cursor-pointer">
                    <Coins className="h-4 w-4 text-green-500" />
                    Fixed Markup
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Add a fixed currency amount on top of ResellerClub selling prices
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="custom" id="custom" />
                <div className="flex-1">
                  <Label htmlFor="custom" className="flex items-center gap-2 cursor-pointer">
                    <Tag className="h-4 w-4 text-purple-500" />
                    Custom Price
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Set your own retail price regardless of ResellerClub pricing
                  </p>
                </div>
              </div>
            </div>
          </RadioGroup>
          
          <div className="space-y-2">
            <Label>
              {markupType === 'percentage' 
                ? 'Markup Percentage' 
                : markupType === 'fixed'
                  ? `Fixed Amount (${DEFAULT_CURRENCY_SYMBOL})`
                  : `Custom Price (${DEFAULT_CURRENCY_SYMBOL})`}
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={markupValue}
                onChange={(e) => setMarkupValue(e.target.value)}
                className="w-32"
                min="0"
                step={markupType === 'percentage' ? '1' : '0.01'}
              />
              {markupType === 'percentage' && (
                <span className="text-muted-foreground">%</span>
              )}
            </div>
          </div>
          
          {/* Preview */}
          <div className="p-4 bg-muted rounded-lg">
            <h4 className="text-sm font-medium mb-3">Price Preview (example .com domain)</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">RC Selling Price</p>
                <p className="font-semibold text-lg">${exampleWholesale.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Your Final Price</p>
                <p className="font-semibold text-lg text-primary">
                  ${exampleRetail.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Additional Markup</p>
                <p className="font-semibold text-lg text-green-600">
                  ${(exampleRetail - exampleWholesale).toFixed(2)}
                </p>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                {parseFloat(markupValue) === 0 
                  ? 'Prices match your ResellerClub selling prices exactly'
                  : `Additional markup: ${((exampleRetail - exampleWholesale) / exampleWholesale * 100).toFixed(1)}%`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Display Options */}
      <Card>
        <CardHeader>
          <CardTitle>Display Options</CardTitle>
          <CardDescription>
            Control what pricing information is visible to you and your clients
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label className="font-medium">Show Wholesale Prices</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Display wholesale prices alongside retail prices in your dashboard
              </p>
            </div>
            <Switch
              checked={showWholesale}
              onCheckedChange={setShowWholesale}
            />
          </div>
          
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label className="font-medium">Enable Client Billing</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Allow clients to purchase and manage domains directly through the client portal
              </p>
            </div>
            <Switch
              checked={billingEnabled}
              onCheckedChange={setBillingEnabled}
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {isLoading ? 'Saving...' : 'Save Configuration'}
        </Button>
      </div>
    </div>
  );
}
