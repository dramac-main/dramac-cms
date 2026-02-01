# Phase DM-04: Domain Search & Registration UI

> **Priority**: 🔴 HIGH
> **Estimated Time**: 10 hours
> **Prerequisites**: DM-01, DM-02, DM-03
> **Status**: 📋 READY TO IMPLEMENT

---

## 🎯 Objective

Create a comprehensive domain search, cart, and checkout experience:
1. Domain availability search with TLD suggestions
2. Search results with pricing (wholesale vs retail)
3. Shopping cart for multiple domains
4. Checkout flow with contact information
5. Real-time availability updates
6. Domain suggestions based on keywords

---

## 📁 Files to Create

```
src/app/(dashboard)/dashboard/domains/
├── page.tsx                    # Domain list/overview page
├── search/
│   └── page.tsx               # Domain search page
├── cart/
│   └── page.tsx               # Cart & checkout page
└── [domainId]/
    └── page.tsx               # Single domain management

src/components/domains/
├── domain-search.tsx          # Search input component
├── domain-results.tsx         # Search results display
├── domain-suggestions.tsx     # TLD suggestions
├── domain-pricing-card.tsx    # Pricing display
├── domain-cart.tsx            # Shopping cart
├── domain-checkout.tsx        # Checkout form
├── domain-contact-form.tsx    # Contact information form
├── domain-list.tsx            # Domain list for overview
├── domain-filters.tsx         # Filter/sort controls
└── index.ts                   # Barrel exports

src/lib/actions/
└── domains.ts                 # Server actions for domains

src/hooks/
└── use-domain-search.ts       # Search hook with debouncing
```

---

## 📋 Implementation Tasks

### Task 1: Server Actions (90 mins)

