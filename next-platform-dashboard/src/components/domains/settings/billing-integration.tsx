"use client";

// src/components/domains/settings/billing-integration.tsx
// Paddle Billing Integration for Domain Services

import { useState } from "react";
import { Save, CreditCard, CircleCheck, AlertCircle, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { updateAgencyPricingConfig } from "@/lib/actions/domain-billing";
import type { AgencyDomainPricing } from "@/types/domain-pricing";

interface BillingIntegrationProps {
  config: Partial<AgencyDomainPricing>;
}

export function BillingIntegration({ config }: BillingIntegrationProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [productId, setProductId] = useState(config.paddle_product_id || '');
  const [priceId, setPriceId] = useState(config.paddle_price_id || '');
  
  const isConfigured = Boolean(productId && priceId);
  
  const handleSave = async () => {
    setIsLoading(true);
    
    try {
      const result = await updateAgencyPricingConfig({
        paddle_product_id: productId || null,
        paddle_price_id: priceId || null,
      });
      
      if (result.success) {
        toast.success('Billing integration settings saved');
      } else {
        toast.error(result.error || 'Failed to save settings');
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Paddle Billing Integration
          </CardTitle>
          <CardDescription>
            Connect Paddle to process domain payments automatically
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 p-4 rounded-lg bg-muted">
            {isConfigured ? (
              <>
                <CircleCheck className="h-8 w-8 text-green-500" />
                <div>
                  <p className="font-medium text-green-700 dark:text-green-400">
                    Billing Configured
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Paddle integration is set up and ready to process payments
                  </p>
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="h-8 w-8 text-amber-500" />
                <div>
                  <p className="font-medium text-amber-700 dark:text-amber-400">
                    Not Configured
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Add your Paddle product and price IDs to enable automatic billing
                  </p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Paddle Configuration</CardTitle>
          <CardDescription>
            Enter your Paddle product and price IDs for domain services
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Setup Required</AlertTitle>
            <AlertDescription>
              Create a &quot;Domain Services&quot; product in your Paddle dashboard, then copy the IDs here.
              <Button variant="link" className="px-1 h-auto" asChild>
                <a href="https://vendors.paddle.com/products" target="_blank" rel="noopener noreferrer">
                  Open Paddle Dashboard <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </Button>
            </AlertDescription>
          </Alert>
          
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="productId">Product ID</Label>
              <Input
                id="productId"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                placeholder="pro_01h..."
              />
              <p className="text-sm text-muted-foreground">
                The Paddle product ID for domain services
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="priceId">Price ID</Label>
              <Input
                id="priceId"
                value={priceId}
                onChange={(e) => setPriceId(e.target.value)}
                placeholder="pri_01h..."
              />
              <p className="text-sm text-muted-foreground">
                The Paddle price ID (usually a one-time payment type)
              </p>
            </div>
          </div>
          
          {isConfigured && (
            <div className="p-4 border rounded-lg">
              <h4 className="text-sm font-medium mb-2">Current Configuration</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Product</Badge>
                  <code className="text-xs bg-muted px-2 py-1 rounded">
                    {productId}
                  </code>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Price</Badge>
                  <code className="text-xs bg-muted px-2 py-1 rounded">
                    {priceId}
                  </code>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle>How Billing Works</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-3 text-sm text-muted-foreground">
            <li>
              Client searches for and selects a domain to register
            </li>
            <li>
              At checkout, they pay using Paddle (credit card, PayPal, etc.)
            </li>
            <li>
              DRAMAC receives the wholesale amount, you receive the markup
            </li>
            <li>
              Domain is automatically registered through the provider
            </li>
            <li>
              A billing record is created for your accounting
            </li>
          </ol>
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
          {isLoading ? 'Saving...' : 'Save Billing Settings'}
        </Button>
      </div>
    </div>
  );
}
