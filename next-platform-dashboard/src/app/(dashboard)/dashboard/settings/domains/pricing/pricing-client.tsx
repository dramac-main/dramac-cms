"use client";

// src/app/(dashboard)/dashboard/settings/domains/pricing/pricing-client.tsx
// Client component for pricing page

import { useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAgencyPricingConfig } from "@/lib/actions/domain-billing";
import { 
  DomainPricingConfig, 
  TldPricingTable, 
  ClientPricingTiers,
  MarkupCalculator,
} from "@/components/domains/settings";
import type { AgencyDomainPricing, TldPricingConfig, ClientPricingTier, PricingMarkupType } from "@/types/domain-pricing";

interface PricingPageClientProps {
  initialConfig: Partial<AgencyDomainPricing>;
}

export function PricingPageClient({ initialConfig }: PricingPageClientProps) {
  const [config, setConfig] = useState(initialConfig);
  
  const handleUpdate = useCallback(async () => {
    // Refetch config after update
    const result = await getAgencyPricingConfig();
    if (result.data) {
      setConfig(result.data);
    }
  }, []);
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/settings/domains">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <DollarSign className="h-6 w-6" />
            Pricing Configuration
          </h1>
          <p className="text-muted-foreground">
            Set your markup rates and pricing strategy for domain services
          </p>
        </div>
      </div>
      
      {/* Tabs */}
      <Tabs defaultValue="default" className="space-y-6">
        <TabsList>
          <TabsTrigger value="default">Default Markup</TabsTrigger>
          <TabsTrigger value="tld">TLD Pricing</TabsTrigger>
          <TabsTrigger value="tiers">Client Tiers</TabsTrigger>
          <TabsTrigger value="calculator">Calculator</TabsTrigger>
        </TabsList>
        
        <TabsContent value="default" className="space-y-6">
          <DomainPricingConfig config={config} />
        </TabsContent>
        
        <TabsContent value="tld" className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-2">TLD-Specific Pricing</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Override the default markup for specific TLDs. Useful for premium or promotional pricing.
            </p>
            <TldPricingTable 
              currentConfig={(config.tld_pricing as TldPricingConfig) || {}}
              defaultMarkupType={(config.default_markup_type as PricingMarkupType) || 'percentage'}
              defaultMarkupValue={config.default_markup_value || 30}
              onUpdate={handleUpdate}
            />
          </div>
        </TabsContent>
        
        <TabsContent value="tiers" className="space-y-6">
          <ClientPricingTiers 
            tiers={(config.client_tiers as ClientPricingTier[]) || []}
            onUpdate={handleUpdate}
          />
        </TabsContent>
        
        <TabsContent value="calculator" className="space-y-6">
          <div className="max-w-2xl">
            <MarkupCalculator 
              tldConfig={(config.tld_pricing as TldPricingConfig) || {}}
              defaultMarkupType={(config.default_markup_type as PricingMarkupType) || 'percentage'}
              defaultMarkupValue={config.default_markup_value || 30}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