```typescript
// src/lib/actions/domains.ts

"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { domainService, contactService, customerService } from "@/lib/resellerclub";
import { zoneService } from "@/lib/cloudflare";
import type { 
  DomainFilters, 
  DomainWithDetails, 
  DomainSearchResult,
  RegisterDomainParams,
  DomainStats 
} from "@/types/domain";

// ============================================================================
// Search & Availability
// ============================================================================

export async function searchDomains(
  keyword: string,
  tlds?: string[]
): Promise<{ success: boolean; data?: DomainSearchResult[]; error?: string }> {
  const supabase = await createClient();
  
  // Get user's agency for pricing
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('agency_id')
    .eq('id', user.id)
    .single();
  
  if (!profile?.agency_id) return { success: false, error: 'No agency found' };
  
  try {
    // Clean keyword
    const cleanKeyword = keyword.toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (!cleanKeyword || cleanKeyword.length < 2) {
      return { success: false, error: 'Keyword must be at least 2 characters' };
    }
    
    // Get availability from ResellerClub
    const availability = await domainService.suggestDomains(cleanKeyword, tlds);
    
    // Get pricing
    const uniqueTlds = [...new Set(availability.map(d => '.' + d.domain.split('.').pop()))];
    const pricing = await domainService.getPricing(uniqueTlds);
    
    // Get agency pricing config
    const { data: pricingConfigs } = await supabase
      .from('domain_pricing')
      .select('*')
      .eq('agency_id', profile.agency_id);
    
    // Build results with retail pricing
    const results: DomainSearchResult[] = availability.map(item => {
      const tld = '.' + item.domain.split('.').pop();
      const wholesalePrice = pricing[tld];
      
      // Calculate retail based on agency config
      const config = pricingConfigs?.find(c => c.tld === tld) || 
                     pricingConfigs?.find(c => c.tld === null);
      
      const calculateRetail = (wholesale: number): number => {
        if (!config) return wholesale * 1.3; // Default 30% markup
        
        switch (config.markup_type) {
          case 'percentage':
            return wholesale * (1 + config.markup_value / 100);
          case 'fixed':
            return wholesale + config.markup_value;
          case 'custom':
            return config.markup_value;
          default:
            return wholesale * 1.3;
        }
      };
      
      return {
        domain: item.domain,
        tld,
        available: item.status === 'available',
        premium: item.status === 'premium',
        prices: {
          register: wholesalePrice?.register || {},
          renew: wholesalePrice?.renew || {},
          transfer: wholesalePrice?.transfer || 0,
        },
        retailPrices: {
          register: Object.fromEntries(
            Object.entries(wholesalePrice?.register || {}).map(
              ([years, price]) => [years, calculateRetail(price as number)]
            )
          ) as Record<number, number>,
          renew: Object.fromEntries(
            Object.entries(wholesalePrice?.renew || {}).map(
              ([years, price]) => [years, calculateRetail(price as number)]
            )
          ) as Record<number, number>,
          transfer: calculateRetail(wholesalePrice?.transfer || 0),
        },
      };
    });
    
    // Sort: available first, then by price
    results.sort((a, b) => {
      if (a.available && !b.available) return -1;
      if (!a.available && b.available) return 1;
      return (a.retailPrices.register[1] || 0) - (b.retailPrices.register[1] || 0);
    });
    
    return { success: true, data: results };
  } catch (error) {
    console.error('[Domains] Search error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Search failed' 
    };
  }
}

export async function checkDomainAvailability(domainName: string) {
  try {
    const result = await domainService.checkAvailability(domainName);
    return { 
      success: true, 
      data: {
        domain: result.domain,
        available: result.status === 'available',
        premium: result.status === 'premium',
      }
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Check failed' 
    };
  }
}

// ============================================================================
// Registration
// ============================================================================

export async function registerDomain(params: RegisterDomainParams) {
  const supabase = await createClient();
  const admin = createAdminClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('agency_id')
    .eq('id', user.id)
    .single();
  
  if (!profile?.agency_id) return { success: false, error: 'No agency found' };
  
  try {
    // Get or create ResellerClub customer
    let customerId: string;
    
    const { data: existingCustomer } = await admin
      .from('agencies')
      .select('resellerclub_customer_id')
      .eq('id', profile.agency_id)
      .single();
    
    if (existingCustomer?.resellerclub_customer_id) {
      customerId = existingCustomer.resellerclub_customer_id;
    } else {
      // Create new customer
      const customer = await customerService.create({
        username: `agency_${profile.agency_id}@dramac.app`,
        password: crypto.randomUUID(),
        name: params.contactInfo.name,
        email: params.contactInfo.email,
        company: params.contactInfo.company,
        addressLine1: params.contactInfo.address,
        city: params.contactInfo.city,
        state: params.contactInfo.state,
        country: params.contactInfo.country,
        zipcode: params.contactInfo.zipcode,
        phoneCountryCode: params.contactInfo.phone.slice(0, 3),
        phone: params.contactInfo.phone.slice(3),
      });
      customerId = customer.customerId;
      
      // Save customer ID
      await admin
        .from('agencies')
        .update({ resellerclub_customer_id: customerId })
        .eq('id', profile.agency_id);
    }
    
    // Get or create contact
    const contact = await contactService.create({
      customerId,
      name: params.contactInfo.name,
      email: params.contactInfo.email,
      company: params.contactInfo.company,
      addressLine1: params.contactInfo.address,
      city: params.contactInfo.city,
      state: params.contactInfo.state,
      country: params.contactInfo.country,
      zipcode: params.contactInfo.zipcode,
      phoneCountryCode: params.contactInfo.phone.slice(0, 3),
      phone: params.contactInfo.phone.slice(3),
    });
    
    // Register domain
    const registration = await domainService.register({
      domainName: params.domainName,
      years: params.years,
      customerId,
      registrantContactId: contact.contactId,
      adminContactId: contact.contactId,
      techContactId: contact.contactId,
      billingContactId: contact.contactId,
      purchasePrivacy: params.privacy ?? true,
      autoRenew: params.autoRenew ?? true,
      nameservers: params.customNameservers,
    });
    
    // Parse domain
    const parts = params.domainName.split('.');
    const tld = '.' + parts.pop();
    const sld = parts.join('.');
    
    // Get details for dates
    const details = await domainService.getDetails(registration.orderId);
    
    // Create domain record
    const { data: domain, error: insertError } = await admin
      .from('domains')
      .insert({
        agency_id: profile.agency_id,
        client_id: params.clientId || null,
        domain_name: params.domainName.toLowerCase(),
        tld,
        sld,
        resellerclub_order_id: registration.orderId,
        resellerclub_customer_id: customerId,
        registration_date: details.creationDate,
        expiry_date: details.expiryDate,
        status: 'active',
        auto_renew: params.autoRenew ?? true,
        whois_privacy: params.privacy ?? true,
        registrant_contact_id: contact.contactId,
        admin_contact_id: contact.contactId,
        tech_contact_id: contact.contactId,
        billing_contact_id: contact.contactId,
        nameservers: details.nameservers,
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('[Domains] Insert error:', insertError);
    }
    
    // Create order record
    await admin
      .from('domain_orders')
      .insert({
        agency_id: profile.agency_id,
        domain_id: domain?.id,
        order_type: 'registration',
        domain_name: params.domainName,
        years: params.years,
        wholesale_price: 0, // Would calculate from pricing
        retail_price: 0,
        resellerclub_order_id: registration.orderId,
        status: 'completed',
        payment_status: 'paid',
        completed_at: new Date().toISOString(),
      });
    
    // Auto-setup Cloudflare DNS
    if (domain) {
      try {
        const zone = await zoneService.createZone({ name: params.domainName });
        
        await admin
          .from('domains')
          .update({
            cloudflare_zone_id: zone.id,
            nameservers: zone.nameServers,
          })
          .eq('id', domain.id);
        
        // Store zone
        await admin
          .from('cloudflare_zones')
          .insert({
            domain_id: domain.id,
            zone_id: zone.id,
            name: zone.name,
            status: zone.status,
            assigned_nameservers: zone.nameServers,
          });
      } catch (cfError) {
        console.error('[Domains] Cloudflare setup error:', cfError);
        // Non-fatal - domain is registered, DNS can be set up later
      }
    }
    
    revalidatePath('/dashboard/domains');
    
    return { 
      success: true, 
      data: {
        domainId: domain?.id,
        orderId: registration.orderId,
        domain: params.domainName,
      }
    };
  } catch (error) {
    console.error('[Domains] Registration error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Registration failed' 
    };
  }
}

// ============================================================================
// Domain List & Management
// ============================================================================

export async function getDomains(filters?: DomainFilters) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated', data: [] };
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('agency_id')
    .eq('id', user.id)
    .single();
  
  if (!profile?.agency_id) return { success: false, error: 'No agency', data: [] };
  
  let query = supabase
    .from('domains')
    .select(`
      *,
      client:clients(id, name, company),
      site:sites(id, name, subdomain)
    `)
    .eq('agency_id', profile.agency_id);
  
  // Apply filters
  if (filters?.search) {
    query = query.ilike('domain_name', `%${filters.search}%`);
  }
  
  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }
  
  if (filters?.tld) {
    query = query.eq('tld', filters.tld);
  }
  
  if (filters?.clientId) {
    query = query.eq('client_id', filters.clientId);
  }
  
  if (filters?.expiringWithinDays) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + filters.expiringWithinDays);
    query = query
      .gte('expiry_date', new Date().toISOString())
      .lte('expiry_date', futureDate.toISOString());
  }
  
  // Sorting
  const sortBy = filters?.sortBy || 'created_at';
  const sortOrder = filters?.sortOrder || 'desc';
  query = query.order(sortBy, { ascending: sortOrder === 'asc' });
  
  // Pagination
  const page = filters?.page || 1;
  const limit = filters?.limit || 20;
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);
  
  const { data, error, count } = await query;
  
  if (error) {
    console.error('[Domains] List error:', error);
    return { success: false, error: error.message, data: [] };
  }
  
  return { 
    success: true, 
    data: data as DomainWithDetails[],
    total: count || data.length,
    page,
    limit,
  };
}

export async function getDomainStats(): Promise<{ success: boolean; data?: DomainStats; error?: string }> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('agency_id')
    .eq('id', user.id)
    .single();
  
  if (!profile?.agency_id) return { success: false, error: 'No agency' };
  
  try {
    // Get counts
    const { count: total } = await supabase
      .from('domains')
      .select('*', { count: 'exact', head: true })
      .eq('agency_id', profile.agency_id);
    
    const { count: active } = await supabase
      .from('domains')
      .select('*', { count: 'exact', head: true })
      .eq('agency_id', profile.agency_id)
      .eq('status', 'active');
    
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    const { count: expiringSoon } = await supabase
      .from('domains')
      .select('*', { count: 'exact', head: true })
      .eq('agency_id', profile.agency_id)
      .eq('status', 'active')
      .lte('expiry_date', thirtyDaysFromNow.toISOString())
      .gte('expiry_date', new Date().toISOString());
    
    const { count: expired } = await supabase
      .from('domains')
      .select('*', { count: 'exact', head: true })
      .eq('agency_id', profile.agency_id)
      .eq('status', 'expired');
    
    const { count: totalEmails } = await supabase
      .from('domain_email_accounts')
      .select('*', { count: 'exact', head: true })
      .eq('agency_id', profile.agency_id);
    
    const { data: domainsWithEmail } = await supabase
      .from('domains')
      .select('id')
      .eq('agency_id', profile.agency_id)
      .not('id', 'is', null);
    
    return {
      success: true,
      data: {
        total: total || 0,
        active: active || 0,
        expiringSoon: expiringSoon || 0,
        expired: expired || 0,
        totalEmails: totalEmails || 0,
        domainsWithEmail: domainsWithEmail?.length || 0,
      },
    };
  } catch (error) {
    console.error('[Domains] Stats error:', error);
    return { success: false, error: 'Failed to get stats' };
  }
}

// ============================================================================
// Renewal
// ============================================================================

export async function renewDomain(domainId: string, years: number) {
  const supabase = await createClient();
  const admin = createAdminClient();
  
  const { data: domain, error } = await supabase
    .from('domains')
    .select('*')
    .eq('id', domainId)
    .single();
  
  if (error || !domain) {
    return { success: false, error: 'Domain not found' };
  }
  
  if (!domain.resellerclub_order_id) {
    return { success: false, error: 'Domain not registered through platform' };
  }
  
  try {
    const renewal = await domainService.renew({
      orderId: domain.resellerclub_order_id,
      years,
    });
    
    // Get updated details
    const details = await domainService.getDetails(domain.resellerclub_order_id);
    
    // Update domain
    await admin
      .from('domains')
      .update({
        expiry_date: details.expiryDate,
        last_renewed_at: new Date().toISOString(),
      })
      .eq('id', domainId);
    
    // Create order record
    await admin
      .from('domain_orders')
      .insert({
        agency_id: domain.agency_id,
        domain_id: domainId,
        order_type: 'renewal',
        domain_name: domain.domain_name,
        years,
        wholesale_price: 0,
        retail_price: 0,
        resellerclub_order_id: renewal.orderId,
        status: 'completed',
        payment_status: 'paid',
        completed_at: new Date().toISOString(),
      });
    
    revalidatePath(`/dashboard/domains/${domainId}`);
    revalidatePath('/dashboard/domains');
    
    return { success: true, data: { newExpiryDate: details.expiryDate } };
  } catch (error) {
    console.error('[Domains] Renewal error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Renewal failed' 
    };
  }
}
```

