"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, Globe, Check, X, Star, ShoppingCart, RefreshCw, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { searchDomains } from "@/lib/actions/domains";
import { TLD_CATEGORIES } from "@/lib/resellerclub/config";
import type { DomainSearchResult } from "@/types/domain";

import { DEFAULT_LOCALE, DEFAULT_CURRENCY } from '@/lib/locale-config'

const POPULAR_TLDS = [...TLD_CATEGORIES.popular];
const ALL_CATEGORY_ENTRIES = Object.entries(TLD_CATEGORIES).filter(([key]) => key !== 'popular') as [string, readonly string[]][];

const CATEGORY_LABELS: Record<string, string> = {
  business: '💼 Business',
  tech: '💻 Tech',
  creative: '🎨 Creative',
  country: '🌍 Country',
  africa: '🌍 Africa',
  lifestyle: '✨ Lifestyle',
  professional: '👔 Professional',
};

interface DomainSearchProps {
  onSelect?: (domain: DomainSearchResult) => void;
  onAddToCart?: (domain: DomainSearchResult) => void;
  className?: string;
}

export function DomainSearch({ onSelect, onAddToCart, className }: DomainSearchProps) {
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<DomainSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTlds, setSelectedTlds] = useState<string[]>(POPULAR_TLDS);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [showMoreTlds, setShowMoreTlds] = useState(false);
  const router = useRouter();
  
  const performSearch = useCallback(async (searchKeyword: string) => {
    if (!searchKeyword || searchKeyword.length < 2) {
      setResults([]);
      return;
    }
    
    setIsSearching(true);
    setError(null);
    
    try {
      const response = await searchDomains(searchKeyword, selectedTlds);
      if (response.success && response.data) {
        setResults(response.data);
      } else {
        setError(response.error || 'Search failed');
      }
    } catch {
      setError('An error occurred');
    } finally {
      setIsSearching(false);
    }
  }, [selectedTlds]);
  
  const handleKeywordChange = useCallback((value: string) => {
    // Remove spaces and special characters except hyphens
    const cleaned = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setKeyword(cleaned);
    
    // Debounce search
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    const timeout = setTimeout(() => {
      performSearch(cleaned);
    }, 500);
    
    setSearchTimeout(timeout);
  }, [performSearch, searchTimeout]);
  
  const handleManualSearch = () => {
    if (keyword.length >= 2) {
      performSearch(keyword);
    }
  };
  
  const toggleTld = (tld: string) => {
    setSelectedTlds(prev => 
      prev.includes(tld) 
        ? prev.filter(t => t !== tld)
        : [...prev, tld]
    );
  };
  
  const handleSelect = (result: DomainSearchResult) => {
    if (onSelect) {
      onSelect(result);
    } else if (onAddToCart) {
      onAddToCart(result);
    } else {
      // Navigate to cart with domain
      router.push(`/dashboard/domains/cart?domain=${encodeURIComponent(result.domain)}`);
    }
  };
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(DEFAULT_LOCALE, {
      style: 'currency',
      currency: DEFAULT_CURRENCY,
    }).format(price);
  };
  
  return (
    <div className={cn("space-y-6", className)}>
      {/* Search Input */}
      <div className="relative flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search for your perfect domain..."
            value={keyword}
            onChange={(e) => handleKeywordChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
            className="pl-12 pr-12 h-14 text-lg"
          />
          {isSearching && (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-muted-foreground" />
          )}
        </div>
        <Button 
          size="lg" 
          className="h-14 px-6"
          onClick={handleManualSearch}
          disabled={isSearching || keyword.length < 2}
        >
          <Search className="h-5 w-5 mr-2" />
          Search
        </Button>
      </div>
      
      {/* TLD Filter */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground mr-2">Extensions:</span>
          {POPULAR_TLDS.map(tld => (
            <Badge
              key={tld}
              variant={selectedTlds.includes(tld) ? "default" : "outline"}
              className="cursor-pointer transition-colors"
              onClick={() => toggleTld(tld)}
            >
              {tld}
            </Badge>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowMoreTlds(!showMoreTlds)}
            className="ml-2"
          >
            {showMoreTlds ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
            {showMoreTlds ? 'Less' : `More TLDs (${ALL_CATEGORY_ENTRIES.reduce((acc, [, tlds]) => acc + tlds.length, 0)}+)`}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedTlds(POPULAR_TLDS)}
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Reset
          </Button>
        </div>
        
        {showMoreTlds && (
          <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
            {ALL_CATEGORY_ENTRIES.map(([category, tlds]) => (
              <div key={category} className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    {CATEGORY_LABELS[category] || category}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 text-xs px-1.5"
                    onClick={() => {
                      const allSelected = tlds.every(t => selectedTlds.includes(t));
                      if (allSelected) {
                        setSelectedTlds(prev => prev.filter(t => !tlds.includes(t)));
                      } else {
                        setSelectedTlds(prev => [...new Set([...prev, ...tlds])]);
                      }
                    }}
                  >
                    {tlds.every(t => selectedTlds.includes(t)) ? 'Deselect all' : 'Select all'}
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {tlds.map(tld => (
                    <Badge
                      key={tld}
                      variant={selectedTlds.includes(tld) ? "default" : "outline"}
                      className="cursor-pointer transition-colors text-xs"
                      onClick={() => toggleTld(tld)}
                    >
                      {tld}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Error */}
      {error && (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
          {error}
        </div>
      )}
      
      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">
            {results.filter(r => r.available).length} available of {results.length} checked
            {results.some(r => r.unverified) && results.some(r => r.available) && (
              <span className="text-yellow-500 ml-2">
                (Results via DNS lookup — register to confirm)
              </span>
            )}
            {results.some(r => r.unverified) && !results.some(r => r.available) && (
              <span className="text-yellow-500 ml-2">
                (API unavailable — results may be inaccurate)
              </span>
            )}
          </h3>
          
          <div className="grid gap-3">
            {results.map(result => (
              <Card 
                key={result.domain}
                className={cn(
                  "transition-all hover:shadow-md",
                  result.available 
                    ? "border-green-500/50 hover:border-green-500 cursor-pointer" 
                    : result.unverified
                      ? "opacity-70 border-yellow-500/30"
                      : "opacity-60"
                )}
                onClick={() => result.available && handleSelect(result)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {result.available ? (
                        <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                          <Check className="h-5 w-5 text-green-500" />
                        </div>
                      ) : result.unverified ? (
                        <div className="h-10 w-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                          <AlertCircle className="h-5 w-5 text-yellow-500" />
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
                              <Star className="h-3 w-3" />
                              Premium
                            </Badge>
                          )}
                          {result.available && result.unverified && (
                            <Badge variant="outline" className="gap-1 text-yellow-600 border-yellow-500/50">
                              <AlertCircle className="h-3 w-3" />
                              Likely Available
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {result.available 
                            ? (result.unverified ? 'Likely available — register to confirm' : 'Available for registration')
                            : result.unverified
                              ? 'Likely registered — unable to verify via registrar'
                              : 'Already registered'}
                        </p>
                      </div>
                    </div>
                    
                    {result.available && (
                      <div className="text-right flex items-center gap-4">
                        <div>
                          <p className="font-bold text-xl">
                            {formatPrice(result.retailPrices.register[1] || 0)}
                            <span className="text-sm font-normal text-muted-foreground">/year</span>
                          </p>
                          {result.retailPrices.renew[1] && (
                            <p className="text-xs text-muted-foreground">
                              Renews at {formatPrice(result.retailPrices.renew[1])}/yr
                            </p>
                          )}
                        </div>
                        <Button size="sm" className="gap-2">
                          <ShoppingCart className="h-4 w-4" />
                          Add to Cart
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
      
      {/* Empty State */}
      {keyword && keyword.length >= 2 && !isSearching && results.length === 0 && !error && (
        <div className="text-center py-12">
          <Globe className="h-16 w-16 mx-auto text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">No results found</h3>
          <p className="text-muted-foreground mt-1">
            Try a different keyword or select more extensions
          </p>
        </div>
      )}
      
      {/* Initial State */}
      {!keyword && results.length === 0 && !isSearching && (
        <div className="text-center py-12 border-2 border-dashed rounded-lg">
          <Globe className="h-16 w-16 mx-auto text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">Find Your Perfect Domain</h3>
          <p className="text-muted-foreground mt-1 max-w-md mx-auto">
            Enter a keyword above to search for available domains. 
            We&apos;ll check availability across multiple TLDs instantly.
          </p>
        </div>
      )}
    </div>
  );
}
