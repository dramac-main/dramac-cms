"use client";

import { useState } from "react";
import { Trash2, ShoppingCart, Shield, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import type { DomainCartItem, DomainCart } from "@/types/domain";

import { DEFAULT_LOCALE, DEFAULT_CURRENCY } from '@/lib/locale-config'
interface DomainCartProps {
  items: DomainCartItem[];
  onUpdateItem: (index: number, updates: Partial<DomainCartItem>) => void;
  onRemoveItem: (index: number) => void;
  onCheckout: () => void;
  className?: string;
}

export function DomainCartComponent({
  items,
  onUpdateItem,
  onRemoveItem,
  onCheckout,
  className,
}: DomainCartProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(DEFAULT_LOCALE, {
      style: 'currency',
      currency: DEFAULT_CURRENCY,
    }).format(price);
  };
  
  /** Get the correct retail price for the given year count.
   *  Looks up retailPrices[years] first (exact multi-year price from RC API),
   *  then falls back to retailPrices[1] * years if not available. */
  const getRetailForYears = (item: DomainCartItem): number => {
    if (item.retailPrices?.[item.years]) {
      return item.retailPrices[item.years];
    }
    // Fallback: multiply 1-year price by years
    const perYear = item.retailPrices?.[1] || item.retailPrice || 0;
    return Math.round(perYear * item.years * 100) / 100;
  };

  const calculateTotals = (): DomainCart => {
    let subtotal = 0;
    
    items.forEach(item => {
      subtotal += getRetailForYears(item);
      if (item.privacy) {
        subtotal += item.privacyPrice * item.years;
      }
    });
    
    const tax = 0; // Would calculate based on location
    const total = subtotal + tax;
    
    return {
      items,
      subtotal,
      tax,
      total,
      currency: DEFAULT_CURRENCY,
    };
  };
  
  const cart = calculateTotals();
  
  const handleCheckout = async () => {
    setIsLoading(true);
    try {
      await onCheckout();
    } finally {
      setIsLoading(false);
    }
  };
  
  if (items.length === 0) {
    return (
      <Card className={cn("text-center py-12", className)}>
        <CardContent>
          <ShoppingCart className="h-16 w-16 mx-auto text-muted-foreground" />
          <h3 className="mt-4 text-xl font-medium">Your cart is empty</h3>
          <p className="text-muted-foreground mt-2">
            Search for domains to add them to your cart
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className={cn("space-y-6", className)}>
      {/* Cart Items */}
      <div className="space-y-4">
        {items.map((item, index) => (
          <Card key={item.domainName}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-lg">{item.domainName}</h4>
                  <p className="text-sm text-muted-foreground capitalize">
                    {item.type === 'registration' ? 'New Registration' : item.type}
                  </p>
                </div>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => onRemoveItem(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Years Selection */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    Registration Period
                  </Label>
                  <Select
                    value={String(item.years)}
                    onValueChange={(value) => onUpdateItem(index, { years: Number(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 5, 10].map(yr => {
                        // Only show year options that have pricing data
                        const hasPrice = item.retailPrices?.[yr] || yr === 1;
                        if (!hasPrice && yr > 1) return null;
                        // Calculate real savings vs 1yr * N
                        const perYear1 = item.retailPrices?.[1] || item.retailPrice || 0;
                        const linearPrice = perYear1 * yr;
                        const actualPrice = item.retailPrices?.[yr] || linearPrice;
                        const savings = linearPrice > 0 ? Math.round((1 - actualPrice / linearPrice) * 100) : 0;
                        return (
                          <SelectItem key={yr} value={String(yr)}>
                            {yr} Year{yr > 1 ? 's' : ''}{savings > 0 ? ` (Save ${savings}%)` : ''}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Privacy Protection */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    WHOIS Privacy Protection
                  </Label>
                  <div className="flex items-center justify-between p-3 border rounded-md bg-muted/50">
                    <div className="flex-1">
                      <span className="text-sm font-medium">
                        {item.privacyPrice === 0 ? 'FREE' : formatPrice(item.privacyPrice) + '/yr'}
                      </span>
                      <p className="text-xs text-muted-foreground">
                        Hide your contact info from WHOIS
                      </p>
                    </div>
                    <Switch
                      checked={item.privacy}
                      onCheckedChange={(checked) => onUpdateItem(index, { privacy: checked })}
                    />
                  </div>
                </div>
              </div>
              
              {/* Item Price */}
              <div className="mt-6 pt-4 border-t flex justify-between items-center">
                <span className="text-muted-foreground">Subtotal for {item.years} year{item.years > 1 ? 's' : ''}</span>
                <span className="font-semibold text-lg">
                  {formatPrice(
                    getRetailForYears(item) + (item.privacy ? item.privacyPrice * item.years : 0)
                  )}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Cart Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Order Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Domains ({items.length})</span>
            <span>{formatPrice(cart.subtotal)}</span>
          </div>
          
          {cart.tax > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax</span>
              <span>{formatPrice(cart.tax)}</span>
            </div>
          )}
          
          <Separator />
          
          <div className="flex justify-between font-semibold text-lg">
            <span>Total</span>
            <span>{formatPrice(cart.total)}</span>
          </div>
        </CardContent>
        <CardFooter className="flex-col gap-4">
          <Button 
            className="w-full" 
            size="lg"
            onClick={handleCheckout}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : 'Proceed to Checkout'}
          </Button>
          
          <Alert className="bg-muted/50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              By completing this purchase, you agree to the domain registration terms and conditions.
            </AlertDescription>
          </Alert>
        </CardFooter>
      </Card>
      
      {/* Trust Badges */}
      <div className="grid grid-cols-3 gap-4 text-center text-xs text-muted-foreground">
        <div className="p-4 rounded-lg border bg-muted/30">
          <Shield className="h-8 w-8 mx-auto mb-2 text-green-500" />
          <span className="font-medium">Secure Checkout</span>
        </div>
        <div className="p-4 rounded-lg border bg-muted/30">
          <Clock className="h-8 w-8 mx-auto mb-2 text-blue-500" />
          <span className="font-medium">Instant Activation</span>
        </div>
        <div className="p-4 rounded-lg border bg-muted/30">
          <ShoppingCart className="h-8 w-8 mx-auto mb-2 text-purple-500" />
          <span className="font-medium">Money Back Guarantee</span>
        </div>
      </div>
    </div>
  );
}