### Task 2: Domain Search Component (60 mins)

```typescript
// src/components/domains/domain-search.tsx

"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, Globe, Check, X, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useDebouncedCallback } from "@/lib/editor/performance";
import { searchDomains } from "@/lib/actions/domains";
import type { DomainSearchResult } from "@/types/domain";

const POPULAR_TLDS = ['.com', '.net', '.org', '.io', '.co', '.app', '.dev'];

interface DomainSearchProps {
  onSelect?: (domain: DomainSearchResult) => void;
  className?: string;
}

export function DomainSearch({ onSelect, className }: DomainSearchProps) {
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<DomainSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTlds, setSelectedTlds] = useState<string[]>(POPULAR_TLDS);
  const router = useRouter();
  
  const performSearch = useDebouncedCallback(async (searchKeyword: string) => {
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
  }, 500);
  
  const handleKeywordChange = useCallback((value: string) => {
    // Remove spaces and special characters except hyphens
    const cleaned = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setKeyword(cleaned);
    performSearch(cleaned);
  }, [performSearch]);
  
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
    } else {
      // Navigate to cart with domain
      router.push(`/dashboard/domains/cart?domain=${encodeURIComponent(result.domain)}`);
    }
  };
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };
  
  return (
    <div className={cn("space-y-6", className)}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search for your perfect domain..."
          value={keyword}
          onChange={(e) => handleKeywordChange(e.target.value)}
          className="pl-12 pr-12 h-14 text-lg"
        />
        {isSearching && (
          <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-muted-foreground" />
        )}
      </div>
      
      {/* TLD Filter */}
      <div className="flex flex-wrap gap-2">
        <span className="text-sm text-muted-foreground mr-2">Extensions:</span>
        {POPULAR_TLDS.map(tld => (
          <Badge
            key={tld}
            variant={selectedTlds.includes(tld) ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => toggleTld(tld)}
          >
            {tld}
          </Badge>
        ))}
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
          </h3>
          
          <div className="grid gap-3">
            {results.map(result => (
              <Card 
                key={result.domain}
                className={cn(
                  "transition-all cursor-pointer hover:shadow-md",
                  result.available 
                    ? "border-green-500/50 hover:border-green-500" 
                    : "opacity-60"
                )}
                onClick={() => result.available && handleSelect(result)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {result.available ? (
                        <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center">
                          <Check className="h-4 w-4 text-green-500" />
                        </div>
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                          <X className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{result.domain}</span>
                          {result.premium && (
                            <Badge variant="secondary" className="gap-1">
                              <Star className="h-3 w-3" />
                              Premium
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {result.available ? 'Available' : 'Taken'}
                        </p>
                      </div>
                    </div>
                    
                    {result.available && (
                      <div className="text-right">
                        <p className="font-bold text-lg">
                          {formatPrice(result.retailPrices.register[1] || 0)}
                          <span className="text-sm font-normal text-muted-foreground">/yr</span>
                        </p>
                        <Button size="sm" className="mt-2">
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
        <div className="text-center py-8">
          <Globe className="h-12 w-12 mx-auto text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">No results found</h3>
          <p className="text-muted-foreground">
            Try a different keyword or select more extensions
          </p>
        </div>
      )}
    </div>
  );
}
```

