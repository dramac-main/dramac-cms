"use client";

import { Globe, Check, X, Star, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { DomainSearchResult } from "@/types/domain";

import { DEFAULT_LOCALE, DEFAULT_CURRENCY } from '@/lib/locale-config'
interface DomainResultsProps {
  results: DomainSearchResult[];
  onSelect: (domain: DomainSearchResult) => void;
  isLoading?: boolean;
  className?: string;
}

export function DomainResults({
  results,
  onSelect,
  isLoading,
  className,
}: DomainResultsProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(DEFAULT_LOCALE, {
      style: 'currency',
      currency: DEFAULT_CURRENCY,
    }).format(price);
  };

  if (isLoading) {
    return (
      <div className={cn("space-y-3", className)}>
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-muted" />
                  <div className="space-y-2">
                    <div className="h-5 w-40 bg-muted rounded" />
                    <div className="h-3 w-24 bg-muted rounded" />
                  </div>
                </div>
                <div className="h-10 w-28 bg-muted rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className={cn("text-center py-12", className)}>
        <Globe className="h-16 w-16 mx-auto text-muted-foreground" />
        <h3 className="mt-4 text-lg font-medium">No results</h3>
        <p className="text-muted-foreground mt-1">
          Search for domains to see availability
        </p>
      </div>
    );
  }

  const availableCount = results.filter(r => r.available).length;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">
          {availableCount} available of {results.length} checked
        </h3>
        {availableCount > 0 && (
          <Badge variant="secondary" className="bg-green-500/10 text-green-600">
            <Check className="h-3 w-3 mr-1" />
            {availableCount} Available
          </Badge>
        )}
      </div>

      <div className="grid gap-3">
        {results.map(result => (
          <Card
            key={result.domain}
            className={cn(
              "transition-all",
              result.available
                ? "border-green-500/50 hover:border-green-500 hover:shadow-md cursor-pointer"
                : "opacity-60"
            )}
            onClick={() => result.available && onSelect(result)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {result.available ? (
                    <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                      <Check className="h-5 w-5 text-green-500" />
                    </div>
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      <X className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-lg">{result.domain}</span>
                      {result.premium && (
                        <Badge variant="secondary" className="gap-1">
                          <Star className="h-3 w-3 fill-current" />
                          Premium
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {result.available ? 'Available for registration' : 'Already registered'}
                    </p>
                  </div>
                </div>

                {result.available && (
                  <div className="text-right flex items-center gap-4">
                    <div>
                      <p className="font-bold text-xl">
                        {formatPrice(result.retailPrices.register[1] || 0)}
                        <span className="text-sm font-normal text-muted-foreground">/yr</span>
                      </p>
                      {result.retailPrices.renew[1] && 
                       result.retailPrices.renew[1] !== result.retailPrices.register[1] && (
                        <p className="text-xs text-muted-foreground">
                          Renews at {formatPrice(result.retailPrices.renew[1])}/yr
                        </p>
                      )}
                    </div>
                    <Button size="sm" className="gap-2">
                      <ShoppingCart className="h-4 w-4" />
                      Add
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
