'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronRight, Sparkles, TrendingUp, Clock, Star, Gift, Building2, Package, Layers } from 'lucide-react';
import { getFeaturedCollections, type ModuleCollection } from '@/lib/modules/marketplace-search';
import { EnhancedModuleCard } from './enhanced-module-card';
import { ModuleIconContainer } from '@/components/modules/shared/module-icon-container';

interface FeaturedCollectionsProps {
  subscribedModuleIds?: string[];
  maxCollections?: number;
  maxModulesPerCollection?: number;
}

const COLLECTION_ICONS: Record<string, React.ReactNode> = {
  'featured': <Sparkles className="h-5 w-5" />,
  'new-releases': <Clock className="h-5 w-5" />,
  'top-rated': <Star className="h-5 w-5" />,
  'most-popular': <TrendingUp className="h-5 w-5" />,
  'free-essentials': <Gift className="h-5 w-5" />,
  'enterprise-suite': <Building2 className="h-5 w-5" />,
};

export function FeaturedCollections({ 
  subscribedModuleIds = [],
  maxCollections = 6,
  maxModulesPerCollection = 4
}: FeaturedCollectionsProps) {
  const [collections, setCollections] = useState<ModuleCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Convert to Set for O(1) lookups
  const subscribedSet = new Set(subscribedModuleIds);

  useEffect(() => {
    async function loadCollections() {
      try {
        const data = await getFeaturedCollections();
        setCollections(data.slice(0, maxCollections));
      } catch (err) {
        console.error('Error loading collections:', err);
        setError('Failed to load collections');
      } finally {
        setLoading(false);
      }
    }
    
    loadCollections();
  }, [maxCollections]);

  if (loading) {
    return (
      <div className="space-y-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((j) => (
                <Skeleton key={j} className="h-64 rounded-lg" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">{error}</p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          Try Again
        </Button>
      </Card>
    );
  }

  // Check if all collections are empty (no modules linked)
  const hasAnyModules = collections.some(c => 
    c.items && c.items.length > 0 && c.items.some(item => item.module)
  );

  if (collections.length === 0 || !hasAnyModules) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Layers className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Collections Coming Soon</h3>
          <p className="text-sm text-muted-foreground max-w-md mb-6">
            We&apos;re curating featured collections of modules to help you discover the best tools for your agency.
            In the meantime, browse all modules using the search tab above.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" asChild>
              <Link href="/marketplace">
                <Package className="h-4 w-4 mr-2" />
                Browse All Modules
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-10">
      {collections.map((collection) => {
        const modules = collection.items
          .map(item => item.module)
          .filter(Boolean)
          .slice(0, maxModulesPerCollection);
        
        if (modules.length === 0) return null;

        const Icon = COLLECTION_ICONS[collection.slug] || <Sparkles className="h-5 w-5" />;

        return (
          <section key={collection.id}>
            {/* Collection Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <ModuleIconContainer icon={collection.icon} size="sm" />
                <div>
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    {Icon}
                    {collection.name}
                  </h2>
                  {collection.description && (
                    <p className="text-sm text-muted-foreground">
                      {collection.description}
                    </p>
                  )}
                </div>
              </div>
              <Button variant="ghost" asChild>
                <Link href={`/marketplace/collections/${collection.slug}`}>
                  View All
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>

            {/* Collection Modules Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {modules.map((module) => (
                <EnhancedModuleCard
                  key={module.id}
                  module={module}
                  isSubscribed={subscribedSet.has(module.id)}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

/**
 * Single collection display component
 */
interface CollectionSectionProps {
  collection: ModuleCollection;
  subscribedModuleIds?: string[];
  maxModules?: number;
}

export function CollectionSection({ 
  collection, 
  subscribedModuleIds = [],
  maxModules = 4
}: CollectionSectionProps) {
  const subscribedSet = new Set(subscribedModuleIds);
  const modules = collection.items
    .map(item => item.module)
    .filter(Boolean)
    .slice(0, maxModules);

  if (modules.length === 0) return null;

  const Icon = COLLECTION_ICONS[collection.slug] || <Sparkles className="h-5 w-5" />;

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ModuleIconContainer icon={collection.icon} size="sm" />
            {Icon}
            {collection.name}
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/marketplace/collections/${collection.slug}`}>
              View All
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
        {collection.description && (
          <p className="text-sm text-muted-foreground">
            {collection.description}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {modules.map((module) => (
            <EnhancedModuleCard
              key={module.id}
              module={module}
              isSubscribed={subscribedSet.has(module.id)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