### Task 3: Domain Cart Component (60 mins)

```typescript
// src/components/domains/domain-cart.tsx

"use client";

import { useState } from "react";
import { Trash2, ShoppingCart, Shield, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { DomainCartItem, DomainCart } from "@/types/domain";

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
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };
  
  const calculateTotals = (): DomainCart => {
    let subtotal = 0;
    
    items.forEach(item => {
      subtotal += item.retailPrice * item.years;
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
      currency: 'USD',
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
          <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">Your cart is empty</h3>
          <p className="text-muted-foreground">
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
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-lg">{item.domainName}</h4>
                  <p className="text-sm text-muted-foreground capitalize">
                    {item.type}
                  </p>
                </div>
                
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  onClick={() => onRemoveItem(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="mt-4 grid grid-cols-2 gap-4">
                {/* Years Selection */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
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
                      <SelectItem value="1">1 Year</SelectItem>
                      <SelectItem value="2">2 Years</SelectItem>
                      <SelectItem value="3">3 Years</SelectItem>
                      <SelectItem value="5">5 Years</SelectItem>
                      <SelectItem value="10">10 Years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Privacy Protection */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    WHOIS Privacy
                  </Label>
                  <div className="flex items-center justify-between p-3 border rounded-md">
                    <span className="text-sm">
                      {formatPrice(item.privacyPrice)}/yr
                    </span>
                    <Switch
                      checked={item.privacy}
                      onCheckedChange={(checked) => onUpdateItem(index, { privacy: checked })}
                    />
                  </div>
                </div>
              </div>
              
              {/* Item Price */}
              <div className="mt-4 pt-4 border-t flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold">
                  {formatPrice(
                    (item.retailPrice + (item.privacy ? item.privacyPrice : 0)) * item.years
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
          <CardTitle>Order Summary</CardTitle>
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
        <CardFooter>
          <Button 
            className="w-full" 
            size="lg"
            onClick={handleCheckout}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : 'Proceed to Checkout'}
          </Button>
        </CardFooter>
      </Card>
      
      {/* Trust Badges */}
      <div className="grid grid-cols-3 gap-4 text-center text-xs text-muted-foreground">
        <div>
          <Shield className="h-6 w-6 mx-auto mb-1" />
          Secure Checkout
        </div>
        <div>
          <Clock className="h-6 w-6 mx-auto mb-1" />
          Instant Activation
        </div>
        <div>
          <ShoppingCart className="h-6 w-6 mx-auto mb-1" />
          Money Back Guarantee
        </div>
      </div>
    </div>
  );
}
```

