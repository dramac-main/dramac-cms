"use client";

// src/app/(dashboard)/admin/domains/pricing/pricing-client.tsx
// Super Admin — Platform Pricing Controls Client Component

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Coins,
  Percent,
  Save,
  Loader2,
  AlertCircle,
  ShieldCheck,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  updatePlatformPricingConfig,
  type PlatformPricingConfig,
} from "@/lib/actions/admin-domains";
import { DEFAULT_CURRENCY_SYMBOL } from "@/lib/locale-config";

interface PlatformPricingClientProps {
  initialConfig: PlatformPricingConfig;
}

export function PlatformPricingClient({
  initialConfig,
}: PlatformPricingClientProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [applyMarkup, setApplyMarkup] = useState(
    initialConfig.apply_platform_markup
  );
  const [markupType, setMarkupType] = useState<"percentage" | "fixed">(
    initialConfig.default_markup_type
  );
  const [markupValue, setMarkupValue] = useState(
    String(initialConfig.default_markup_value)
  );

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const result = await updatePlatformPricingConfig({
        apply_platform_markup: applyMarkup,
        default_markup_type: markupType,
        default_markup_value: parseFloat(markupValue) || 0,
      });

      if (result.success) {
        toast.success("Platform pricing updated");
      } else {
        toast.error(result.error || "Failed to update pricing");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Example calculation
  const exampleSupplierPrice = 12.99;
  const numericMarkup = parseFloat(markupValue) || 0;
  let exampleFinal: number;
  if (!applyMarkup) {
    exampleFinal = exampleSupplierPrice;
  } else if (markupType === "percentage") {
    exampleFinal =
      exampleSupplierPrice * (1 + numericMarkup / 100);
  } else {
    exampleFinal = exampleSupplierPrice + numericMarkup;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/domains">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Coins className="h-6 w-6" />
            Platform Pricing Controls
          </h1>
          <p className="text-muted-foreground">
            These settings affect pricing across all agencies on the platform
          </p>
        </div>
        <Badge variant="destructive" className="ml-auto">
          <ShieldCheck className="h-3 w-3 mr-1" />
          Super Admin Only
        </Badge>
      </div>

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>How Pricing Layers Work</AlertTitle>
        <AlertDescription>
          Your ResellerClub panel already has a profit margin configured (e.g.
          100% = 2× cost). The supplier selling prices returned by the API
          already include that margin. This setting adds an{" "}
          <strong>additional</strong> markup on top. When disabled, agencies
          see exactly the prices from your supplier panel.
        </AlertDescription>
      </Alert>

      {/* Platform Markup Toggle */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Platform Markup</CardTitle>
          <CardDescription>
            Enable to add an extra markup layer on top of supplier selling
            prices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label className="font-medium text-base">
                Enable Platform Markup
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                When OFF, prices match your supplier panel exactly. When ON,
                the markup below is applied to all domain and email prices.
              </p>
            </div>
            <Switch checked={applyMarkup} onCheckedChange={setApplyMarkup} />
          </div>
        </CardContent>
      </Card>

      {/* Markup Configuration */}
      {applyMarkup && (
        <Card>
          <CardHeader>
            <CardTitle>Markup Configuration</CardTitle>
            <CardDescription>
              Choose how the additional platform markup is calculated
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <RadioGroup
              value={markupType}
              onValueChange={(v) =>
                setMarkupType(v as "percentage" | "fixed")
              }
            >
              <div className="grid gap-4">
                <div className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="percentage" id="pct" />
                  <div className="flex-1">
                    <Label
                      htmlFor="pct"
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Percent className="h-4 w-4 text-blue-500" />
                      Percentage Markup
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Add a percentage on top of supplier selling prices
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <RadioGroupItem value="fixed" id="fixed" />
                  <div className="flex-1">
                    <Label
                      htmlFor="fixed"
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Coins className="h-4 w-4 text-green-500" />
                      Fixed Markup
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Add a fixed currency amount on top of supplier selling
                      prices
                    </p>
                  </div>
                </div>
              </div>
            </RadioGroup>

            <div className="space-y-2">
              <Label>
                {markupType === "percentage"
                  ? "Markup Percentage"
                  : `Fixed Amount (${DEFAULT_CURRENCY_SYMBOL})`}
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={markupValue}
                  onChange={(e) => setMarkupValue(e.target.value)}
                  className="w-32"
                  min="0"
                  step={markupType === "percentage" ? "1" : "0.01"}
                />
                {markupType === "percentage" && (
                  <span className="text-muted-foreground">%</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Price Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Price Preview</CardTitle>
          <CardDescription>
            Example with a $12.99 supplier selling price
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">
                Supplier Selling Price
              </p>
              <p className="text-2xl font-bold">
                ${exampleSupplierPrice.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">
                Already includes RC margin
              </p>
            </div>
            <div className="text-center p-4 bg-primary/10 rounded-lg border-2 border-primary/20">
              <p className="text-sm text-muted-foreground mb-1">
                Platform Price
              </p>
              <p className="text-2xl font-bold text-primary">
                ${exampleFinal.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">
                What agencies & clients pay
              </p>
            </div>
            <div className="text-center p-4 bg-green-500/10 rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">
                Extra Profit
              </p>
              <p className="text-2xl font-bold text-green-600">
                ${(exampleFinal - exampleSupplierPrice).toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">
                {applyMarkup
                  ? `${(
                      ((exampleFinal - exampleSupplierPrice) /
                        exampleSupplierPrice) *
                      100
                    ).toFixed(1)}% additional`
                  : "No extra markup"}
              </p>
            </div>
          </div>
          {!applyMarkup && (
            <p className="text-sm text-muted-foreground mt-3 text-center">
              Platform markup is disabled — prices match your supplier panel
              exactly
            </p>
          )}
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {isLoading ? "Saving..." : "Save Platform Pricing"}
        </Button>
      </div>
    </div>
  );
}
