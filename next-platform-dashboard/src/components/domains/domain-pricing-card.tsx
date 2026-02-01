"use client";

import { Check, Star, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { DomainSearchResult } from "@/types/domain";

interface DomainPricingCardProps {
  domain: DomainSearchResult;
  onAddToCart: () => void;
  className?: string;
}

export function DomainPricingCard({
  domain,
  onAddToCart,
  className,
}: DomainPricingCardProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const registerPrice = domain.retailPrices.register[1] || 0;
  const renewPrice = domain.retailPrices.renew[1] || registerPrice;
  const hasDiscount = renewPrice > registerPrice;

  if (!domain.available) {
    return (
      <Card className={cn("opacity-60", className)}>
        <CardContent className="pt-6 text-center">
          <h3 className="font-semibold text-lg">{domain.domain}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            This domain is not available
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("relative overflow-hidden", className)}>
      {domain.premium && (
        <div className="absolute top-0 right-0 bg-amber-500 text-white text-xs font-semibold px-3 py-1 rounded-bl-lg">
          <Star className="h-3 w-3 inline mr-1" />
          Premium
        </div>
      )}

      <CardHeader className="text-center pb-2">
        <CardTitle className="text-lg">{domain.domain}</CardTitle>
        <Badge variant="secondary" className="w-fit mx-auto mt-1">
          <Check className="h-3 w-3 mr-1" />
          Available
        </Badge>
      </CardHeader>

      <CardContent className="text-center space-y-4">
        <div>
          <p className="text-3xl font-bold">
            {formatPrice(registerPrice)}
            <span className="text-sm font-normal text-muted-foreground">/yr</span>
          </p>
          {hasDiscount && (
            <p className="text-xs text-muted-foreground mt-1">
              First year only! Renews at {formatPrice(renewPrice)}/yr
            </p>
          )}
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <div className="flex items-center justify-center gap-2">
            <Check className="h-3 w-3 text-green-500" />
            Free WHOIS Privacy
          </div>
          <div className="flex items-center justify-center gap-2">
            <Check className="h-3 w-3 text-green-500" />
            DNS Management
          </div>
          <div className="flex items-center justify-center gap-2">
            <Check className="h-3 w-3 text-green-500" />
            Auto-Renewal Available
          </div>
        </div>
      </CardContent>

      <CardFooter>
        <Button className="w-full gap-2" onClick={onAddToCart}>
          Add to Cart
          <ArrowRight className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