### Task 4: Domain Contact Form (45 mins)

```typescript
// src/components/domains/domain-contact-form.tsx

"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'IN', name: 'India' },
  { code: 'ZM', name: 'Zambia' },
  // Add more as needed
];

const contactSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  company: z.string().optional(),
  address: z.string().min(5, "Address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State/Province is required"),
  country: z.string().length(2, "Select a country"),
  zipcode: z.string().min(3, "Postal code is required"),
  phone: z.string().min(10, "Phone number is required"),
});

export type ContactFormData = z.infer<typeof contactSchema>;

interface DomainContactFormProps {
  onSubmit: (data: ContactFormData) => void;
  defaultValues?: Partial<ContactFormData>;
  isSubmitting?: boolean;
}

export function DomainContactForm({
  onSubmit,
  defaultValues,
  isSubmitting,
}: DomainContactFormProps) {
  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      company: "",
      address: "",
      city: "",
      state: "",
      country: "US",
      zipcode: "",
      phone: "",
      ...defaultValues,
    },
  });
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Contact Information</CardTitle>
        <CardDescription>
          This information will be used for domain registration and WHOIS records.
          Privacy protection will hide this from public WHOIS lookups.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="company"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Acme Inc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address *</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Main Street" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City *</FormLabel>
                    <FormControl>
                      <Input placeholder="New York" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State/Province *</FormLabel>
                    <FormControl>
                      <Input placeholder="NY" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {COUNTRIES.map(country => (
                          <SelectItem key={country.code} value={country.code}>
                            {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="zipcode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Postal Code *</FormLabel>
                    <FormControl>
                      <Input placeholder="10001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number *</FormLabel>
                  <FormControl>
                    <Input 
                      type="tel" 
                      placeholder="+1 234 567 8900" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Processing...' : 'Complete Registration'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
```

---

## ✅ Completion Checklist

- [ ] Domain search server action with pricing
- [ ] Domain registration server action
- [ ] Domain list/filter server action
- [ ] Domain stats server action
- [ ] Domain renewal server action
- [ ] Domain search UI component
- [ ] Domain results display component
- [ ] Domain cart component
- [ ] Domain contact form component
- [ ] Domain list page (`/dashboard/domains`)
- [ ] Domain search page (`/dashboard/domains/search`)
- [ ] Domain cart/checkout page (`/dashboard/domains/cart`)
- [ ] Barrel exports for components
- [ ] TypeScript compiles with zero errors

---

## 📚 References

- [Phase DM-01](./PHASE-DM-01-RESELLERCLUB-INTEGRATION.md) - ResellerClub API
- [Phase DM-02](./PHASE-DM-02-DOMAIN-DATABASE-SCHEMA.md) - Database Schema
- [Phase DM-03](./PHASE-DM-03-CLOUDFLARE-DNS-INTEGRATION.md) - Cloudflare DNS
